/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * TSK-015-N25 (spec-003 RF-17.1, RF-17.4, RF-17.6 v1.6.7): GET /api/resolutions/protocol/:id/contexto
 * en ceish_test_db. Login real de SECRETARIA, PRESIDENTE, INVESTIGADOR (principal) e INVESTIGADOR
 * ajeno (→ 404). Contraseña generada en cada ejecución (no se imprime). Residuos = 0. Solo ceish_test_db.
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

const PREFIX = 'ZZ_TEST_CTX_';
const EMAIL_DOMAIN = '@e2e-ctx.test';
const TIPO_IO = 5;
const TIPO_EX = 8;
const ESTADO_EN_CONTROL = 21;

describe('Contexto de resolución — TSK-015-N25 (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let tokens: Record<
    'SECRETARIA' | 'PRESIDENTE' | 'INVESTIGADOR' | 'OTRO',
    string
  >;
  let secretariaId: number;
  let investigadorId: number;
  let convPasadaId: string;
  let convFuturaId: string;
  let protocoloId: number;
  let protocoloSinCartaId: number;
  let protocoloExId: number;
  let cpCartaId: string;
  let cpFuturaId: string;
  const CLAVE = `protocols/ctx/resolutions/${PREFIX}clave.pdf`;

  const api = () => request(app.getHttpServer());
  const contexto = (id: number | string, token?: string) => {
    const req = api().get(`/api/resolutions/protocol/${id}/contexto`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  async function cleanup(): Promise<void> {
    await ds.query(
      `DELETE FROM resolucion.cartas_firmadas WHERE protocolo_id IN
         (SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
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
    await ds.query(
      `DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT a.id FROM evaluacion.asignaciones_evaluacion a JOIN public.versiones_protocolo v ON v.id = a.version_id JOIN public.protocolos p ON p.id = v.protocolo_id WHERE p.titulo LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (SELECT v.id FROM public.versiones_protocolo v JOIN public.protocolos p ON p.id = v.protocolo_id WHERE p.titulo LIKE '${PREFIX}%')`,
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

  async function protocolo(
    tipo: number,
    nombre: string,
    principal: number,
  ): Promise<number> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id, tipo_estudio_id, estado_id, version)
       VALUES ($1, $2, $3, $4, 1) RETURNING id`,
      [`${PREFIX}${nombre}`, principal, tipo, ESTADO_EN_CONTROL],
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
    NO_APROBADO: [3, 3, 3],
  };

  async function convocatoriaProtocolo(
    convId: string,
    protocoloIdParam: number,
    resultado: string | null,
    orden: number,
    textos: { motivo?: string; observaciones?: string } = {},
  ): Promise<string> {
    const [vid] = await ds.query(
      `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
      [protocoloIdParam],
    );
    // TSK-015-N27-6: el resultado sale de los dictámenes; dictamen_resultado ya no se escribe.
    const [cp] = await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, fecha_plazo_normativo, orden,
          dictamen_motivo, dictamen_observaciones)
       VALUES ($1, $2, $3, CURRENT_DATE + 30, $4, $5, $6) RETURNING id`,
      [
        convId,
        protocoloIdParam,
        vid.version_actual_id,
        orden,
        textos.motivo ?? null,
        textos.observaciones ?? null,
      ],
    );
    // Sin dictámenes (null) el resultado está pendiente.
    for (const resultadoId of resultado === null ? [] : DICTAMENES[resultado]) {
      const [asignacion] = await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ($1, $2, 7) RETURNING id`,
        [vid.version_actual_id, secretariaId],
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
        sendResolutionEmail: jest.fn().mockResolvedValue(undefined),
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        generateUploadUrl: jest.fn(() =>
          Promise.resolve('https://upload.test/x'),
        ),
        getDownloadUrl: jest.fn().mockResolvedValue('https://download.test/x'),
        getMetadata: jest.fn().mockResolvedValue({
          contentType: 'application/pdf',
          contentLength: 10,
        }),
        readRange: jest.fn().mockResolvedValue(Buffer.from('%PDF-')),
        deleteFile: jest.fn().mockResolvedValue(undefined),
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
    secretariaId = await crearUsuario('SECRETARIA', 'ZZCTXSEC', 'SECRETARIA');
    investigadorId = await crearUsuario(
      'INVESTIGADOR',
      'ZZCTXINV',
      'INVESTIGADOR',
    );
    await crearUsuario('PRESIDENTE', 'ZZCTXPRE', 'PRESIDENTE');
    await crearUsuario('OTRO', 'ZZCTXOTR', 'INVESTIGADOR');

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
    tokens = {
      SECRETARIA: await login('SECRETARIA'),
      PRESIDENTE: await login('PRESIDENTE'),
      INVESTIGADOR: await login('INVESTIGADOR'),
      OTRO: await login('OTRO'),
    };

    // Convocatoria celebrada (fecha pasada) y futura.
    const [pasada] = await ds.query(
      `INSERT INTO evaluacion.convocatorias (numero_convocatoria, fecha_reunion)
       VALUES ($1, now() - interval '10 days') RETURNING id`,
      [`${PREFIX}P${randomBytes(3).toString('hex')}`],
    );
    const [futura] = await ds.query(
      `INSERT INTO evaluacion.convocatorias (numero_convocatoria, fecha_reunion)
       VALUES ($1, now() + interval '10 days') RETURNING id`,
      [`${PREFIX}F${randomBytes(3).toString('hex')}`],
    );
    convPasadaId = pasada.id;
    convFuturaId = futura.id;

    protocoloId = await protocolo(TIPO_IO, 'io', investigadorId);
    cpCartaId = await convocatoriaProtocolo(
      convPasadaId,
      protocoloId,
      'APROBADO_DEFINITIVO',
      1,
      {
        motivo: 'Motivo interno',
        observaciones: 'Observación interna',
      },
    );
    cpFuturaId = await convocatoriaProtocolo(
      convFuturaId,
      protocoloId,
      null,
      1,
    );

    // El resultado es por protocolo (su versión): una asignación activa sin completar deja la
    // convocatoria futura en PENDIENTE. La carta de la convocatoria pasada sigue congelada.
    await ds.query(
      `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
       SELECT version_actual_id, $1, 6 FROM public.protocolos WHERE id = $2`,
      [secretariaId, protocoloId],
    );

    protocoloSinCartaId = await protocolo(TIPO_IO, 'sincarta', investigadorId);
    await convocatoriaProtocolo(
      convPasadaId,
      protocoloSinCartaId,
      'NO_APROBADO',
      2,
      {
        motivo: 'Motivo sin carta',
      },
    );

    protocoloExId = await protocolo(TIPO_EX, 'ex', investigadorId);
    await convocatoriaProtocolo(convPasadaId, protocoloExId, null, 3);

    // Carta vigente del protocolo principal (ANEXO_13 para APROBADO_DEFINITIVO).
    await ds.query(
      `INSERT INTO resolucion.cartas_firmadas
         (convocatoria_protocolo_id, protocolo_id, version_id, numero_version, resultado,
          anexo_codigo, clave_archivo, vigente, subido_por)
       SELECT $1, p.id, p.version_actual_id, 1, 'APROBADO_DEFINITIVO', 'ANEXO_13', $2, true, $3
         FROM public.protocolos p WHERE p.id = $4`,
      [cpCartaId, CLAVE, secretariaId, protocoloId],
    );
  });

  afterAll(async () => {
    if (ds) {
      await cleanup();
      const [r] = await ds.query(
        `SELECT (SELECT count(*)::int FROM resolucion.cartas_firmadas WHERE clave_archivo = $1) AS cartas,
                (SELECT count(*)::int FROM public.protocolos WHERE titulo LIKE $2) AS protocolos,
                (SELECT count(*)::int FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE $2) AS convocatorias`,
        [CLAVE, `${PREFIX}%`],
      );
      if (r.cartas !== 0 || r.protocolos !== 0 || r.convocatorias !== 0) {
        throw new Error(`Residuos tras la prueba: ${JSON.stringify(r)}`);
      }
    }
    await app?.close();
  });

  it('401 sin token', async () => {
    const res = await contexto(protocoloId);
    expect(res.status).toBe(401);
  });

  it('404 «Protocolo no encontrado.» para un investigador ajeno', async () => {
    const res = await contexto(protocoloId, tokens.OTRO);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Protocolo no encontrado.');
  });

  it('404 para un protocolo inexistente', async () => {
    const res = await contexto(999999999, tokens.SECRETARIA);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Protocolo no encontrado.');
  });

  it('400 «ID de protocolo inválido» si el id no es entero', async () => {
    const res = await contexto('abc', tokens.SECRETARIA);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('ID de protocolo inválido');
  });

  it('principal con carta: lista ordenada, resultado y cartaVigente sin claveArchivo fuera de ella ni subidoPor', async () => {
    const res = await contexto(protocoloId, tokens.INVESTIGADOR);
    expect(res.status).toBe(200);
    const items = res.body.data;
    expect(items).toHaveLength(2);
    // Orden por fecha de reunión descendente: la futura va primero.
    expect(items[0].convocatoriaProtocoloId).toBe(cpFuturaId);
    expect(items[1].convocatoriaProtocoloId).toBe(cpCartaId);

    const conCarta = items[1];
    expect(conCarta.resultado).toBe('APROBADO_DEFINITIVO');
    expect(conCarta.anexoEsperado).toBe('ANEXO_13');
    expect(conCarta.cartaVigente).toEqual(
      expect.objectContaining({
        numeroVersion: 1,
        anexoCodigo: 'ANEXO_13',
        claveArchivo: CLAVE,
      }),
    );
    expect(conCarta.cartaVigente).not.toHaveProperty('subidoPor');
    expect(conCarta.cartaVigente).not.toHaveProperty('motivoReemplazo');
    expect(conCarta).not.toHaveProperty('claveArchivo');
    expect(conCarta).not.toHaveProperty('motivo');
    expect(conCarta).not.toHaveProperty('observaciones');
    expect(JSON.stringify(res.body)).not.toContain('Motivo interno');
    expect(JSON.stringify(res.body)).not.toContain('Observación interna');
  });

  it('principal sin carta: no ve resultado ni anexo', async () => {
    const res = await contexto(protocoloSinCartaId, tokens.INVESTIGADOR);
    expect(res.status).toBe(200);
    const [item] = res.body.data;
    expect(item.resultado).toBeNull();
    expect(item.anexoEsperado).toBeNull();
    expect(item.cartaVigente).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain('Motivo sin carta');
  });

  it('SECRETARIA ve motivo, observaciones y resultado sin carta', async () => {
    const res = await contexto(protocoloSinCartaId, tokens.SECRETARIA);
    expect(res.status).toBe(200);
    const [item] = res.body.data;
    expect(item.resultado).toBe('NO_APROBADO');
    expect(item.anexoEsperado).toBe('ANEXO_16');
    expect(item.motivo).toBe('Motivo sin carta');
    expect(item.observaciones).toBeNull();
    expect(item.cartaVigente).toBeNull();
  });

  it('PRESIDENTE tiene la vista completa', async () => {
    const res = await contexto(protocoloId, tokens.PRESIDENTE);
    expect(res.status).toBe(200);
    const conCarta = res.body.data[1];
    expect(conCarta.motivo).toBe('Motivo interno');
    expect(conCarta.observaciones).toBe('Observación interna');
  });

  it('SECRETARIA: puedeSubirCarta sigue al estado y al anexo, no a la fecha; no hay puedeRegistrarResultado', async () => {
    const res = await contexto(protocoloId, tokens.SECRETARIA);
    const [futura, celebrada] = res.body.data;
    // Reunión futura sin dictámenes: pendiente, no se puede subir carta.
    expect(futura.puedeSubirCarta).toBe(false);
    // Con carta congelada: el reemplazo sigue permitido.
    expect(celebrada.puedeSubirCarta).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('puedeRegistrarResultado');
  });

  it('investigador principal: puedeSubirCarta siempre false', async () => {
    const res = await contexto(protocoloId, tokens.INVESTIGADOR);
    for (const item of res.body.data) {
      expect(item.puedeSubirCarta).toBe(false);
      expect(item).not.toHaveProperty('puedeRegistrarResultado');
    }
  });

  it('EX: anexoEsperado null y puedeSubirCarta false, aunque el lector sea SECRETARIA', async () => {
    const res = await contexto(protocoloExId, tokens.SECRETARIA);
    expect(res.status).toBe(200);
    const [item] = res.body.data;
    expect(item.anexoEsperado).toBeNull();
    expect(item.puedeSubirCarta).toBe(false);
    expect(item).not.toHaveProperty('puedeRegistrarResultado');
  });

  describe('estado del resultado, resumen por conteo y bloqueo legacy (TSK-015-N27-7, RF-17.1 v1.6.8)', () => {
    let protocoloLegacyId: number;

    beforeAll(async () => {
      protocoloLegacyId = await protocolo(TIPO_IO, 'legacy', investigadorId);
      await convocatoriaProtocolo(
        convPasadaId,
        protocoloLegacyId,
        'APROBADO_DEFINITIVO',
        4,
      );
      const [v] = await ds.query(
        `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
        [protocoloLegacyId],
      );
      await ds.query(
        `INSERT INTO resolucion.resoluciones (protocolo_id, version_id, tipo_resolucion_id)
         VALUES ($1, $2, 1)`,
        [protocoloLegacyId, v.version_actual_id],
      );
    });

    it('estadoResultado: CONGELADO con carta, PENDIENTE sin dictámenes y resultadoCalculado null', async () => {
      const res = await contexto(protocoloId, tokens.SECRETARIA);
      const [futura, celebrada] = res.body.data;
      expect(celebrada.estadoResultado).toBe('CONGELADO');
      expect(futura.estadoResultado).toBe('PENDIENTE');
      expect(futura.resultadoCalculado).toBeNull();
    });

    it('RESUELTO_LEGACY con resolucionAnterior y sin resultado ni subida', async () => {
      const res = await contexto(protocoloLegacyId, tokens.SECRETARIA);
      const [item] = res.body.data;
      expect(item.estadoResultado).toBe('RESUELTO_LEGACY');
      expect(item.resolucionAnterior).toEqual({ tipoResolucionId: 1 });
      expect(item.resultado).toBeNull();
      expect(item.resultadoCalculado).toBeNull();
      expect(item.puedeSubirCarta).toBe(false);
    });

    it('resumenDictamenes por conteo para SECRETARIA, sin identidad de evaluadores', async () => {
      const res = await contexto(protocoloSinCartaId, tokens.SECRETARIA);
      const [item] = res.body.data;
      expect(item.estadoResultado).toBe('CALCULADO');
      expect(item.resultadoCalculado).toBe('NO_APROBADO');
      expect(item.resumenDictamenes).toEqual({
        aprobado: 0,
        conCondicion: 0,
        noAprobado: 3,
        pendientes: 0,
      });
      expect(JSON.stringify(res.body)).not.toMatch(/evaluadorId|evaluador_id/);
    });

    it('el investigador principal no recibe resumenDictamenes ni pendientes', async () => {
      const res = await contexto(protocoloSinCartaId, tokens.INVESTIGADOR);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain('resumenDictamenes');
      expect(JSON.stringify(res.body)).not.toContain('pendientes');
    });
  });
});
