/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.22 — spec-001 RF-02.9 a–d (v3.7.6): en POST /protocols el investigador principal sale
 * del usuario autenticado (JWT), no del cuerpo, y solo el rol INVESTIGADOR crea protocolos.
 * - principalInvestigatorId de otro usuario → 400 en español, sin protocolo nuevo.
 * - Sin el campo o con el mismo id → a nombre del usuario del token.
 * - EVALUADOR → 403, sin protocolo nuevo.
 * - PROTOCOL_CREATED con usuario_id = investigador principal guardado.
 *
 * Guards reales y login real de 2 investigadores y 1 evaluador ZZ_TEST_PIJWT_ (correo
 * @e2e-tsk-001-22.test, contraseñas generadas aquí). Correo y almacenamiento simulados de forma
 * explícita; la auditoría es la real. Limpieza en beforeAll y afterAll. Solo ceish_test_db.
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
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_PIJWT_';
const EMAIL_DOMAIN = '@e2e-tsk-001-22.test';
const OTHER_PI_MESSAGE =
  'No puede crear un protocolo a nombre de otro investigador.';

type UserKey = 'investigadorA' | 'investigadorB' | 'evaluador';
const USERS: Array<{ key: UserKey; cedula: string; role: string }> = [
  { key: 'investigadorA', cedula: 'ZZPIJ0221', role: 'INVESTIGADOR' },
  { key: 'investigadorB', cedula: 'ZZPIJ0222', role: 'INVESTIGADOR' },
  { key: 'evaluador', cedula: 'ZZPIJ0223', role: 'EVALUADOR' },
];

