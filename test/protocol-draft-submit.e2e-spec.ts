/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.5 — spec-001 RF-02.3 a–e.1 y RF-EST.3 punto 5 (v3.7.1): borrador invisible para la
 * Secretaría y envío o reenvío desde INICIADO (9), INCOMPLETO (11) o REQUIERE_SUBSANACION_DOC (20).
 *
 * Guards reales y login real:
 * - secretaria@test.com y presidente@test.com con la contraseña de E2E_TEST_ACCOUNTS_PASSWORD
 *   (no se escribe en el código ni se imprime; si falta, se aborta antes del login);
 * - investigadores ZZ_TEST_DSUB_ propios (correo @e2e-tsk-001-5.test) con una contraseña generada aquí.
 * Los protocolos se crean con POST /api/protocols (recepción en 9) y cambian de estado por los
 * endpoints reales (submit, finalize → 11, archive-vencimiento → 12). Solo 10, 20 y 21 se fijan con
 * un UPDATE sobre la recepción del protocolo creado aquí (ver forceReceptionStatus).
 * AuditService real solo para PROTOCOL_*: se verifica PROTOCOL_SUBMITTED en sistema.audit_log.
 * Limpieza en beforeAll y afterAll. Solo ceish_test_db.
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

const PREFIX = 'ZZ_TEST_DSUB_';
const EMAIL_DOMAIN = '@e2e-tsk-001-5.test';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const PRESIDENTE_EMAIL = 'presidente@test.com';
const CONFLICT_MESSAGE = /no se puede enviar en su estado actual/;

