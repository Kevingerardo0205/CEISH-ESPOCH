/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-015-N07 — spec-003 RF-ALR.f.7 (v1.5.3): GET /api/evaluations/meetings/next.
 *
 * Guards reales y login real:
 * - secretaria@test.com y presidente@test.com con la contraseña de E2E_TEST_ACCOUNTS_PASSWORD
 *   (no se escribe en el código ni se imprime; si falta, se aborta antes del login);
 * - EVALUADOR, INVESTIGADOR y un PRESIDENTE propio (para vencer su rol y probar el permiso):
 *   usuarios ZZ_TEST_NXT_ con una contraseña generada aquí.
 *
 * El endpoint no tiene parámetros y devuelve una sola reunión, así que cada caso siembra sus
 * convocatorias ZZ_TEST_NXT_ (fechas en 2090 o relativas a NOW() de la base) y las borra al
 * terminar. Si en ceish_test_db hay una convocatoria ajena PROGRAMADA o EN_CURSO desde hoy,
 * la suite aborta: taparía a las de la prueba.
 * Datos borrados en beforeAll y afterAll. Solo ceish_test_db.
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
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_NXT_';
const EMAIL_DOMAIN = '@e2e-nxt.test';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const PRESIDENTE_EMAIL = 'presidente@test.com';
const ZONE = 'America/Guayaquil';
/** Inicio del día de hoy en Ecuador, calculado en la base (igual que el endpoint). */
const START_OF_TODAY_SQL = `(date_trunc('day', NOW() AT TIME ZONE '${ZONE}') AT TIME ZONE '${ZONE}')`;
/** Hoy en Ecuador, a una hora que ya pasó (punto medio entre las 00:00 y ahora). */
const TODAY_PAST_HOUR_SQL = `(${START_OF_TODAY_SQL} + (NOW() - ${START_OF_TODAY_SQL}) / 2)`;
/** Ayer en Ecuador a las 23:59. */
const YESTERDAY_LAST_MINUTE_SQL = `(${START_OF_TODAY_SQL} - interval '1 minute')`;

type MeetingState = 'PROGRAMADA' | 'EN_CURSO' | 'CONCLUIDA' | 'CANCELADA';

