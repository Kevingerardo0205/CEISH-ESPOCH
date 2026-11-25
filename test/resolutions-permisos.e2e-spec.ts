/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-015-N11 — spec-003 RF-17.7 (v1.6.4) y specs/001 v3.7.10: solo SECRETARIA crea o
 * sube resoluciones (RESOLUCION_CREAR).
 *
 * Guards reales y login real. Cuentas propias ZZ_TEST_RSP_ con contraseña generada aquí
 * (no se escribe en el código ni se imprime). No usa cuentas reales.
 *
 * Mutaciones que deben hacer fallar esta suite:
 * - quitar el DELETE de 2000000000002 (PRESIDENTE conserva la concesión → 403 no aparece);
 * - quitar @Permissions(RESOLUCION_CREAR) de POST /resolutions (PRESIDENTE pasa el guard).
 *
 * Solo ceish_test_db. Los datos se borran en afterAll y no se crea ninguna resolución.
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
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_RSP_';
const EMAIL_DOMAIN = '@e2e-rsp.test';

type Usuario = 'presidente' | 'secretaria';

describe('TSK-015-N11 — POST /api/resolutions: solo SECRETARIA crea (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Partial<Record<Usuario, string>> = {};
  const userId: Partial<Record<Usuario, number>> = {};
  let resolucionesAntes = 0;

  const api = () => request(app.getHttpServer());

  async function cleanup(): Promise<void> {
    // Por si quedara algo de una ejecución anterior: nunca se crean resoluciones aquí,
    // pero el borrado queda por seguridad y para que el conteo final sea 0.
    await ds.query(
      `DELETE FROM resolucion.resoluciones
        WHERE creado_por IN (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
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

  async function insertUser(
    key: string,
    passwordHash: string,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [
        `ZZRSP${key}`.slice(0, 20),
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

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    // Con ResponseInterceptor el token va en body.data.access_token.
    const accessToken: unknown = res.body?.data?.access_token;
    if (res.status !== 201 || typeof accessToken !== 'string') {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return accessToken;
  }

  async function contarResoluciones(): Promise<number> {
    const [row] = await ds.query(
      `SELECT count(*)::int AS c FROM resolucion.resoluciones`,
    );
    return row.c;
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
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    // Igual que main.ts:38-39: la envoltura { data, statusCode, message } la pone el interceptor.
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    ds = app.get(DataSource);
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!current_database.includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();

    // Contraseña generada en cada ejecución; no se imprime ni se guarda.
    const password = randomBytes(18).toString('base64url');
    const hash = await bcrypt.hash(password, 10);

    const presId = await insertUser('presidente', hash);
    await assignRole(presId, 'PRESIDENTE');
    const secId = await insertUser('secretaria', hash);
    await assignRole(secId, 'SECRETARIA');
    userId.presidente = presId;
    userId.secretaria = secId;

    token.presidente = await login(`presidente${EMAIL_DOMAIN}`, password);
    token.secretaria = await login(`secretaria${EMAIL_DOMAIN}`, password);

    resolucionesAntes = await contarResoluciones();
  }, 60_000);

  afterAll(async () => {
    if (ds) {
      const despues = await contarResoluciones();
      if (despues !== resolucionesAntes) {
        throw new Error(
          `Residuo: resolucion.resoluciones pasó de ${resolucionesAntes} a ${despues}`,
        );
      }
      await cleanup();
    }
    if (app) await app.close();
  });

  beforeEach(() => (PermissionsGuard as any).cache.clear());

  describe('POST /api/resolutions', () => {
    it('PRESIDENTE → 403 (ya no tiene RESOLUCION_CREAR)', async () => {
      const res = await api()
        .post('/api/resolutions')
        .set('Authorization', `Bearer ${token.presidente}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('SECRETARIA con cuerpo vacío → no 403 (pasa el permiso); no crea nada', async () => {
      const res = await api()
        .post('/api/resolutions')
        .set('Authorization', `Bearer ${token.secretaria}`)
        .send({});
      // Sin protocolo el servicio responde 400 o 404 (el payload no está validado como DTO; ver N11 riesgo).
      expect([400, 404]).toContain(res.status);
      expect(res.status).not.toBe(403);
      expect(await contarResoluciones()).toBe(resolucionesAntes);
    });
  });

  describe('GET /api/resolutions/protocol/:protocolId (sin cambios en TSK-015-N11)', () => {
    // Comportamiento actual, se restringe en TSK-015-N17.
    it('PRESIDENTE → 200 con lista vacía para un protocolo inexistente', async () => {
      const res = await api()
        .get('/api/resolutions/protocol/2147483000')
        .set('Authorization', `Bearer ${token.presidente}`);
      expect(res.status).toBe(200);
    });
  });
});