describe('TSK-001.5 — borrador y envío del protocolo (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Record<string, string> = {};
  let investigadorId: number;
  let studyTypeId: number;

  const api = () => request(app.getHttpServer());
  const auth = (who: string) => ({ Authorization: `Bearer ${token[who]}` });
  const submit = (protocolId: number, who = 'investigador') =>
    api().post(`/api/protocols/${protocolId}/submit`).set(auth(who)).send({});

  async function cleanup(): Promise<void> {
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM sistema.audit_log WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
    );
    await ds.query(
      `DELETE FROM recepcion.documentos WHERE protocolo_id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN (${versionIds})`,
    );
    for (const table of [
      'protocolo_requisitos',
      'protocolo_instituciones',
      'protocolo_investigadores',
    ]) {
      await ds.query(
        `DELETE FROM public.${table} WHERE protocolo_id IN (${protocolIds})`,
      );
    }
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

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    if (res.status !== 201 || !res.body?.access_token) {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return res.body.access_token;
  }

  async function insertInvestigator(
    key: string,
    passwordHash: string,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [
        `ZZDS${key}`.slice(0, 20),
        `${PREFIX}${key}`,
        `${key}${EMAIL_DOMAIN}`,
        passwordHash,
      ],
    );
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = 'INVESTIGADOR'`,
      [row.id],
    );
    return row.id;
  }

  /** Crea el protocolo con el endpoint real (POST /api/protocols): recepción de la versión 1 en 9. */
  async function createDraft(key: string): Promise<number> {
    const title = `${PREFIX}${key} estudio de prueba del envío`;
    const res = await api()
      .post('/api/protocols')
      .set(auth('investigador'))
      .send({
        title,
        principalInvestigatorId: investigadorId,
        studyTypeId,
        isAffidavitAccepted: true,
        investigators: [],
        institutions: [],
      });
    if (res.status !== 201) {
      throw new Error(`POST /api/protocols falló con status ${res.status}`);
    }
    const [row] = await ds.query(
      `SELECT id FROM public.protocolos WHERE titulo = $1`,
      [title],
    );
    return row.id;
  }

  async function receptionStatus(protocolId: number): Promise<number> {
    const [row] = await ds.query(
      `SELECT r.estado_id FROM recepcion.recepciones r
         JOIN public.protocolos p ON r.version_id = p.version_actual_id
        WHERE p.id = $1`,
      [protocolId],
    );
    return row?.estado_id ?? null;
  }

  /**
   * Fija la recepción de un protocolo creado por ESTA prueba en 10, 20 o 21.
   * Por qué: 10 por el camino real exige todos los documentos obligatorios aprobados, y ningún
   * código escribe 20 ni 21 en recepcion.recepciones (solo en el protocolo o la versión).
   * Decisión D de la usuaria (09/11/2026). Nunca toca otros datos: filtra por título ZZ_TEST_DSUB_.
   */
  async function forceReceptionStatus(
    protocolId: number,
    statusId: 10 | 20 | 21,
  ): Promise<void> {
    const [, affected] = await ds.query(
      `UPDATE recepcion.recepciones r SET estado_id = $2
         FROM public.protocolos p
        WHERE p.id = $1 AND p.titulo LIKE '${PREFIX}%'
          AND r.version_id = p.version_actual_id`,
      [protocolId, statusId],
    );
    if (affected !== 1) {
      throw new Error(`forceReceptionStatus actualizó ${affected} filas`);
    }
  }

  async function receptionIds(query: string): Promise<number[]> {
    const res = await api()
      .get(`/api/reception/protocols${query}`)
      .set(auth('secretaria'));
    expect(res.status).toBe(200);
    return (res.body as any[]).map((p) => p.id);
  }

  async function validarIds(): Promise<number[]> {
    const res = await api()
      .get('/api/secretaria/pendientes')
      .set(auth('secretaria'));
    expect(res.status).toBe(200);
    return (res.body.data.items as any[])
      .filter((i) => i.accion === 'VALIDAR')
      .map((i) => i.protocolId);
  }

  async function protocolsList(
    who: string,
    path = '/api/protocols',
  ): Promise<{ ids: number[]; total: number }> {
    // mis-protocolos no acepta `search` (QueryProtocolDto); el investigador solo tiene datos de prueba.
    const query =
      path === '/api/protocols'
        ? `?search=${encodeURIComponent(PREFIX)}&limit=100`
        : '?limit=100';
    const res = await api().get(`${path}${query}`).set(auth(who));
    expect(res.status).toBe(200);
    return {
      ids: (res.body.data as any[]).map((p) => p.id),
      total: res.body.total,
    };
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

    // Sin correos reales: todos los métodos de IEmailServicePort resuelven sin enviar.
    const emailMock = Object.fromEntries(
      [
        'sendPasswordReset',
        'sendWelcomeEmail',
        'sendEmailConfirmation',
        'sendAccountInvitation',
        'sendReceptionIncomplete',
        'sendReceptionComplete',
        'sendResolutionEmail',
        'notifyPresidentNewProtocol',
        'sendEvaluationAssignment',
        'sendEvaluationSubmitted',
        'sendCallNotification',
        'sendUnscheduledProtocolsAlert',
        'sendRiskLevelDesignated',
        'sendRiskDiscrepancyAlert',
        'sendHtml',
      ].map((m) => [m, jest.fn().mockResolvedValue(undefined)]),
    );
    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue(emailMock)
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

    // Auditoría real solo para PROTOCOL_* (las de los usuarios de prueba se borran en cleanup).
    const audit = app.get(AuditService);
    const realCreateLog = audit.createLog.bind(audit);
    jest
      .spyOn(audit, 'createLog')
      .mockImplementation((dto: any) =>
        String(dto?.action).startsWith('PROTOCOL_')
          ? realCreateLog(dto)
          : Promise.resolve(undefined as any),
      );

    await cleanup();
    (PermissionsGuard as any).cache.clear();

    const [st] = await ds.query(
      `SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'IO'`,
    );
    studyTypeId = st.id;

    token.secretaria = await login(SECRETARIA_EMAIL, password);
    token.presidente = await login(PRESIDENTE_EMAIL, password);

    const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generated, 10);
    investigadorId = await insertInvestigator('investigador', hash);
    await insertInvestigator('otro', hash);
    token.investigador = await login(`investigador${EMAIL_DOMAIN}`, generated);
    token.otro = await login(`otro${EMAIL_DOMAIN}`, generated);
  }, 120_000);

  afterAll(async () => {
    if (ds?.isInitialized) await cleanup();
    if (app) await app.close();
  }, 30_000);

  // ─── RF-02.3 a y b: el borrador no se ve en las vistas de la Secretaría ─────────
  describe('borrador recién creado (recepción en 9)', () => {
    let draftId: number;

    beforeAll(async () => {
      draftId = await createDraft('BORRADOR');
    });

    it('POST /api/protocols deja la recepción de la versión activa en 9', async () => {
      expect(await receptionStatus(draftId)).toBe(9);
    });

    it('no aparece en GET /reception/protocols sin filtro', async () => {
      expect(await receptionIds('')).not.toContain(draftId);
    });

    it('no aparece en GET /reception/protocols?status=pendientes', async () => {
      expect(await receptionIds('?status=pendientes')).not.toContain(draftId);
    });

    it('no aparece en GET /protocols para SECRETARIA, tampoco en el total', async () => {
      const { ids, total } = await protocolsList('secretaria');
      expect(ids).not.toContain(draftId);
      expect(total).toBe(ids.length);
    });

    it('no aparece en GET /protocols para PRESIDENTE', async () => {
      const { ids } = await protocolsList('presidente');
      expect(ids).not.toContain(draftId);
    });

    it('no aparece en la fila VALIDAR de GET /secretaria/pendientes', async () => {
      expect(await validarIds()).not.toContain(draftId);
    });

    it('sí aparece en GET /protocols/mis-protocolos del investigador', async () => {
      const { ids } = await protocolsList(
        'investigador',
        '/api/protocols/mis-protocolos',
      );
      expect(ids).toContain(draftId);
    });
  });

  // ─── RF-02.3 c, e, e.1 y f: envío y reenvío ──────────────────────────────────
  describe('envío del borrador (9 → 15)', () => {
    let draftId: number;
    let submitStatus: number;

    beforeAll(async () => {
      draftId = await createDraft('ENVIO');
      submitStatus = (await submit(draftId)).status;
    });

    it('submit responde 201 y deja la recepción en 15', async () => {
      expect(submitStatus).toBe(201);
      expect(await receptionStatus(draftId)).toBe(15);
    });

    it('aparece en GET /reception/protocols?status=pendientes y sin filtro', async () => {
      expect(await receptionIds('?status=pendientes')).toContain(draftId);
      expect(await receptionIds('')).toContain(draftId);
    });

    it('aparece en la fila VALIDAR de GET /secretaria/pendientes', async () => {
      expect(await validarIds()).toContain(draftId);
    });

    it('aparece en GET /protocols para SECRETARIA', async () => {
      const { ids } = await protocolsList('secretaria');
      expect(ids).toContain(draftId);
    });

    it('registra PROTOCOL_SUBMITTED con registro_id = id del protocolo', async () => {
      // El interceptor escribe la auditoría después de responder: se espera un momento.
      let rows: any[] = [];
      for (let i = 0; i < 20 && rows.length === 0; i++) {
        rows = await ds.query(
          `SELECT registro_id, usuario_id FROM sistema.audit_log
            WHERE accion = 'PROTOCOL_SUBMITTED' AND registro_id = $1`,
          [draftId],
        );
        if (rows.length === 0) await new Promise((r) => setTimeout(r, 100));
      }
      expect(rows).toHaveLength(1);
      expect(Number(rows[0].usuario_id)).toBe(investigadorId);
    });

    it('segundo submit (ya en 15) → 409 con mensaje en español y el estado no cambia', async () => {
      const res = await submit(draftId);
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(CONFLICT_MESSAGE);
      expect(await receptionStatus(draftId)).toBe(15);
    });
  });

  describe('reenvío después de una subsanación documental', () => {
    it('reenvío desde INCOMPLETO (11, por POST finalize de la Secretaría) → 15', async () => {
      const id = await createDraft('REENVIO_11');
      expect((await submit(id)).status).toBe(201);
      const fin = await api()
        .post(`/api/reception/protocol/${id}/finalize`)
        .set(auth('secretaria'))
        .send({});
      expect(fin.status).toBe(201);
      expect(await receptionStatus(id)).toBe(11);

      const res = await submit(id);
      expect(res.status).toBe(201);
      expect(await receptionStatus(id)).toBe(15);
    });

    it('reenvío desde REQUIERE_SUBSANACION_DOC (20) → 15', async () => {
      const id = await createDraft('REENVIO_20');
      await forceReceptionStatus(id, 20);

      const res = await submit(id);
      expect(res.status).toBe(201);
      expect(await receptionStatus(id)).toBe(15);
    });
  });

  describe('envío rechazado (RF-02.3 e.1)', () => {
    it('submit con la recepción en ARCHIVADO_VENCIMIENTO (12, por POST archive-vencimiento) → 409 y el estado no cambia', async () => {
      const id = await createDraft('RECHAZO_12');
      expect((await submit(id)).status).toBe(201);
      const arch = await api()
        .post(`/api/reception/protocol/${id}/archive-vencimiento`)
        .set(auth('secretaria'))
        .send({});
      expect(arch.status).toBe(201);
      expect(await receptionStatus(id)).toBe(12);

      const res = await submit(id);
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(CONFLICT_MESSAGE);
      expect(await receptionStatus(id)).toBe(12);
    });

    it.each([
      ['COMPLETO', 10],
      ['EN_CONTROL_DOCUMENTAL', 21],
    ] as const)(
      'submit con la recepción en %s (%i) → 409 con mensaje en español y el estado no cambia',
      async (key, statusId) => {
        const id = await createDraft(`RECHAZO_${key}`);
        await forceReceptionStatus(id, statusId);

        const res = await submit(id);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(CONFLICT_MESSAGE);
        expect(await receptionStatus(id)).toBe(statusId);
      },
    );

    it('submit de otro investigador → 400 y el estado no cambia', async () => {
      const id = await createDraft('OTRO_INVESTIGADOR');
      const res = await submit(id, 'otro');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'Solo el investigador principal puede enviar el protocolo para revisión',
      );
      expect(await receptionStatus(id)).toBe(9);
    });

    it('dos submit simultáneos del mismo borrador: uno 201 y el otro 409', async () => {
      const id = await createDraft('CONCURRENTE');
      const statuses = (await Promise.all([submit(id), submit(id)]))
        .map((r) => r.status)
        .sort((a, b) => a - b);
      expect(statuses).toEqual([201, 409]);
      expect(await receptionStatus(id)).toBe(15);
    });
  });
});
