/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.15 — spec-001 RF-AUD.1 (v3.7.3): secretos fuera de sistema.audit_log.
 *
 * Registra ResponseInterceptor igual que main.ts:39. Guards reales y login real de
 * secretaria@test.com con la contraseña de E2E_TEST_ACCOUNTS_PASSWORD (no se escribe ni se imprime).
 * Usuarios ZZ_TEST_SEC_ (correo @e2e-tsk-001-15.test) con contraseñas inventadas aquí, que nunca se
 * imprimen: solo se busca que no aparezcan en datos_nuevos. AuditService real. Limpieza en beforeAll y
 * afterAll, incluidas las filas de audit_log de la prueba. Solo ceish_test_db.
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
import { isDeepStrictEqual } from 'util';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { StripSecretsFromAuditLog1930000000000 } from '../src/migrations/1930000000000-StripSecretsFromAuditLog';

const PREFIX = 'ZZ_TEST_SEC_';
const EMAIL_DOMAIN = '@e2e-tsk-001-15.test';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const USER_ACTIONS = ['USER_CREATED', 'USER_UPDATED'];

/** Contraseña inventada en cada corrida; nunca se imprime. */
const inventedPassword = (): string =>
  `ZzSec-${randomBytes(9).toString('base64url')}-9a`;

