/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * TSK-015-N09 (spec-003 RF-17.2, RF-17.4, RF-17.7 v1.6.6): carta firmada por versiones.
 * Endpoints /api/resolutions/convocatorias/:id/protocolos/:cpId/cartas en ceish_test_db.
 * Almacenamiento simulado en memoria (sin S3). Login real de SECRETARIA e INVESTIGADOR con
 * contraseña generada en cada ejecución (no se imprime). Residuos = 0. Solo ceish_test_db.
 */

jest.mock('../src/shared/middleware/dos-defense.config', () => ({
  ...jest.requireActual('../src/shared/middleware/dos-defense.config'),
  DOS_DEFENSE_CONFIG: {
    ...jest.requireActual('../src/shared/middleware/dos-defense.config')
      .DOS_DEFENSE_CONFIG,
    MAX_PETICIONES: 10_000,
    MAX_PETICIONES_AUTH: 10_000,
    MAX_PETICIONES_MEDIA: 10_000,
    MAX_INFRACCIONES: 10_000,
    DURACION_BLOQUEO_MS: 0,
  },
}));

process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_CAR_';
const EMAIL_DOMAIN = '@e2e-car.test';
const TIPO_IO = 5;
const TIPO_EX = 8;
const ESTADO_EN_CONTROL = 21;
const ESTADO_APROBADO = 17;
const PDF = Buffer.from('%PDF-1.4\n% contenido de prueba\n%%EOF\n', 'latin1');
const NO_PDF = Buffer.from('<html>no es un pdf</html>', 'latin1');

interface Objeto {
  contentType: string;
  bytes: Buffer;
}

