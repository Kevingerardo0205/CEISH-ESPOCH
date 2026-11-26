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
      `DELETE FROM recepcion.recepciones WHERE version_id IN
         (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN
           (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'))`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos WHERE protocolo_id IN
         (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
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

  async function convocatoriaProtocolo(
    protocoloIdParam: number,
    resultado: string | null,
    orden: number,
  ): Promise<string> {
    const [vid] = await ds.query(
      `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
      [protocoloIdParam],
    );
    const [cp] = await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, fecha_plazo_normativo, orden, dictamen_resultado)
       VALUES ($1, $2, $3, CURRENT_DATE + 30, $4, $5) RETURNING id`,
      [
        convocatoriaId,
        protocoloIdParam,
        vid.version_actual_id,
        orden,
        resultado,
      ],
    );
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

    const [conv] = await ds.query(
      `INSERT INTO evaluacion.convocatorias (numero_convocatoria) VALUES ($1) RETURNING id`,
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
    it('400 si el anexo no corresponde al resultado (APROBADO_DEFINITIVO exige 13 o 14)', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_15' });
      expect(res.status).toBe(400);
    });

    it('409 para EX: el estudio exento no tiene carta de resolución', async () => {
      const res = await api()
        .post(`${base(() => cpExId)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
      expect(res.status).toBe(409);
    });

    it('409 si el protocolo no tiene resultado del pleno', async () => {
      const res = await api()
        .post(`${base(() => cpSinResultadoId)}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
      expect(res.status).toBe(409);
    });

    it('devuelve una clave con el prefijo de la versión 1 y URL de subida', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
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

    it('403 para INVESTIGADOR (no tiene RESOLUCION_CREAR)', async () => {
      const res = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${investigadorToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
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
          anexoCodigo: 'ANEXO_13',
        });
      expect(res.status).toBe(400);
    });

    it('400 y borra el objeto si el archivo no es un PDF real (cabecera %PDF-)', async () => {
      const up = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
      const clave = up.body.data.claveArchivo as string;
      subirAlBucket(clave, NO_PDF);
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: clave, anexoCodigo: 'ANEXO_13' });
      expect(res.status).toBe(400);
      expect(deleteSpy).toHaveBeenCalledWith(clave);
      expect(objetos.has(clave)).toBe(false);
    });

    it('201 registra la versión 1, fija estado 17 y envía el correo sin adjuntos extra', async () => {
      const up = await api()
        .post(`${base()}/upload-url`)
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ anexoCodigo: 'ANEXO_13' });
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
        .send({ claveArchivo: claveV1, anexoCodigo: 'ANEXO_13' });
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
        .send({ anexoCodigo: 'ANEXO_13' });
      claveV2 = up.body.data.claveArchivo as string;
      subirAlBucket(claveV2, PDF);
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({ claveArchivo: claveV2, anexoCodigo: 'ANEXO_13' });
      expect(res.status).toBe(400);
    });

    it('201 registra la versión 2 con motivo, deja la 1 no vigente y el protocolo sigue en 17', async () => {
      const res = await api()
        .post(base())
        .set('Authorization', `Bearer ${secretariaToken}`)
        .send({
          claveArchivo: claveV2,
          anexoCodigo: 'ANEXO_13',
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
});