describe('TSK-001.22 — POST /protocols con el investigador principal del JWT (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let studyTypeId: number;
  const ids = {} as Record<UserKey, number>;
  const tokens = {} as Record<UserKey, string>;

  const api = () => request(app.getHttpServer());
  const create = (who: UserKey, title: string, extra: object = {}) =>
    api()
      .post('/api/protocols')
      .set('Authorization', `Bearer ${tokens[who]}`)
      .send({
        title: `${PREFIX}${title}`,
        studyTypeId,
        isAffidavitAccepted: true,
        investigators: [],
        institutions: [],
        ...extra,
      });
  const protocolsTitled = (title: string): Promise<any[]> =>
    ds.query(
      `SELECT id, investigador_principal_id FROM public.protocolos WHERE titulo = $1`,
      [`${PREFIX}${title}`],
    );
  const principalRows = (protocolId: number): Promise<any[]> =>
    ds.query(
      `SELECT usuario_id, email FROM public.protocolo_investigadores
        WHERE protocolo_id = $1 AND rol = 'PRINCIPAL'`,
      [protocolId],
    );

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%' OR investigador_principal_id IN (${users})`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM sistema.audit_log WHERE usuario_id IN (${users})`,
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
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM public.protocolos WHERE id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN (${users})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  beforeAll(async () => {
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
        generateUploadUrl: jest
          .fn()
          .mockResolvedValue('https://test.local/upload'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f'),
        uploadFile: jest.fn().mockResolvedValue(undefined),
        getMetadata: jest.fn().mockResolvedValue({}),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        deleteMultipleFiles: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor()); // igual que main.ts
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

    const [st] = await ds.query(
      `SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'IO'`,
    );
    studyTypeId = st.id;

    for (const { key, cedula, role } of USERS) {
      const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
      const hash = await bcrypt.hash(generated, 10);
      const email = `${key.toLowerCase()}${EMAIL_DOMAIN}`;
      const [u] = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        [cedula, `${PREFIX}${key}`, email, hash],
      );
      ids[key] = u.id;
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
         SELECT $1, id FROM catalogos.roles WHERE codigo = $2`,
        [u.id, role],
      );
      const login = await api()
        .post('/api/auth/login')
        .send({ email, password: generated });
      if (login.status !== 201) {
        throw new Error(`Login de ${key} falló con status ${login.status}`);
      }
      tokens[key] = login.body.data?.access_token ?? login.body.access_token;
    }
  });

  afterAll(async () => {
    if (ds) await cleanup();
    if (app) await app.close();
  });

  describe('principalInvestigatorId en el cuerpo (RF-02.9 a y b)', () => {
    it('con el id de otro investigador responde 400 en español y no crea ningún protocolo', async () => {
      const title = 'OTRO estudio de prueba a nombre de otro investigador';
      const res = await create('investigadorA', title, {
        principalInvestigatorId: ids.investigadorB,
      });
      // Antes de TSK-001.22 respondía 201 y el protocolo quedaba a nombre de investigadorB.
      expect(await protocolsTitled(title)).toEqual([]);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain(OTHER_PI_MESSAGE);
    });

    it('sin el campo, el protocolo queda a nombre del usuario del token', async () => {
      const title = 'SIN campo estudio de prueba del investigador del token';
      const res = await create('investigadorA', title);
      expect(res.status).toBe(201);
      const rows = await protocolsTitled(title);
      expect(rows).toHaveLength(1);
      expect(rows[0].investigador_principal_id).toBe(ids.investigadorA);
      const pi = await principalRows(rows[0].id);
      expect(pi).toHaveLength(1);
      expect(pi[0].usuario_id).toBe(ids.investigadorA);
      expect(pi[0].email).toBe(`investigadora${EMAIL_DOMAIN}`);
    });

    it('con el mismo id del token se ignora y el protocolo queda a nombre del usuario del token', async () => {
      const title = 'MISMO id estudio de prueba del investigador del token';
      const res = await create('investigadorB', title, {
        principalInvestigatorId: ids.investigadorB,
      });
      expect(res.status).toBe(201);
      const rows = await protocolsTitled(title);
      expect(rows).toHaveLength(1);
      expect(rows[0].investigador_principal_id).toBe(ids.investigadorB);
      const pi = await principalRows(rows[0].id);
      expect(pi.map((r) => r.usuario_id)).toEqual([ids.investigadorB]);
    });

    it('con un id que no es número responde 400 sin crear nada', async () => {
      const title = 'TEXTO estudio de prueba con id que no es número';
      const res = await create('investigadorA', title, {
        principalInvestigatorId: 'abc',
      });
      expect(res.status).toBe(400);
      expect(await protocolsTitled(title)).toEqual([]);
    });
  });

  describe('rol (RF-02.9 c)', () => {
    it('un EVALUADOR recibe 403 y no se crea ningún protocolo', async () => {
      const title = 'EVALUADOR estudio de prueba sin rol de investigador';
      const res = await create('evaluador', title);
      expect(await protocolsTitled(title)).toEqual([]);
      expect(res.status).toBe(403);
    });

    it('un EVALUADOR con su propio id en el cuerpo también recibe 403', async () => {
      const title =
        'EVALUADOR propio estudio de prueba sin rol de investigador';
      const res = await create('evaluador', title, {
        principalInvestigatorId: ids.evaluador,
      });
      expect(await protocolsTitled(title)).toEqual([]);
      expect(res.status).toBe(403);
    });
  });

  describe('auditoría (RF-02.9 d)', () => {
    it('PROTOCOL_CREATED tiene usuario_id = investigador principal guardado y registro_id = id del protocolo', async () => {
      const title = 'AUDITORIA estudio de prueba de la fila de auditoría';
      const res = await create('investigadorB', title);
      expect(res.status).toBe(201);
      const [protocol] = await protocolsTitled(title);
      // El AuditInterceptor escribe la fila después de responder: se espera hasta 3 s.
      let rows: any[] = [];
      for (let i = 0; i < 30 && rows.length === 0; i++) {
        rows = await ds.query(
          `SELECT usuario_id, registro_id FROM sistema.audit_log
            WHERE accion = 'PROTOCOL_CREATED' AND registro_id = $1`,
          [protocol.id],
        );
        if (rows.length === 0) await new Promise((r) => setTimeout(r, 100));
      }
      expect(rows).toHaveLength(1);
      expect(rows[0].usuario_id).toBe(protocol.investigador_principal_id);
      expect(rows[0].usuario_id).toBe(ids.investigadorB);
    });

    it('toda fila PROTOCOL_CREATED de los usuarios de prueba tiene usuario_id = investigador principal del protocolo', async () => {
      // Con el código anterior, el protocolo creado por investigadorA a nombre de investigadorB
      // dejaba una fila con usuario_id = investigadorA en un protocolo de investigadorB.
      const rows: any[] = await ds.query(
        `SELECT a.usuario_id, p.investigador_principal_id
           FROM sistema.audit_log a
           JOIN public.protocolos p ON p.id = a.registro_id
          WHERE a.accion = 'PROTOCOL_CREATED' AND a.usuario_id = ANY($1)`,
        [[ids.investigadorA, ids.investigadorB, ids.evaluador]],
      );
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.usuario_id).toBe(row.investigador_principal_id);
      }
    });
  });
});