describe('Carta firmada por versiones — TSK-015-N09 (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let investigadorToken: string;
  let presidenteToken: string;
  let investigadorId: number;
  let convocatoriaId: string;
  let cpId: string;
  let cpExId: string;
  let cpSinResultadoId: string;
  let protocoloId: number;
  let protocoloExId: number;
  let protocoloSinResId: number;
  const objetos = new Map<string, Objeto>();
  const emailSpy = jest.fn().mockResolvedValue(undefined);
  const deleteSpy = jest.fn((clave: string) => {
    objetos.delete(clave);
    return Promise.resolve();
  });

  const api = () => request(app.getHttpServer());
  const base = (cp = () => cpId) =>
    `/api/resolutions/convocatorias/${convocatoriaId}/protocolos/${cp()}/cartas`;

  /** Simula la subida directa al bucket que hace el cliente tras upload-url. */
  function subirAlBucket(
    clave: string,
    bytes: Buffer,
    contentType = 'application/pdf',
  ) {
    objetos.set(clave, { contentType, bytes });
  }

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM resolucion.cartas_firmadas WHERE convocatoria_protocolo_id IN
         (SELECT cp.id FROM evaluacion.convocatoria_protocolos cp
            JOIN public.protocolos p ON p.id = cp.protocolo_id
           WHERE p.titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM resolucion.resoluciones WHERE protocolo_id IN
         (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN
         (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN
           (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'))`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos WHERE protocolo_id IN
         (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
    );
    // Dictámenes sembrados por convocatoriaProtocolo (TSK-015-N27-6): evaluaciones y asignaciones de las versiones.
    await ds.query(
      `DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN
         (SELECT a.id FROM evaluacion.asignaciones_evaluacion a
            JOIN public.versiones_protocolo v ON v.id = a.version_id
            JOIN public.protocolos p ON p.id = v.protocolo_id
           WHERE p.titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN
         (SELECT v.id FROM public.versiones_protocolo v
            JOIN public.protocolos p ON p.id = v.protocolo_id
           WHERE p.titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN
         (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE $1`,
      [`${PREFIX}%`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_DOMAIN}`],
    );
  }

  async function protocolo(tipo: number, nombre: string): Promise<number> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id, tipo_estudio_id, estado_id, version)
       VALUES ($1, $2, $3, $4, 1) RETURNING id`,
      [`${PREFIX}${nombre}`, investigadorId, tipo, ESTADO_EN_CONTROL],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [p.id, ESTADO_EN_CONTROL],
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [v.id, p.id],
    );
    return p.id;
  }

  /** Dictámenes que siembra cada resultado del pleno (RF-17.1 v1.6.8: se calcula, no se registra). */
  const DICTAMENES: Record<string, number[]> = {
    APROBADO_DEFINITIVO: [1, 1, 1],
    APROBADO_CON_CONDICION: [1, 2, 1],
    NO_APROBADO: [3, 3, 3],
    MEZCLA_3_1_NO: [1, 1, 1, 3],
  };

  async function convocatoriaProtocolo(
    protocoloIdParam: number,
    resultado: string | null,
    orden: number,
    textos: { motivo?: string; observaciones?: string } = {},
    // TSK-015-N27-6 (v1.6.9): convocatoria de la fila; por defecto la del bloque principal.
    convocatoriaIdParam: string = convocatoriaId,
  ): Promise<string> {
    const [vid] = await ds.query(
      `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
      [protocoloIdParam],
    );
    // TSK-015-N27-6: el resultado sale de los dictámenes (no de dictamen_resultado). Las columnas de
    // texto quedan como datos heredados; ya no se escribe dictamen_resultado.
    const [cp] = await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, fecha_plazo_normativo, orden,
          dictamen_motivo, dictamen_observaciones)
       VALUES ($1, $2, $3, CURRENT_DATE + 30, $4, $5, $6) RETURNING id`,
      [
        convocatoriaIdParam,
        protocoloIdParam,
        vid.version_actual_id,
        orden,
        textos.motivo ?? null,
        textos.observaciones ?? null,
      ],
    );
    // Dictámenes de los evaluadores (1 APROBADO, 2 APROBADO_CON_OBSERVACIONES, 3 RECHAZADO).
    // null = sin asignaciones activas → el resultado está pendiente.
    const dictamenes = resultado === null ? [] : DICTAMENES[resultado];
    for (const resultadoId of dictamenes) {
      const [asignacion] = await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ($1, $2, 7) RETURNING id`,
        [vid.version_actual_id, investigadorId],
      );
      await ds.query(
        `INSERT INTO evaluacion.evaluaciones (asignacion_id, resultado_id) VALUES ($1, $2)`,
        [asignacion.id, resultadoId],
      );
    }
    return cp.id;
  }

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || '';
    if (!dbName.includes('test')) {
      throw new Error(
        `ABORT: Solo se permite ceish_test_db. DB recibida: '${dbName}'`,
      );
    }

    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
        sendAccountInvitation: jest.fn().mockResolvedValue(undefined),
        sendResolutionEmail: emailSpy,
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        generateUploadUrl: jest.fn((clave: string) =>
          Promise.resolve(`https://upload.test/${clave}`),
        ),
        getDownloadUrl: jest
          .fn()
          .mockResolvedValue('https://download.test/f.pdf'),
        getMetadata: jest.fn((clave: string) => {
          const o = objetos.get(clave);
          if (!o) return Promise.reject(new Error('NoSuchKey'));
          return Promise.resolve({
            contentType: o.contentType,
            contentLength: o.bytes.length,
          });
        }),
        readRange: jest.fn((clave: string, start: number, end: number) => {
          const o = objetos.get(clave);
          if (!o) return Promise.reject(new Error('NoSuchKey'));
          return Promise.resolve(o.bytes.subarray(start, end + 1));
        }),
        deleteFile: deleteSpy,
        uploadFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    ds = app.get(DataSource);
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!String(current_database).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();

    // Contraseña generada en cada ejecución; no se imprime ni se guarda.
    const password = `${randomBytes(18).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(password, 10);
    const crearUsuario = async (key: string, cedula: string, rol: string) => {
      const [row] = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        [
          cedula,
          `${PREFIX}${key}`,
          `${key.toLowerCase()}${EMAIL_DOMAIN}`,
          hash,
        ],
      );
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
         SELECT $1, id FROM catalogos.roles WHERE codigo = $2`,
        [row.id, rol],
      );
      return row.id as number;
    };
    await crearUsuario('SECRETARIA', 'ZZCARSEC', 'SECRETARIA');
    investigadorId = await crearUsuario(
      'INVESTIGADOR',
      'ZZCARINV',
      'INVESTIGADOR',
    );
    await crearUsuario('PRESIDENTE', 'ZZCARPRE', 'PRESIDENTE');

    const login = async (key: string) => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: `${key.toLowerCase()}${EMAIL_DOMAIN}`, password });
      const token: unknown = res.body?.data?.access_token;
      if (res.status !== 201 || typeof token !== 'string') {
        throw new Error(`Login de ${key} falló con status ${res.status}`);
      }
      return token;
    };
    secretariaToken = await login('SECRETARIA');
    investigadorToken = await login('INVESTIGADOR');
    presidenteToken = await login('PRESIDENTE');

    const [conv] = await ds.query(
      `INSERT INTO evaluacion.convocatorias (numero_convocatoria, fecha_reunion)
       VALUES ($1, now() - interval '10 days') RETURNING id`,
      [`${PREFIX}${randomBytes(4).toString('hex')}`],
    );
    convocatoriaId = conv.id;

    protocoloId = await protocolo(TIPO_IO, 'io');
    cpId = await convocatoriaProtocolo(protocoloId, 'APROBADO_DEFINITIVO', 1);
    protocoloExId = await protocolo(TIPO_EX, 'ex');
    cpExId = await convocatoriaProtocolo(
      protocoloExId,
      'APROBADO_DEFINITIVO',
      2,
    );
    protocoloSinResId = await protocolo(TIPO_IO, 'sinres');
    cpSinResultadoId = await convocatoriaProtocolo(protocoloSinResId, null, 3);
  });

  afterAll(async () => {
    if (ds) {
      await cleanup();
      const [r] = await ds.query(
        `SELECT (SELECT count(*)::int FROM resolucion.cartas_firmadas
                  WHERE convocatoria_protocolo_id::text IN ($1, $2, $3)) AS cartas,
                (SELECT count(*)::int FROM public.protocolos WHERE titulo LIKE $4) AS protocolos`,
        [cpId, cpExId, cpSinResultadoId, `${PREFIX}%`],
      );
      if (r.cartas !== 0 || r.protocolos !== 0) {
        throw new Error(`Residuos tras la prueba: ${JSON.stringify(r)}`);
      }
    }
    await app?.close();
  });

  describe('upload-url (RF-17.4)', () => {
    it('400 si el cliente envía anexoCodigo: el anexo lo deriva el backend (TSK-015-N27-6)', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_14' });
      expect(res.status).toBe(400);
    });

    it('409 para EX: el estudio exento no tiene carta de resolución', async () => {
      const res = await api()
        .post(`${base(() => cpExId)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
    });

    it('409 si el protocolo no tiene resultado del pleno', async () => {
      const res = await api()
        .post(`${base(() => cpSinResultadoId)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
    });

    it('devuelve una clave con el prefijo de la versión 1 y URL de subida', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(201);
      const datos = res.body.data;
      expect(datos.numeroVersion).toBe(1);
      expect(datos.claveArchivo).toMatch(
        new RegExp(
          `^protocols/${protocoloId}/resolutions/${cpId}/v1/[0-9a-f-]+\\.pdf$`,
        ),
      );
      expect(datos.uploadUrl).toContain('https://upload.test/');
    });

    it('400 «Identificador inválido.» si un id de ruta no es UUID (TSK-015-N25)', async () => {
      const res = await api()
        .post(
          `/api/resolutions/convocatorias/no-es-uuid/protocolos/${cpId}/cartas/upload-url`,
        )
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Identificador inválido.');
    });

    it('403 para INVESTIGADOR (no tiene RESOLUCION_CREAR)', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${investigadorToken}`)
        .send({});
      expect(res.status).toBe(403);
    });
  });

  describe('registro de versiones (RF-17.4)', () => {
    let claveV1: string;
    let claveV2: string;

    it('400 si la clave no corresponde a esta carta (prefijo ajeno)', async () => {
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({
          claveArchivo: `protocols/${protocoloId}/resolutions/otro/v1/x.pdf`,
        });
      expect(res.status).toBe(400);
    });

    it('400 y borra el objeto si el archivo no es un PDF real (cabecera %PDF-)', async () => {
      const up = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, NO_PDF);
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(res.status).toBe(400);
      expect(deleteSpy).toHaveBeenCalledWith(clave);
      expect(objetos.has(clave)).toBe(false);
    });

    it('201 registra la versión 1, fija estado 17 y envía el correo sin adjuntos extra', async () => {
      const up = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      claveV1 = up.body.data.claveArchivo as string;
      subirAlBucket(claveV1, PDF);
      jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(new Response(PDF, { status: 200 })),
        );

      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: claveV1 });
      expect(res.status).toBe(201);
      expect(res.body.data.numeroVersion).toBe(1);
      expect(res.body.data.vigente).toBe(true);

      // Mismo efecto que el legacy al aprobar (resolutions.service.ts:203-210): estado 17,
      // fecha_aprobacion = hoy en America/Guayaquil y version + 1.
      const [p] = await ds.query(
        `SELECT p.estado_id, p.version,
                to_char(p.fecha_aprobacion, 'YYYY-MM-DD') AS fecha_aprobacion,
                to_char((now() AT TIME ZONE 'America/Guayaquil')::date, 'YYYY-MM-DD') AS hoy
           FROM public.protocolos p WHERE p.id = $1`,
        [protocoloId],
      );
      expect(p.estado_id).toBe(ESTADO_APROBADO);
      expect(p.fecha_aprobacion).toBe(p.hoy);
      expect(p.version).toBe(2);
      expect(emailSpy).toHaveBeenCalledTimes(1);
      expect(emailSpy.mock.calls[0]).toHaveLength(6);
    });

    it('400 si la versión 2 no trae motivo de reemplazo', async () => {
      const up = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      claveV2 = up.body.data.claveArchivo as string;
      subirAlBucket(claveV2, PDF);
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: claveV2 });
      expect(res.status).toBe(400);
    });

    it('201 registra la versión 2 con motivo, deja la 1 no vigente y el protocolo sigue en 17', async () => {
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({
          claveArchivo: claveV2,
          motivoReemplazo: 'Corrección de firma del presidente',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.numeroVersion).toBe(2);

      const filas = await ds.query(
        `SELECT numero_version, vigente FROM resolucion.cartas_firmadas
          WHERE convocatoria_protocolo_id = $1 ORDER BY numero_version`,
        [cpId],
      );
      expect(filas).toEqual([
        { numero_version: 1, vigente: false },
        { numero_version: 2, vigente: true },
      ]);
      expect(emailSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('lectura (RF-17.7)', () => {
    it('el investigador principal ve la vigente sin subidoPor ni motivoReemplazo', async () => {
      const res = await api()
        .get(`${base()}/vigente`)
        .set('Authorization', `Bearer ${investigadorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.numeroVersion).toBe(2);
      expect(res.body.data).not.toHaveProperty('subidoPor');
      expect(res.body.data).not.toHaveProperty('motivoReemplazo');
    });

    it('el investigador recibe 404 en el historial', async () => {
      const res = await api()
        .get(base())
        .set('Authorization', `Bearer ${investigadorToken}`);
      expect(res.status).toBe(404);
    });

    it('la secretaría con RESOLUCION_HISTORIAL ve el historial completo', async () => {
      const res = await api()
        .get(base())
        .set('Authorization', `Bearer ${secretariaToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty(
        'motivoReemplazo',
        'Corrección de firma del presidente',
      );
    });
  });

  describe('ANEXO_15 y puente con resoluciones (TSK-015-N13, RF-17.5)', () => {
    let protocoloCond: number;
    let cpCond: string;
    let protocoloRech: number;
    let cpRech: string;
    let fetchSpy: jest.SpyInstance;

    const url = (cp: string) =>
      `/api/resolutions/convocatorias/${convocatoriaId}/protocolos/${cp}/cartas`;

    beforeAll(async () => {
      protocoloCond = await protocolo(TIPO_IO, 'cond');
      cpCond = await convocatoriaProtocolo(
        protocoloCond,
        'APROBADO_CON_CONDICION',
        4,
        { observaciones: `${PREFIX}observaciones` },
      );
      protocoloRech = await protocolo(TIPO_IO, 'rech');
      cpRech = await convocatoriaProtocolo(protocoloRech, 'NO_APROBADO', 5, {
        motivo: `${PREFIX}motivo`,
      });
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(new Response(PDF, { status: 200 })),
        );
    });

    afterAll(() => {
      fetchSpy?.mockRestore();
    });

    it('PRESIDENTE (sin RESOLUCION_CREAR) → 403 en upload-url y en el registro', async () => {
      const up = await api()
        .post(`${url(cpCond)}/upload-url`)
        .set('Authorization', `Bearer ${presidenteToken}`)
        .send({});
      expect(up.status).toBe(403);
      const reg = await api()
        .post(url(cpCond))
        .set('Authorization', `Bearer ${presidenteToken}`)
        .send({
          claveArchivo: `protocols/${protocoloCond}/resolutions/${cpCond}/v1/x.pdf`,
        });
      expect(reg.status).toBe(403);
    });

    it('ANEXO_15: versión evaluada en 19 (tipo 2), v2.0 en 21 con plazo 30, protocolo en 21 y puente en resoluciones', async () => {
      const up = await api()
        .post(`${url(cpCond)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(up.status).toBe(201);
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, PDF);

      const res = await api()
        .post(url(cpCond))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(res.status).toBe(201);
      expect(res.body.data.numeroVersion).toBe(1);

      const [prot] = await ds.query(
        `SELECT estado_id, version_actual_id FROM public.protocolos WHERE id = $1`,
        [protocoloCond],
      );
      expect(prot.estado_id).toBe(21);

      const versiones: Array<{
        id: number;
        numero_version: number;
        estado_id: number;
        tipo_resolucion_id: number | null;
        plazo_subsanacion_dias: number | null;
      }> = await ds.query(
        `SELECT id, numero_version, estado_id, tipo_resolucion_id, plazo_subsanacion_dias
           FROM public.versiones_protocolo WHERE protocolo_id = $1
          ORDER BY numero_version`,
        [protocoloCond],
      );
      expect(versiones.map((v) => [v.numero_version, v.estado_id])).toEqual([
        [1, 19],
        [2, 21],
      ]);
      expect(versiones[0].tipo_resolucion_id).toBe(2);
      expect(versiones[1].plazo_subsanacion_dias).toBe(30);
      expect(prot.version_actual_id).toBe(versiones[1].id);

      const [rec] = await ds.query(
        `SELECT estado_id FROM recepcion.recepciones WHERE version_id = $1`,
        [versiones[1].id],
      );
      expect(rec.estado_id).toBe(9);

      // Puente: una fila en resoluciones para la versión evaluada, con vigencia 1 y sin seguimiento.
      const puente = await ds.query(
        `SELECT protocolo_id, tipo_resolucion_id, observaciones,
                vigencia_aprobacion_anios, periodo_seguimiento_dias
           FROM resolucion.resoluciones WHERE version_id = $1`,
        [versiones[0].id],
      );
      expect(puente).toEqual([
        {
          protocolo_id: protocoloCond,
          tipo_resolucion_id: 2,
          observaciones: null,
          vigencia_aprobacion_anios: 1,
          periodo_seguimiento_dias: null,
        },
      ]);
    });

    it('con la v2.0 del Anexo 15, el investigador sube un requisito v2 → 201', async () => {
      const key = `protocols/${protocoloCond}/v2/requirements/${PREFIX}v2/doc.pdf`;
      const r = await api()
        .post('/api/storage/upload-url')
        .set('Authorization', `Bearer ${investigadorToken}`)
        .send({ key, contentType: 'application/pdf' });
      expect(r.status).toBe(201);
      expect(r.body.data.key).toBe(key);
    });

    it('ANEXO_16 (NO_APROBADO) no crea v2.0: protocolo en 18, una sola versión y puente tipo 3', async () => {
      const up = await api()
        .post(`${url(cpRech)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, PDF);
      const res = await api()
        .post(url(cpRech))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(res.status).toBe(201);

      const [prot] = await ds.query(
        `SELECT estado_id FROM public.protocolos WHERE id = $1`,
        [protocoloRech],
      );
      expect(prot.estado_id).toBe(18);
      const [{ c }] = await ds.query(
        `SELECT count(*)::int AS c FROM public.versiones_protocolo WHERE protocolo_id = $1`,
        [protocoloRech],
      );
      expect(c).toBe(1);
      const [puente] = await ds.query(
        `SELECT tipo_resolucion_id FROM resolucion.resoluciones
          WHERE version_id = (SELECT version_actual_id FROM public.protocolos WHERE id = $1)`,
        [protocoloRech],
      );
      expect(puente.tipo_resolucion_id).toBe(3);
    });

    it('APROBADO_DEFINITIVO (ANEXO_13) no crea v2.0: el protocolo sigue con una sola versión', async () => {
      const [{ c }] = await ds.query(
        `SELECT count(*)::int AS c FROM public.versiones_protocolo WHERE protocolo_id = $1`,
        [protocoloId],
      );
      expect(c).toBe(1);
    });
  });

  describe('ANEXO_14 (ensayo clínico, EC) — TSK-015-N13', () => {
    let protocoloEc: number;
    let cpEc: string;
    let fetchEcSpy: jest.SpyInstance;
    const urlEc = () =>
      `/api/resolutions/convocatorias/${convocatoriaId}/protocolos/${cpEc}/cartas`;

    beforeAll(async () => {
      const [ec] = await ds.query(
        `SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'EC'`,
      );
      protocoloEc = await protocolo(ec.id as number, 'ec');
      cpEc = await convocatoriaProtocolo(protocoloEc, 'APROBADO_DEFINITIVO', 6);
      fetchEcSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(new Response(PDF, { status: 200 })),
        );
    });

    afterAll(() => {
      fetchEcSpy?.mockRestore();
    });

    it('EC con APROBADO_DEFINITIVO: upload-url deriva ANEXO_14 (ensayo clínico)', async () => {
      const r = await api()
        .post(`${urlEc()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(r.status).toBe(201);
      expect(r.body.data.anexoCodigo).toBe('ANEXO_14');
    });

    it('EC con APROBADO_DEFINITIVO: ANEXO_14 → registro 201; protocolo en 17 con fecha_aprobacion de hoy, sin v2.0 y con puente', async () => {
      const up = await api()
        .post(`${urlEc()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(up.status).toBe(201);
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, PDF);

      const res = await api()
        .post(urlEc())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(res.status).toBe(201);

      const [p] = await ds.query(
        `SELECT p.estado_id, p.version_actual_id,
                to_char(p.fecha_aprobacion, 'YYYY-MM-DD') AS fecha_aprobacion,
                to_char((now() AT TIME ZONE 'America/Guayaquil')::date, 'YYYY-MM-DD') AS hoy
           FROM public.protocolos p WHERE p.id = $1`,
        [protocoloEc],
      );
      expect(p.estado_id).toBe(ESTADO_APROBADO);
      expect(p.fecha_aprobacion).toBe(p.hoy);

      const [{ c }] = await ds.query(
        `SELECT count(*)::int AS c FROM public.versiones_protocolo WHERE protocolo_id = $1`,
        [protocoloEc],
      );
      expect(c).toBe(1);

      const puentes = await ds.query(
        `SELECT tipo_resolucion_id FROM resolucion.resoluciones WHERE version_id = $1`,
        [p.version_actual_id],
      );
      expect(puentes).toEqual([{ tipo_resolucion_id: 1 }]);
    });
  });

  describe('resultado calculado, congelado y bloqueo legacy (TSK-015-N27-6, RF-17.1 v1.6.8)', () => {
    let pendienteId: number;
    let cpPendiente: string;
    let mezclaId: number;
    let cpMezcla: string;
    let reemplazoId: number;
    let cpReemplazo: string;
    let legacyId: number;
    let cpLegacy: string;
    let fetchSpy: jest.SpyInstance;

    beforeAll(async () => {
      pendienteId = await protocolo(TIPO_IO, 'pend');
      cpPendiente = await convocatoriaProtocolo(
        pendienteId,
        'APROBADO_DEFINITIVO',
        11,
      );
      // Una asignación activa sin completar (estado 6) deja el resultado pendiente.
      await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ((SELECT version_actual_id FROM public.protocolos WHERE id = $1), $2, 6)`,
        [pendienteId, investigadorId],
      );

      mezclaId = await protocolo(TIPO_IO, 'mezcla');
      cpMezcla = await convocatoriaProtocolo(mezclaId, 'MEZCLA_3_1_NO', 12);

      reemplazoId = await protocolo(TIPO_IO, 'reemplazo');
      cpReemplazo = await convocatoriaProtocolo(
        reemplazoId,
        'APROBADO_DEFINITIVO',
        13,
      );

      legacyId = await protocolo(TIPO_IO, 'legacy');
      cpLegacy = await convocatoriaProtocolo(
        legacyId,
        'APROBADO_DEFINITIVO',
        14,
      );
      const [vLegacy] = await ds.query(
        `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
        [legacyId],
      );
      await ds.query(
        `INSERT INTO resolucion.resoluciones (protocolo_id, version_id, tipo_resolucion_id)
         VALUES ($1, $2, 1)`,
        [legacyId, vLegacy.version_actual_id],
      );

      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(new Response(PDF, { status: 200 })),
        );
    });

    afterAll(() => {
      fetchSpy?.mockRestore();
    });

    it('409 «pendientes de dictamen» mientras una asignación activa no esté completada', async () => {
      const res = await api()
        .post(`${base(() => cpPendiente)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body)).toContain('pendientes de dictamen');
    });

    it('mezcla de 3 APROBADO_DEFINITIVO y 1 RECHAZADO → APROBADO_CON_CONDICION → ANEXO_15', async () => {
      const res = await api()
        .post(`${base(() => cpMezcla)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(201);
      expect(res.body.data.anexoCodigo).toBe('ANEXO_15');
    });

    it('la primera carta congela el resultado: el reemplazo mantiene el anexo aunque cambie un dictamen', async () => {
      const up = await api()
        .post(`${base(() => cpReemplazo)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(up.body.data.anexoCodigo).toBe('ANEXO_13');
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, PDF);
      const reg = await api()
        .post(base(() => cpReemplazo))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(reg.status).toBe(201);

      // Un dictamen cambia después de la carta: el reemplazo usa el congelado, no recalcula.
      await ds.query(
        `UPDATE evaluacion.evaluaciones SET resultado_id = 3
          WHERE asignacion_id IN (
            SELECT a.id FROM evaluacion.asignaciones_evaluacion a
             WHERE a.version_id = (SELECT version_actual_id FROM public.protocolos WHERE id = $1))`,
        [reemplazoId],
      );
      const rep = await api()
        .post(`${base(() => cpReemplazo)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(rep.status).toBe(201);
      expect(rep.body.data.numeroVersion).toBe(2);
      expect(rep.body.data.anexoCodigo).toBe('ANEXO_13');
    });

    it('409 si el protocolo se resolvió con el flujo anterior y no tiene carta (bloqueo legacy)', async () => {
      const res = await api()
        .post(`${base(() => cpLegacy)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body)).toContain('flujo anterior');
    });
  });

  describe('guardas v1.6.9: reunión realizada, cancelada y versión única (TSK-015-N27-6, RF-17.2)', () => {
    const DIA_MS = 24 * 60 * 60 * 1000;
    let convFuturaId: string;
    let convSinFechaId: string;
    let convCanceladaId: string;
    let convDobleA: string;
    let convDobleB: string;
    let convConA: string;
    let convConB: string;
    let cpFutura: string;
    let cpSinFecha: string;
    let cpCancelada: string;
    let protocoloDobleId: number;
    let cpDobleA: string;
    let cpDobleB: string;
    let protocoloConId: number;
    let cpConA: string;
    let cpConB: string;
    let fetchSpy: jest.SpyInstance;

    async function convocatoriaDe(
      numero: string,
      fecha: string | null,
      estado = 'PROGRAMADA',
    ): Promise<string> {
      const [c] = await ds.query(
        `INSERT INTO evaluacion.convocatorias (numero_convocatoria, fecha_reunion, estado)
         VALUES ($1, $2::timestamptz, $3) RETURNING id`,
        [`${PREFIX}${numero}`, fecha, estado],
      );
      return c.id as string;
    }

    beforeAll(async () => {
      const pasada = new Date(Date.now() - 10 * DIA_MS).toISOString();
      const futura = new Date(Date.now() + 10 * DIA_MS).toISOString();
      convFuturaId = await convocatoriaDe('FUT', futura);
      convSinFechaId = await convocatoriaDe('SINF', null);
      convCanceladaId = await convocatoriaDe('CANC', pasada, 'CANCELADA');
      convDobleA = await convocatoriaDe('DOBLE-A', pasada);
      convDobleB = await convocatoriaDe('DOBLE-B', pasada);
      convConA = await convocatoriaDe('CON-A', pasada);
      convConB = await convocatoriaDe('CON-B', pasada);

      // Reunión futura, sin fecha y cancelada: cada una con su propio protocolo y dictámenes completos.
      cpFutura = await convocatoriaProtocolo(
        await protocolo(TIPO_IO, 'futura'),
        'APROBADO_DEFINITIVO',
        41,
        {},
        convFuturaId,
      );
      cpSinFecha = await convocatoriaProtocolo(
        await protocolo(TIPO_IO, 'sinfecha'),
        'APROBADO_DEFINITIVO',
        42,
        {},
        convSinFechaId,
      );
      cpCancelada = await convocatoriaProtocolo(
        await protocolo(TIPO_IO, 'cancelada'),
        'APROBADO_DEFINITIVO',
        43,
        {},
        convCanceladaId,
      );

      // Misma versión en dos convocatorias: los dictámenes se siembran una sola vez (en A).
      protocoloDobleId = await protocolo(TIPO_IO, 'doble');
      cpDobleA = await convocatoriaProtocolo(
        protocoloDobleId,
        'APROBADO_DEFINITIVO',
        44,
        {},
        convDobleA,
      );
      cpDobleB = await convocatoriaProtocolo(
        protocoloDobleId,
        null,
        45,
        {},
        convDobleB,
      );

      // Misma situación para la subida concurrente.
      protocoloConId = await protocolo(TIPO_IO, 'concurrente');
      cpConA = await convocatoriaProtocolo(
        protocoloConId,
        'APROBADO_DEFINITIVO',
        46,
        {},
        convConA,
      );
      cpConB = await convocatoriaProtocolo(
        protocoloConId,
        null,
        47,
        {},
        convConB,
      );

      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(new Response(PDF, { status: 200 })),
        );
    });

    afterAll(() => {
      fetchSpy?.mockRestore();
    });

    const urlDe = (conv: string, cp: string) =>
      `/api/resolutions/convocatorias/${conv}/protocolos/${cp}/cartas`;

    it('reunión futura: upload-url y registro responden 409 «aún no se ha realizado»', async () => {
      const up = await api()
        .post(`${urlDe(convFuturaId, cpFutura)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(up.status).toBe(409);
      expect(JSON.stringify(up.body)).toContain('aún no se ha realizado');
      const reg = await api()
        .post(urlDe(convFuturaId, cpFutura))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: 'ZZ_TEST_sin_subida.pdf' });
      expect(reg.status).toBe(409);
      expect(JSON.stringify(reg.body)).toContain('aún no se ha realizado');
    });

    it('sin fecha de reunión: 409 «aún no se ha realizado»', async () => {
      const res = await api()
        .post(`${urlDe(convSinFechaId, cpSinFecha)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body)).toContain('aún no se ha realizado');
    });

    it('convocatoria cancelada: 409 «fue cancelada» aunque la fecha ya haya pasado', async () => {
      const res = await api()
        .post(`${urlDe(convCanceladaId, cpCancelada)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body)).toContain('fue cancelada');
    });

    it('una carta por versión: la segunda convocatoria responde 409 con el número de la primera', async () => {
      const up = await api()
        .post(`${urlDe(convDobleA, cpDobleA)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(up.status).toBe(201);
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, PDF);
      const reg = await api()
        .post(urlDe(convDobleA, cpDobleA))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave });
      expect(reg.status).toBe(201);

      const upB = await api()
        .post(`${urlDe(convDobleB, cpDobleB)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(upB.status).toBe(409);
      expect(JSON.stringify(upB.body)).toContain(
        `ya tiene carta en la convocatoria ${PREFIX}DOBLE-A`,
      );
      const regB = await api()
        .post(urlDe(convDobleB, cpDobleB))
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: 'ZZ_TEST_sin_subida.pdf' });
      expect(regB.status).toBe(409);
    });

    it('dos registros concurrentes de la misma versión: solo uno pasa y queda una carta', async () => {
      const upA = await api()
        .post(`${urlDe(convConA, cpConA)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      const upB = await api()
        .post(`${urlDe(convConB, cpConB)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({});
      expect(upA.status).toBe(201);
      expect(upB.status).toBe(201);
      const claveA = upA.body.data.claveArchivo as string;
      const claveB = upB.body.data.claveArchivo as string;
      subirAlBucket(claveA, PDF);
      subirAlBucket(claveB, PDF);

      const [rA, rB] = await Promise.all([
        api()
          .post(urlDe(convConA, cpConA))
          .set('Authorization', `Bearer ${secretariaToken}`)
          .send({ claveArchivo: claveA }),
        api()
          .post(urlDe(convConB, cpConB))
          .set('Authorization', `Bearer ${secretariaToken}`)
          .send({ claveArchivo: claveB }),
      ]);
      expect([rA.status, rB.status].sort()).toEqual([201, 409]);

      const [{ n }] = await ds.query(
        `SELECT count(*)::int AS n FROM resolucion.cartas_firmadas
          WHERE version_id = (SELECT version_actual_id FROM public.protocolos WHERE id = $1)
            AND vigente`,
        [protocoloConId],
      );
      expect(n).toBe(1);
    });
  });
});
