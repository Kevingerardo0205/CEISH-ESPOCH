/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.16 — POST y PATCH /evaluations/profiles (perfiles de evaluador).
 *
 * Registra ResponseInterceptor igual que main.ts:39. Guards reales y login real de
 * secretaria@test.com (única con EVALUADORES_PERFILES) con la contraseña de
 * E2E_TEST_ACCOUNTS_PASSWORD (no se escribe ni se imprime). Perfiles ZZ_TEST_PERF_ con datos
 * inventados; los de PATCH se insertan por SQL para probar PATCH sin depender de POST. Limpieza en
 * beforeAll y afterAll de los perfiles y de sus filas de audit_log. Solo ceish_test_db.
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
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_PERF_';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const DUPLICATE_MESSAGE = 'Ya existe un perfil con ese nombre';
/** Distinto en cada corrida para no chocar con la restricción UNIQUE de nombre. */
const RUN = randomBytes(4).toString('hex').toUpperCase();
const nameFor = (key: string): string => `${PREFIX}${RUN}_${key}`;

describe('TSK-001.16 — POST y PATCH /evaluations/profiles (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let secretariaId: number;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${secretariaToken}` });

  async function cleanup(): Promise<void> {
    const profiles = `SELECT id FROM catalogos.perfiles_evaluador WHERE nombre LIKE '${PREFIX}%'`;
    await ds.query(
      `DELETE FROM sistema.audit_log
        WHERE accion LIKE 'EVALUATOR_PROFILE_%'
          AND (registro_id IN (${profiles}) OR datos_nuevos::text LIKE '%${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM catalogos.perfiles_evaluador WHERE nombre LIKE '${PREFIX}%'`,
    );
  }

  /** Perfil creado por la prueba directamente en la base (para PATCH). */
  async function insertProfile(
    name: string,
    description: string | null,
    priorityOrder: number,
  ): Promise<number> {
    const [{ id }] = await ds.query(
      `INSERT INTO catalogos.perfiles_evaluador (nombre, descripcion, orden_prioridad)
       VALUES ($1, $2, $3) RETURNING id`,
      [name, description, priorityOrder],
    );
    return id;
  }

  async function profileRow(id: number): Promise<any> {
    const [row] = await ds.query(
      `SELECT nombre, descripcion, orden_prioridad, activo
         FROM catalogos.perfiles_evaluador WHERE id = $1`,
      [id],
    );
    return row;
  }

  /** El interceptor escribe la auditoría después de responder: se espera la fila un momento. */
  async function createdAuditRow(name: string): Promise<any> {
    let rows: any[] = [];
    for (let i = 0; i < 30 && rows.length === 0; i++) {
      rows = await ds.query(
        `SELECT registro_id FROM sistema.audit_log
          WHERE accion = 'EVALUATOR_PROFILE_CREATED' AND usuario_id = $1
            AND datos_nuevos->>'nombre' = $2
          ORDER BY id DESC LIMIT 1`,
        [secretariaId, name],
      );
      if (rows.length === 0) await new Promise((r) => setTimeout(r, 100));
    }
    return rows[0];
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

  describe('POST /evaluations/profiles', () => {
    it('responde 201, guarda nombre, descripción y orden en la base y EVALUATOR_PROFILE_CREATED tiene registro_id = id del perfil', async () => {
      const name = nameFor('CREADO');
      const res = await api()
        .post('/api/evaluations/profiles')
        .set(auth())
        .send({
          nombre: name,
          descripcion: 'Perfil inventado',
          ordenPrioridad: 7,
        });
      expect(res.status).toBe(201);
      const [{ id }] = await ds.query(
        `SELECT id FROM catalogos.perfiles_evaluador WHERE nombre = $1`,
        [name],
      );
      expect(await profileRow(id)).toEqual({
        nombre: name,
        descripcion: 'Perfil inventado',
        orden_prioridad: 7,
        activo: true,
      });
      // La fila de auditoría se busca por el nombre, no por registro_id, para ver si quedó NULL.
      const audit = await createdAuditRow(name);
      expect(audit).toBeDefined();
      expect(audit.registro_id).toBe(id);
      expect(res.body.data?.id).toBe(id);
    });

    it('con un nombre que ya existe responde 409 «Ya existe un perfil con ese nombre»', async () => {
      const name = nameFor('DUP_POST');
      await insertProfile(name, null, 0);
      const res = await api()
        .post('/api/evaluations/profiles')
        .set(auth())
        .send({ nombre: name });
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body).includes(DUPLICATE_MESSAGE)).toBe(true);
    });
  });

  describe('PATCH /evaluations/profiles/:id', () => {
    it('cambia el nombre y no toca descripción ni orden', async () => {
      const id = await insertProfile(nameFor('ANTES'), 'Sin cambios', 3);
      const res = await api()
        .patch(`/api/evaluations/profiles/${id}`)
        .set(auth())
        .send({ nombre: nameFor('DESPUES') });
      expect(res.status).toBe(200);
      expect(await profileRow(id)).toEqual({
        nombre: nameFor('DESPUES'),
        descripcion: 'Sin cambios',
        orden_prioridad: 3,
        activo: true,
      });
    });

    it('con ordenPrioridad 0 guarda el 0', async () => {
      const id = await insertProfile(nameFor('ORDEN'), null, 5);
      const res = await api()
        .patch(`/api/evaluations/profiles/${id}`)
        .set(auth())
        .send({ ordenPrioridad: 0 });
      expect(res.status).toBe(200);
      expect((await profileRow(id)).orden_prioridad).toBe(0);
    });

    it('con cuerpo vacío responde 200 con el perfil actual y no cambia la fila', async () => {
      const id = await insertProfile(nameFor('VACIO'), 'Igual', 2);
      const before = await profileRow(id);
      const res = await api()
        .patch(`/api/evaluations/profiles/${id}`)
        .set(auth())
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.data?.id).toBe(id);
      expect(res.body.data?.name).toBe(nameFor('VACIO'));
      expect(await profileRow(id)).toEqual(before);
    });

    it('renombrar al mismo nombre responde 200', async () => {
      const id = await insertProfile(nameFor('MISMO'), null, 0);
      const res = await api()
        .patch(`/api/evaluations/profiles/${id}`)
        .set(auth())
        .send({ nombre: nameFor('MISMO') });
      expect(res.status).toBe(200);
      expect((await profileRow(id)).nombre).toBe(nameFor('MISMO'));
    });

    it('con el nombre de otro perfil responde 409 «Ya existe un perfil con ese nombre» y no cambia la fila', async () => {
      await insertProfile(nameFor('OCUPADO'), null, 0);
      const id = await insertProfile(nameFor('LIBRE'), null, 0);
      const res = await api()
        .patch(`/api/evaluations/profiles/${id}`)
        .set(auth())
        .send({ nombre: nameFor('OCUPADO') });
      expect(res.status).toBe(409);
      expect(JSON.stringify(res.body).includes(DUPLICATE_MESSAGE)).toBe(true);
      expect((await profileRow(id)).nombre).toBe(nameFor('LIBRE'));
    });
  });
});
