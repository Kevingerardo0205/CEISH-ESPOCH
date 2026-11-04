/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * HU-001 k) Rechazos del login con código estable y mensajes en español.
 *
 * Login real contra ceish_test_db con el HttpExceptionFilter global (igual que
 * main.ts): el código llega en body.error.code y el mensaje en body.error.message.
 * Crea usuarios temporales (@e2e-login.test) y los elimina en beforeAll y afterAll.
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

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

// Textos esperados escritos a mano (no se importan del enum, para que una
// mutación del mensaje en el código haga fallar la prueba).
const MSG_INVALID = 'Correo o contraseña incorrectos.';
const MSG_DISABLED = 'Su cuenta está desactivada. Contacte al administrador.';
const MSG_NOT_VERIFIED =
  'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
const MSG_LOCKED =
  'Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde.';

describe('HU-001 k) Rechazos del login: status, code y mensaje (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;

  const EMAIL_SUFFIX = '@e2e-login.test';
  const PWD = 'E2eLogin_001!';
  const emailOf = (k: string) => `e2e_login_${k}${EMAIL_SUFFIX}`;

  const login = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });

  const cleanup = async () => {
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
       (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_SUFFIX}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_SUFFIX}`],
    );
  };

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
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    ds = app.get(DataSource);
    const dbCheck: Array<{ current_database: string }> = await ds.query(
      'SELECT current_database()',
    );
    if (!dbCheck[0].current_database.includes('test')) {
      throw new Error(
        `ABORT: DataSource conectado a '${dbCheck[0].current_database}'.`,
      );
    }

    await cleanup();

    const hash = await bcrypt.hash(PWD, 10);
    let seq = 500;
    const insertUser = async (
      key: string,
      opts: { activo?: boolean; verificado?: boolean; bloqueado?: boolean },
    ): Promise<void> => {
      seq++;
      await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash,
            activo, email_verificado, bloqueado_hasta)
         VALUES ($1, $2, $3, $4, $5, $6,
                 CASE WHEN $7::boolean THEN NOW() + INTERVAL '1 hour' ELSE NULL END)`,
        [
          `E2L${seq.toString().padStart(7, '0')}`,
          `E2E LOGIN ${key}`,
          emailOf(key),
          hash,
          opts.activo ?? true,
          opts.verificado ?? true,
          opts.bloqueado ?? false,
        ],
      );
    };

    await insertUser('ok', {});
    await insertUser('sinverificar', { verificado: false });
    await insertUser('bloqueada', { bloqueado: true });
    await insertUser('desactivada', { activo: false });
    await insertUser('pwdmal', {});
    await insertUser('bloqueo', {});
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('control: credenciales válidas → 201 con access_token', async () => {
    const res = await login(emailOf('ok'), PWD);
    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeTruthy();
  });

  it('correo sin verificar → 403, EMAIL_NOT_VERIFIED, mensaje de verificación sin cambios', async () => {
    const res = await login(emailOf('sinverificar'), PWD);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.error.message).toBe(MSG_NOT_VERIFIED);
  });

  it('cuenta bloqueada → 403, ACCOUNT_LOCKED, mensaje en español', async () => {
    const res = await login(emailOf('bloqueada'), PWD);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(res.body.error.message).toBe(MSG_LOCKED);
  });

  it('cuenta desactivada → 401, ACCOUNT_DISABLED, mensaje sin cambios', async () => {
    const res = await login(emailOf('desactivada'), PWD);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
    expect(res.body.error.message).toBe(MSG_DISABLED);
  });

  it('contraseña incorrecta → 401, INVALID_CREDENTIALS, "Correo o contraseña incorrectos."', async () => {
    const res = await login(emailOf('pwdmal'), 'Incorrecta_999!');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe(MSG_INVALID);
  });

  it('correo inexistente → 401, INVALID_CREDENTIALS, "Correo o contraseña incorrectos."', async () => {
    const res = await login(emailOf('noexiste'), PWD);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe(MSG_INVALID);
  });

  it('correo inexistente y contraseña incorrecta devuelven el mismo cuerpo de error', async () => {
    const noUser = await login(emailOf('noexiste2'), PWD);
    const badPwd = await login(emailOf('pwdmal'), 'Incorrecta_999!');
    expect(noUser.status).toBe(badPwd.status);
    expect(noUser.body.error.code).toBe(badPwd.body.error.code);
    expect(noUser.body.error.message).toBe(badPwd.body.error.message);
  });

  it('bloqueo sin cambios: el 3.er fallo responde INVALID_CREDENTIALS y el siguiente ACCOUNT_LOCKED', async () => {
    const codes: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await login(emailOf('bloqueo'), 'Incorrecta_999!');
      expect(r.status).toBe(401);
      codes.push(r.body.error.code);
    }
    expect(codes).toEqual([
      'INVALID_CREDENTIALS',
      'INVALID_CREDENTIALS',
      'INVALID_CREDENTIALS',
    ]);
    const locked = await login(emailOf('bloqueo'), PWD);
    expect(locked.status).toBe(403);
    expect(locked.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(locked.body.error.message).toBe(MSG_LOCKED);
  });
});