describe('TSK-001.15 — secretos fuera de la auditoría (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let secretariaId: number;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${secretariaToken}` });

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    await ds.query(
      `DELETE FROM sistema.audit_log
        WHERE (accion = ANY($1) AND (registro_id IN (${users}) OR datos_nuevos::text LIKE '%${PREFIX}%'))
           OR accion LIKE '${PREFIX}%'`,
      [USER_ACTIONS],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN (${users})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  /** El interceptor escribe la auditoría después de responder: se espera la fila un momento. */
  async function auditRow(action: string, recordId: number): Promise<any> {
    let rows: any[] = [];
    for (let i = 0; i < 30 && rows.length === 0; i++) {
      rows = await ds.query(
        `SELECT registro_id, datos_nuevos FROM sistema.audit_log
          WHERE accion = $1 AND registro_id = $2 AND usuario_id = $3
          ORDER BY id DESC LIMIT 1`,
        [action, recordId, secretariaId],
      );
      if (rows.length === 0) await new Promise((r) => setTimeout(r, 100));
    }
    return rows[0];
  }

  async function createUser(key: string, password: string): Promise<number> {
    const res = await api()
      .post('/api/auth/users')
      .set(auth())
      .send({
        nationalId: `ZZSEC${key}`.slice(0, 20),
        fullName: `${PREFIX}${key}`,
        email: `${key.toLowerCase()}${EMAIL_DOMAIN}`,
        password,
        roles: ['INVESTIGADOR'],
      });
    if (res.status !== 201) {
      throw new Error(`POST /api/auth/users falló con status ${res.status}`);
    }
    const [row] = await ds.query(
      `SELECT id FROM catalogos.usuarios WHERE email_institucional = $1`,
      [`${key.toLowerCase()}${EMAIL_DOMAIN}`],
    );
    return row.id;
  }

  beforeAll(async () => {
    const password = process.env.E2E_TEST_ACCOUNTS_PASSWORD;
    if (!password) {
      // Sin la contraseña no se intenta el login (evita bloquear la cuenta de prueba).
      throw new Error(
        'ABORT: falta E2E_TEST_ACCOUNTS_PASSWORD (contraseña de secretaria@test.com).',
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
        sendReceptionIncomplete: jest.fn().mockResolvedValue(undefined),
        sendReceptionComplete: jest.fn().mockResolvedValue(undefined),
        sendResolutionEmail: jest.fn().mockResolvedValue(undefined),
        notifyPresidentNewProtocol: jest.fn().mockResolvedValue(undefined),
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendUnscheduledProtocolsAlert: jest.fn().mockResolvedValue(undefined),
        sendRiskLevelDesignated: jest.fn().mockResolvedValue(undefined),
        sendRiskDiscrepancyAlert: jest.fn().mockResolvedValue(undefined),
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
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
    app.useGlobalInterceptors(new ResponseInterceptor()); // igual que main.ts:39
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

    const sec = await api()
      .post('/api/auth/login')
      .send({ email: SECRETARIA_EMAIL, password });
    if (sec.status !== 201) {
      throw new Error(
        `Login de ${SECRETARIA_EMAIL} falló con status ${sec.status}`,
      );
    }
    secretariaToken = sec.body.data?.access_token ?? sec.body.access_token;
    const [s] = await ds.query(
      `SELECT id FROM catalogos.usuarios WHERE email_institucional = $1`,
      [SECRETARIA_EMAIL],
    );
    secretariaId = s.id;
  }, 120_000);

  afterAll(async () => {
    if (ds?.isInitialized) await cleanup();
    if (app) await app.close();
  }, 30_000);

  describe('acciones con contraseña en el cuerpo (RF-AUD.1 a)', () => {
    it('POST /auth/users con password: USER_CREATED sin la contraseña ni la clave password, con email, fullName y registro_id', async () => {
      const password = inventedPassword();
      const userId = await createUser('CREADO', password);
      const row = await auditRow('USER_CREATED', userId);
      expect(row).toBeDefined();
      expect(row.registro_id).toBe(userId);
      const text = JSON.stringify(row.datos_nuevos);
      expect(text.includes(password)).toBe(false);
      expect(/"password"/i.test(text)).toBe(false);
      expect(row.datos_nuevos.email).toBe(`creado${EMAIL_DOMAIN}`);
      expect(row.datos_nuevos.fullName).toBe(`${PREFIX}CREADO`);
    });

    it('PATCH /auth/users/:id con password: USER_UPDATED sin la contraseña', async () => {
      const userId = await createUser('EDITADO', inventedPassword());
      const newPassword = inventedPassword();
      const res = await api()
        .patch(`/api/auth/users/${userId}`)
        .set(auth())
        .send({ fullName: `${PREFIX}EDITADO 2`, password: newPassword });
      expect(res.status).toBe(200);
      const row = await auditRow('USER_UPDATED', userId);
      expect(row).toBeDefined();
      const text = JSON.stringify(row.datos_nuevos);
      expect(text.includes(newPassword)).toBe(false);
      expect(/"password"/i.test(text)).toBe(false);
      expect(row.datos_nuevos.fullName).toBe(`${PREFIX}EDITADO 2`);
    });
  });

  describe('migración 1930000000000-StripSecretsFromAuditLog (RF-AUD.1 b)', () => {
    /**
     * Todo en una transacción de un solo QueryRunner (misma conexión, así la función temporal de
     * pg_temp existe para up() y para las lecturas) y SIEMPRE rollback: no quedan filas de la prueba
     * ni cambia ninguna fila ajena. Valores inventados; los expect solo comparan booleanos para no
     * imprimir el JSON si fallan.
     */
    it('up() quita los secretos en cualquier nivel, con variantes y en datos_anteriores, y deja igual el resto del JSON y la fila sin secretos', async () => {
      const MIG_ACTION = `${PREFIX}MIG`;
      const control = { keep: 'c', items: [{ a: 1 }], code: 'REQ_B' };
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        const [{ id: withSecretsId }] = await qr.query(
          `INSERT INTO sistema.audit_log (accion, datos_nuevos, datos_anteriores)
           VALUES ($1, $2::jsonb, $3::jsonb) RETURNING id`,
          [
            MIG_ACTION,
            JSON.stringify({
              keep: 'a',
              password: 'zz-ficticio-1',
              Pass_Word: 'zz-ficticio-1b',
              codigo_anexo: 'ANEXO_5',
              nested: {
                Refresh_Token: 'zz-ficticio-2',
                code: 'REQ_A',
                deeper: { 'Current-Password': 'zz-ficticio-5', ok: true },
                list: [
                  { otp: '000000', ok: 1 },
                  { 'access-token': 'zz-ficticio-3' },
                  [{ SECRET: 'zz-ficticio-6', n: 2 }],
                ],
              },
            }),
            JSON.stringify({ newPassword: 'zz-ficticio-4', name: 'b' }),
          ],
        );
        const [{ id: controlId }] = await qr.query(
          `INSERT INTO sistema.audit_log (accion, datos_nuevos)
           VALUES ($1, $2::jsonb) RETURNING id`,
          [MIG_ACTION, JSON.stringify(control)],
        );

        await new StripSecretsFromAuditLog1930000000000().up(qr);

        const rows: any[] = await qr.query(
          `SELECT id, datos_nuevos, datos_anteriores FROM sistema.audit_log
            WHERE id = ANY($1) ORDER BY id`,
          [[withSecretsId, controlId]],
        );
        const cleaned = rows.find((r) => r.id === withSecretsId);
        const untouched = rows.find((r) => r.id === controlId);

        expect(
          isDeepStrictEqual(cleaned.datos_nuevos, {
            keep: 'a',
            codigo_anexo: 'ANEXO_5',
            nested: {
              code: 'REQ_A',
              deeper: { ok: true },
              list: [{ ok: 1 }, {}, [{ n: 2 }]],
            },
          }),
        ).toBe(true);
        expect(isDeepStrictEqual(cleaned.datos_anteriores, { name: 'b' })).toBe(
          true,
        );
        expect(isDeepStrictEqual(untouched.datos_nuevos, control)).toBe(true);
        expect(untouched.datos_anteriores === null).toBe(true);
      } finally {
        await qr.rollbackTransaction();
        await qr.release();
      }
    });
  });
});