describe('TSK-015-N07 — GET /api/evaluations/meetings/next (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Record<string, string> = {};
  let principalId: number;
  let ownPresidenteId: number;
  let presidenteRolId: number;

  const api = () => request(app.getHttpServer());
  const next = (who = 'secretaria') =>
    api()
      .get('/api/evaluations/meetings/next')
      .set('Authorization', `Bearer ${token[who]}`);

  async function cleanup(): Promise<void> {
    const convIds = `SELECT id FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos
        WHERE convocatoria_id IN (${convIds}) OR protocolo_id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM evaluacion.lugares WHERE nombre LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`,
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

  /** Solo las convocatorias (y sus puntos) de la prueba; entre casos. */
  async function clearMeetings(): Promise<void> {
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id IN
         (SELECT id FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`,
    );
  }

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    if (res.status !== 201 || !res.body?.access_token) {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return res.body.access_token;
  }

  async function insertUser(
    key: string,
    passwordHash: string | null,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [
        `ZZNX${key}`.slice(0, 20),
        `${PREFIX}${key}`,
        `${key}${EMAIL_DOMAIN}`,
        passwordHash,
      ],
    );
    return row.id;
  }

  async function assignRole(userId: number, roleCode: string): Promise<void> {
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = $2`,
      [userId, roleCode],
    );
  }

  /**
   * Convocatoria ZZ_TEST_NXT_. `fechaSql` es una expresión SQL fija de esta prueba
   * (constantes de arriba o un literal timestamptz), nunca un valor externo.
   */
  async function insertMeeting(opts: {
    num: string;
    fechaSql: string | null;
    estado?: MeetingState;
    lugarId?: string | null;
    tipo?: 'ORDINARIA' | 'EXTRAORDINARIA';
  }): Promise<string> {
    const [row] = await ds.query(
      `INSERT INTO evaluacion.convocatorias
         (numero_convocatoria, anio_lectivo, tipo_session, fecha_reunion, estado, lugar_id)
       VALUES ($1, 2090, $2, ${opts.fechaSql ?? 'NULL'}, $3, $4) RETURNING id`,
      [
        `${PREFIX}${opts.num}`,
        opts.tipo ?? 'ORDINARIA',
        opts.estado ?? 'PROGRAMADA',
        opts.lugarId ?? null,
      ],
    );
    return row.id;
  }

  async function insertPlace(
    key: string,
    esVirtual: boolean,
    enlace: string | null,
  ): Promise<string> {
    const [row] = await ds.query(
      `INSERT INTO evaluacion.lugares (nombre, direccion, es_virtual, enlace_reunion, activo)
       VALUES ($1, NULL, $2, $3, true) RETURNING id`,
      [`${PREFIX}${key}`, esVirtual, enlace],
    );
    return row.id;
  }

  /** Protocolo ZZ_TEST_NXT_ con `versions` versiones; devuelve { protocolId, versionIds }. */
  async function insertProtocol(
    key: string,
    versions: number,
  ): Promise<{ protocolId: number; versionIds: number[] }> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id)
       VALUES ($1, $2) RETURNING id`,
      [`${PREFIX}${key}`, principalId],
    );
    const versionIds: number[] = [];
    for (let n = 1; n <= versions; n++) {
      const [v] = await ds.query(
        `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version)
         VALUES ($1, $2) RETURNING id`,
        [p.id, n],
      );
      versionIds.push(v.id);
    }
    return { protocolId: p.id, versionIds };
  }

  async function addAgendaItem(
    convId: string,
    protocolId: number,
    versionId: number,
    orden: number,
    deleted = false,
  ): Promise<void> {
    await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo, eliminado_en)
       VALUES ($1, $2, $3, $4, NOW(), ${deleted ? 'NOW()' : 'NULL'})`,
      [convId, protocolId, versionId, orden],
    );
  }

  /** Convocatorias ajenas a la prueba que el endpoint podría devolver. */
  async function foreignCandidates(): Promise<number> {
    const [row] = await ds.query(
      `SELECT count(*)::int AS n FROM evaluacion.convocatorias
        WHERE estado IN ('PROGRAMADA', 'EN_CURSO')
          AND fecha_reunion IS NOT NULL
          AND fecha_reunion >= ${START_OF_TODAY_SQL}
          AND numero_convocatoria NOT LIKE '${PREFIX}%'`,
    );
    return row.n;
  }

  beforeAll(async () => {
    const password = process.env.E2E_TEST_ACCOUNTS_PASSWORD;
    if (!password) {
      // Sin la contraseña no se intenta el login (evita bloquear las cuentas de prueba).
      throw new Error(
        'ABORT: falta E2E_TEST_ACCOUNTS_PASSWORD (contraseña de secretaria@test.com y presidente@test.com).',
      );
    }
    const dbName = process.env.DB_NAME || '';
    if (!dbName.includes('test')) {
      throw new Error(`ABORT: solo ceish_test_db. DB recibida: '${dbName}'`);
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
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();
    ds = app.get(DataSource);

    const [{ current_database: active }] = await ds.query(
      'SELECT current_database()',
    );
    if (!String(active).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${active}'.`);
    }

    await cleanup();
    (PermissionsGuard as any).cache.clear();

    const foreign = await foreignCandidates();
    if (foreign > 0) {
      throw new Error(
        `ABORT: hay ${foreign} convocatoria(s) ajena(s) PROGRAMADA o EN_CURSO desde hoy en ceish_test_db; ` +
          'taparían a las de la prueba (el endpoint devuelve solo la más cercana).',
      );
    }

    const [pres] = await ds.query(
      `SELECT id FROM catalogos.roles WHERE codigo = 'PRESIDENTE'`,
    );
    presidenteRolId = pres.id;

    token.secretaria = await login(SECRETARIA_EMAIL, password);
    token.presidente = await login(PRESIDENTE_EMAIL, password);

    // Usuarios propios: contraseña generada aquí, nunca la de cuentas reales.
    const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generated, 10);
    const evaluadorId = await insertUser('evaluador', hash);
    await assignRole(evaluadorId, 'EVALUADOR');
    const investigadorId = await insertUser('investigador', hash);
    await assignRole(investigadorId, 'INVESTIGADOR');
    ownPresidenteId = await insertUser('presidente', hash);
    await assignRole(ownPresidenteId, 'PRESIDENTE');
    principalId = await insertUser('principal', null);

    token.evaluador = await login(`evaluador${EMAIL_DOMAIN}`, generated);
    token.investigador = await login(`investigador${EMAIL_DOMAIN}`, generated);
    token.ownPresidente = await login(`presidente${EMAIL_DOMAIN}`, generated);
  }, 120_000);

  afterEach(async () => {
    if (ds?.isInitialized) await clearMeetings();
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      await cleanup();
      (PermissionsGuard as any).cache.clear();
    }
    if (app) await app.close();
  }, 30_000);

  // ─── Acceso ─────────────────────────────────────────────────────────────────
  describe('acceso', () => {
    it('sin token → 401', async () => {
      const res = await api().get('/api/evaluations/meetings/next');
      expect(res.status).toBe(401);
    });

    it('SECRETARIA → 200; "next" no cae en GET :id (no responde 400)', async () => {
      const res = await next('secretaria');
      expect(res.status).toBe(200);
      expect(res.body.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
    });

    it('PRESIDENTE → 200', async () => {
      const res = await next('presidente');
      expect(res.status).toBe(200);
    });

    it('EVALUADOR → 403', async () => {
      const res = await next('evaluador');
      expect(res.status).toBe(403);
    });

    it('INVESTIGADOR → 403', async () => {
      const res = await next('investigador');
      expect(res.status).toBe(403);
    });

    it('PRESIDENTE con el rol vencido en la base (sin RESOLUCION_CONVOCATORIAS vigente) → 403', async () => {
      (PermissionsGuard as any).cache.clear();
      const before = await next('ownPresidente');
      expect(before.status).toBe(200);
      // Solo se toca la fila del usuario propio de la prueba.
      await ds.query(
        `UPDATE catalogos.usuarios_roles SET fecha_fin = NOW() - interval '1 day'
          WHERE usuario_id = $1 AND rol_id = $2`,
        [ownPresidenteId, presidenteRolId],
      );
      (PermissionsGuard as any).cache.clear();
      try {
        const res = await next('ownPresidente');
        expect(res.status).toBe(403);
      } finally {
        await ds.query(
          `UPDATE catalogos.usuarios_roles SET fecha_fin = NULL
            WHERE usuario_id = $1 AND rol_id = $2`,
          [ownPresidenteId, presidenteRolId],
        );
        (PermissionsGuard as any).cache.clear();
      }
    });
  });

  // ─── Qué reunión es ─────────────────────────────────────────────────────────
  describe('qué reunión es', () => {
    it('sin ninguna reunión próxima → 200 con data null', async () => {
      expect(await foreignCandidates()).toBe(0);
      const res = await next();
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('elige la más cercana entre varias futuras', async () => {
      await insertMeeting({
        num: 'LEJANA',
        fechaSql: `'2090-03-10T14:00:00Z'`,
      });
      const nearId = await insertMeeting({
        num: 'CERCANA',
        fechaSql: `'2090-03-05T14:00:00Z'`,
      });
      await insertMeeting({ num: 'MEDIA', fechaSql: `'2090-03-07T14:00:00Z'` });
      const res = await next();
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(nearId);
      expect(res.body.data.numeroConvocatoria).toBe(`${PREFIX}CERCANA`);
      expect(res.body.data.fechaReunion).toBe('2090-03-05T14:00:00.000Z');
    });

    it('misma fecha → desempate por numero_convocatoria', async () => {
      await insertMeeting({ num: 'B', fechaSql: `'2090-04-01T14:00:00Z'` });
      const aId = await insertMeeting({
        num: 'A',
        fechaSql: `'2090-04-01T14:00:00Z'`,
      });
      const res = await next();
      expect(res.body.data.id).toBe(aId);
    });

    it('excluye CANCELADA y CONCLUIDA aunque sean más cercanas', async () => {
      await insertMeeting({
        num: 'CANCEL',
        fechaSql: `'2090-01-01T14:00:00Z'`,
        estado: 'CANCELADA',
      });
      await insertMeeting({
        num: 'CONCLU',
        fechaSql: `'2090-01-02T14:00:00Z'`,
        estado: 'CONCLUIDA',
      });
      const progId = await insertMeeting({
        num: 'PROG',
        fechaSql: `'2090-02-01T14:00:00Z'`,
      });
      const res = await next();
      expect(res.body.data.id).toBe(progId);
    });

    it('incluye EN_CURSO', async () => {
      await insertMeeting({ num: 'PROG', fechaSql: `'2090-02-01T14:00:00Z'` });
      const enCursoId = await insertMeeting({
        num: 'EN_CURSO',
        fechaSql: `'2090-01-03T14:00:00Z'`,
        estado: 'EN_CURSO',
      });
      const res = await next();
      expect(res.body.data.id).toBe(enCursoId);
    });

    it('excluye las convocatorias sin fecha_reunion', async () => {
      await insertMeeting({ num: 'SINFECHA', fechaSql: null });
      const res = await next();
      expect(res.body.data).toBeNull();
    });

    it('la reunión de hoy (Ecuador) a una hora ya pasada sigue siendo la próxima', async () => {
      const todayId = await insertMeeting({
        num: 'HOY',
        fechaSql: TODAY_PAST_HOUR_SQL,
      });
      await insertMeeting({
        num: 'FUTURA',
        fechaSql: `'2090-01-01T14:00:00Z'`,
      });
      const res = await next();
      expect(res.body.data.id).toBe(todayId);
      expect(new Date(res.body.data.fechaReunion).getTime()).toBeLessThan(
        Date.now(),
      );
    });

    it('la reunión de ayer (Ecuador, 23:59) no cuenta', async () => {
      await insertMeeting({ num: 'AYER', fechaSql: YESTERDAY_LAST_MINUTE_SQL });
      const futureId = await insertMeeting({
        num: 'FUTURA',
        fechaSql: `'2090-01-01T14:00:00Z'`,
      });
      const res = await next();
      expect(res.body.data.id).toBe(futureId);
    });
  });

  // ─── Respuesta ──────────────────────────────────────────────────────────────
  describe('respuesta', () => {
    it('protocolosATratar cuenta protocolos distintos y no las filas con eliminado_en', async () => {
      const convId = await insertMeeting({
        num: 'CONTEO',
        fechaSql: `'2090-01-01T14:00:00Z'`,
      });
      const p1 = await insertProtocol('P1', 2); // dos versiones del mismo protocolo
      const p2 = await insertProtocol('P2', 1);
      const p3 = await insertProtocol('P3', 1); // solo con fila eliminada
      await addAgendaItem(convId, p1.protocolId, p1.versionIds[0], 1);
      await addAgendaItem(convId, p1.protocolId, p1.versionIds[1], 2);
      await addAgendaItem(convId, p2.protocolId, p2.versionIds[0], 3);
      await addAgendaItem(convId, p3.protocolId, p3.versionIds[0], 4, true);
      const res = await next();
      expect(res.body.data.id).toBe(convId);
      expect(res.body.data.protocolosATratar).toBe(2);
    });

    it('sin protocolos → 0; informesATratar null; lugar null; contrato exacto', async () => {
      const convId = await insertMeeting({
        num: 'VACIA',
        fechaSql: `'2090-01-01T14:00:00Z'`,
        tipo: 'EXTRAORDINARIA',
      });
      const res = await next();
      expect(res.body.message).toBe('Próxima reunión obtenida exitosamente');
      expect(res.body.data).toEqual({
        id: convId,
        numeroConvocatoria: `${PREFIX}VACIA`,
        tipoSesion: 'EXTRAORDINARIA',
        fechaReunion: '2090-01-01T14:00:00.000Z',
        lugar: null,
        protocolosATratar: 0,
        informesATratar: null,
      });
    });

    it('lugar virtual con enlace', async () => {
      const placeId = await insertPlace(
        'Sala virtual',
        true,
        'https://meet.example.test/zz-nxt',
      );
      await insertMeeting({
        num: 'VIRTUAL',
        fechaSql: `'2090-01-01T14:00:00Z'`,
        lugarId: placeId,
      });
      const res = await next();
      expect(res.body.data.lugar).toEqual({
        nombre: `${PREFIX}Sala virtual`,
        esVirtual: true,
        enlaceReunion: 'https://meet.example.test/zz-nxt',
      });
      expect(res.body.data.informesATratar).toBeNull();
    });
  });
});
