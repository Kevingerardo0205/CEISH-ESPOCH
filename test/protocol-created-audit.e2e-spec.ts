/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.9 — spec-001 RF-02.6 a–b (v3.7.2): PROTOCOL_CREATED en sistema.audit_log con
 * registro_id = id del protocolo y sin cédulas ni teléfonos en datos_nuevos.
 *
 * Registra ResponseInterceptor igual que main.ts:39: en producción AuditInterceptor (APP_INTERCEPTOR)
 * envuelve a ResponseInterceptor y recibe la respuesta ya envuelta ({ data, statusCode, message }).
 * Guards reales y login real del investigador ZZ_TEST_AUD_ (correo @e2e-tsk-001-9.test, contraseña
 * generada aquí). AuditService real. Cédulas y teléfonos inventados. Limpieza en beforeAll y afterAll,
 * incluidas las filas de audit_log de los usuarios de prueba. Solo ceish_test_db.
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

const PREFIX = 'ZZ_TEST_AUD_';
const EMAIL_DOMAIN = '@e2e-tsk-001-9.test';

// Datos inventados (no son de personas reales); se buscan como texto en datos_nuevos.
const CO_ID = '9900000191';
const CO_PHONE = '0990000191';
const SPONSOR_ID = '9900000192';
const SPONSOR_PHONE = '0990000192';
const PROTOCOL_SPONSOR_PHONE = '0990000193';
const INSTITUTION_CONTACT_PHONE = '0990000194';
const SPONSOR_RUC = '9900000195001';
const PERSONAL_VALUES = [
  CO_ID,
  CO_PHONE,
  SPONSOR_ID,
  SPONSOR_PHONE,
  PROTOCOL_SPONSOR_PHONE,
  INSTITUTION_CONTACT_PHONE,
  SPONSOR_RUC,
];
const SECRETARIA_EMAIL = 'secretaria@test.com';
/** Acciones de la SECRETARIA que crea esta prueba; sus filas se borran por el prefijo en datos_nuevos. */
const SECRETARIA_ACTIONS = ['USER_CREATED', 'PLACE_CREATED'];

describe('TSK-001.9 — auditoría de la creación del protocolo (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let secretariaToken: string;
  let secretariaId: number;
  let investigadorId: number;
  let studyTypeId: number;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const secretariaAuth = () => ({
    Authorization: `Bearer ${secretariaToken}`,
  });

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM sistema.audit_log WHERE usuario_id IN (${users})`,
    );
    await ds.query(
      `DELETE FROM sistema.audit_log
        WHERE accion = ANY($1) AND datos_nuevos::text LIKE '%${PREFIX}%'`,
      [SECRETARIA_ACTIONS],
    );
    await ds.query(
      `DELETE FROM evaluacion.lugares WHERE nombre LIKE '${PREFIX}%'`,
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
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN (${users})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  /** El interceptor escribe la auditoría después de responder: se espera la fila un momento. */
  async function auditRows(
    action: string,
    userId = investigadorId,
  ): Promise<any[]> {
    let rows: any[] = [];
    for (let i = 0; i < 30 && rows.length === 0; i++) {
      rows = await ds.query(
        `SELECT registro_id, datos_nuevos FROM sistema.audit_log
          WHERE accion = $1 AND usuario_id = $2
            AND (usuario_id <> $3 OR datos_nuevos::text LIKE '%${PREFIX}%')
          ORDER BY id`,
        [action, userId, secretariaId],
      );
      if (rows.length === 0) await new Promise((r) => setTimeout(r, 100));
    }
    return rows;
  }

  async function createProtocol(key: string): Promise<number> {
    const title = `${PREFIX}${key} estudio de prueba de la auditoría`;
    const res = await api()
      .post('/api/protocols')
      .set(auth())
      .send({
        title,
        principalInvestigatorId: investigadorId,
        studyTypeId,
        isAffidavitAccepted: true,
        sponsorPhone: PROTOCOL_SPONSOR_PHONE,
        sponsorExecutingAgency: `${PREFIX}Agencia`,
        sponsorRuc: SPONSOR_RUC,
        investigators: [
          {
            fullName: `${PREFIX}Coinvestigador`,
            identification: CO_ID,
            position: 'Docente',
            institution: `${PREFIX}Institución`,
            email: `co${EMAIL_DOMAIN}`,
            phone: CO_PHONE,
            education: 'Maestría',
            role: 'CO_INVESTIGADOR',
          },
          {
            fullName: `${PREFIX}Patrocinador`,
            identification: SPONSOR_ID,
            position: 'Gerente',
            institution: `${PREFIX}Patrocinadora`,
            email: `sponsor${EMAIL_DOMAIN}`,
            phone: SPONSOR_PHONE,
            education: 'Tercer nivel',
            role: 'PATROCINADOR',
          },
        ],
        institutions: [
          {
            name: `${PREFIX}Institución participante`,
            type: 'PUBLIC',
            address: 'Dirección de prueba',
            contactPerson: `${PREFIX}Contacto`,
            contactEmail: `contacto${EMAIL_DOMAIN}`,
            contactPhone: INSTITUTION_CONTACT_PHONE,
          },
        ],
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

    const [st] = await ds.query(
      `SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'IO'`,
    );
    studyTypeId = st.id;

    const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generated, 10);
    const [u] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ('ZZAUD0019', $1, $2, $3, true, true) RETURNING id`,
      [`${PREFIX}Investigador`, `investigador${EMAIL_DOMAIN}`, hash],
    );
    investigadorId = u.id;
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = 'INVESTIGADOR'`,
      [investigadorId],
    );
    const login = await api()
      .post('/api/auth/login')
      .send({ email: `investigador${EMAIL_DOMAIN}`, password: generated });
    if (login.status !== 201) {
      throw new Error(
        `Login del investigador falló con status ${login.status}`,
      );
    }
    token = login.body.data?.access_token ?? login.body.access_token;

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

  describe('PROTOCOL_CREATED (RF-02.6)', () => {
    let protocolId: number;
    let row: any;

    beforeAll(async () => {
      protocolId = await createProtocol('CREADO');
      [row] = await auditRows('PROTOCOL_CREATED');
    });

    it('POST /protocols deja una fila PROTOCOL_CREATED con registro_id = id del protocolo creado', () => {
      expect(row).toBeDefined();
      expect(row.registro_id).toBe(protocolId);
    });

    it('datos_nuevos no contiene ninguna cédula ni teléfono de los enviados (en todo el JSON)', () => {
      const text = JSON.stringify(row.datos_nuevos);
      for (const value of PERSONAL_VALUES) {
        expect(text).not.toContain(value);
      }
    });

    it('datos_nuevos no tiene las claves identification, phone ni sponsorPhone y conserva el resto', () => {
      const d = row.datos_nuevos;
      expect(d).not.toHaveProperty('sponsorPhone');
      expect(d).not.toHaveProperty('sponsorRuc');
      expect(d.institutions).toHaveLength(1);
      expect(d.institutions[0]).not.toHaveProperty('contactPhone');
      expect(d.institutions[0].contactPerson).toBe(`${PREFIX}Contacto`);
      expect(d.institutions[0].contactEmail).toBe(`contacto${EMAIL_DOMAIN}`);
      expect(d.title).toBe(`${PREFIX}CREADO estudio de prueba de la auditoría`);
      expect(d.sponsorExecutingAgency).toBe(`${PREFIX}Agencia`);
      expect(d.investigators).toHaveLength(2);
      for (const inv of d.investigators) {
        expect(inv).not.toHaveProperty('identification');
        expect(inv).not.toHaveProperty('phone');
        expect(inv.fullName).toMatch(new RegExp(`^${PREFIX}`));
        expect(inv.email).toMatch(/@e2e-tsk-001-9\.test$/);
      }
    });
  });

  describe('otras acciones de creación sin parámetros de ruta', () => {
    it('USER_CREATED (POST /auth/users) guarda registro_id = id del usuario creado', async () => {
      // Sin contraseña en el cuerpo (ver hallazgo de seguridad de TSK-001.9); el correo está simulado.
      const res = await api()
        .post('/api/auth/users')
        .set(secretariaAuth())
        .send({
          nationalId: 'ZZAUD0029',
          fullName: `${PREFIX}Usuario creado`,
          email: `creado${EMAIL_DOMAIN}`,
          roles: ['INVESTIGADOR'],
        });
      expect(res.status).toBe(201);
      const [user] = await ds.query(
        `SELECT id FROM catalogos.usuarios WHERE email_institucional = $1`,
        [`creado${EMAIL_DOMAIN}`],
      );
      const rows = await auditRows('USER_CREATED', secretariaId);
      expect(rows.map((r) => r.registro_id)).toEqual([user.id]);
    });

    it('PLACE_CREATED (id uuid) sigue guardando su fila, con registro_id NULL', async () => {
      const res = await api()
        .post('/api/evaluations/calls/places')
        .set(secretariaAuth())
        .send({ name: `${PREFIX}Lugar` });
      expect(res.status).toBe(201);
      const rows = await auditRows('PLACE_CREATED', secretariaId);
      expect(rows.map((r) => r.registro_id)).toEqual([null]);
    });
  });

  describe('regresión: acciones con :id en la ruta', () => {
    let protocolId: number;

    beforeAll(async () => {
      protocolId = await createProtocol('REGRESION');
    });

    it('DOCUMENT_UPLOADED sigue con registro_id = id del protocolo (:id de la ruta)', async () => {
      const [req] = await ds.query(
        `SELECT id FROM public.protocolo_requisitos WHERE protocolo_id = $1 ORDER BY id LIMIT 1`,
        [protocolId],
      );
      const res = await api()
        .post(`/api/protocols/${protocolId}/upload-document`)
        .set(auth())
        .send({
          fileName: 'zz-test-aud.pdf',
          path: `zz-test/${protocolId}/zz-test-aud.pdf`,
          requirementId: req.id,
        });
      expect(res.status).toBe(201);
      const rows = await auditRows('DOCUMENT_UPLOADED');
      expect(rows.map((r) => r.registro_id)).toEqual([protocolId]);
    });

    it('PROTOCOL_SUBMITTED sigue con registro_id = id del protocolo (:id de la ruta)', async () => {
      const res = await api()
        .post(`/api/protocols/${protocolId}/submit`)
        .set(auth())
        .send({});
      expect(res.status).toBe(201);
      const rows = await auditRows('PROTOCOL_SUBMITTED');
      expect(rows.map((r) => r.registro_id)).toEqual([protocolId]);
    });
  });
});
