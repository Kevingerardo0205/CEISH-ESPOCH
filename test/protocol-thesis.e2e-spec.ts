/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.12 — spec-001 RF-19.1 a–d (v3.7.4): trabajo de titulación (tesis) al crear el protocolo.
 * Con isThesis = true el checklist suma TESIS_ANTIPLAGIO y TESIS_OFICIO_TUTOR; sin tesis, no.
 * GET /protocols/:id devuelve isThesis. Los dos documentos se suben en PDF como el resto (.png → 400).
 *
 * Guards reales y login real del investigador ZZ_TEST_TES_ (correo @e2e-tsk-001-12.test, contraseña
 * generada aquí) y de secretaria@test.com (E2E_TEST_ACCOUNTS_PASSWORD). Requiere la migración 1940000000000-AddThesisFlagAndRequirements en ceish_test_db.
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
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_TES_';
const EMAIL_DOMAIN = '@e2e-tsk-001-12.test';
const THESIS_CODES = ['TESIS_ANTIPLAGIO', 'TESIS_OFICIO_TUTOR'];
const STUDY_TYPES = ['IO', 'EI', 'EC', 'EX'];
const THESIS_NAMES = [
  'Captura del informe antiplagio',
  'Oficio o certificado del tutor',
];
const SECRETARIA_EMAIL = 'secretaria@test.com';

describe('TSK-001.12 — tesis en la creación del protocolo (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let secretariaToken: string;
  let investigadorId: number;
  let studyTypeId: number;
  let thesisId: number;
  let noThesisId: number;
  let omittedId: number;
  let verifyId: number;

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const data = (res: request.Response): any => res.body?.data ?? res.body;

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM sistema.audit_log WHERE usuario_id IN (${users})`,
    );
    // Solo se escribe si la verificación pasa (p. ej. con la mutación M5).
    await ds.query(
      `DELETE FROM sistema.audit_log
        WHERE accion = 'REQUIREMENTS_VERIFIED'
          AND registro_id::text IN (SELECT id::text FROM public.protocolos WHERE titulo LIKE '${PREFIX}%')`,
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

  async function createProtocol(
    key: string,
    isThesis: boolean | undefined,
  ): Promise<number> {
    const title = `${PREFIX}${key} estudio de prueba del trabajo de titulación`;
    const body: Record<string, unknown> = {
      title,
      principalInvestigatorId: investigadorId,
      studyTypeId,
      isAffidavitAccepted: true,
      investigators: [],
      institutions: [],
    };
    if (isThesis !== undefined) body.isThesis = isThesis;
    const res = await api().post('/api/protocols').set(auth()).send(body);
    if (res.status !== 201) {
      throw new Error(`POST /api/protocols falló con status ${res.status}`);
    }
    const [row] = await ds.query(
      `SELECT id FROM public.protocolos WHERE titulo = $1`,
      [title],
    );
    return row.id;
  }

  async function checklistCodes(protocolId: number): Promise<string[]> {
    const rows: Array<{ codigo_requisito: string }> = await ds.query(
      `SELECT codigo_requisito FROM public.protocolo_requisitos
        WHERE protocolo_id = $1 ORDER BY codigo_requisito`,
      [protocolId],
    );
    return rows.map((r) => r.codigo_requisito);
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
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
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

    const [{ count }] = await ds.query(
      `SELECT count(*)::int AS count FROM catalogos.tipos_documento WHERE codigo_anexo = ANY($1)`,
      [THESIS_CODES],
    );
    if (count !== 2) {
      throw new Error(
        'ABORT: falta la migración 1940000000000-AddThesisFlagAndRequirements en ceish_test_db.',
      );
    }

    const [st] = await ds.query(
      `SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'IO'`,
    );
    studyTypeId = st.id;

    const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generated, 10);
    const [u] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ('ZZTES0012', $1, $2, $3, true, true) RETURNING id`,
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

    thesisId = await createProtocol('CON_TESIS', true);
    noThesisId = await createProtocol('SIN_TESIS', false);
    omittedId = await createProtocol('SIN_CAMPO', undefined);
    verifyId = await createProtocol('VERIFICAR', true);
  }, 60_000);

  afterAll(async () => {
    if (ds) await cleanup();
    if (app) await app.close();
  });

  describe('creación (RF-19.1 a)', () => {
    it('guarda es_tesis = true con isThesis: true y false con false o sin el campo', async () => {
      const rows: Array<{ id: number; es_tesis: boolean }> = await ds.query(
        `SELECT id, es_tesis FROM public.protocolos WHERE id = ANY($1)`,
        [[thesisId, noThesisId, omittedId]],
      );
      const byId = new Map(rows.map((r) => [r.id, r.es_tesis]));
      expect(byId.get(thesisId)).toBe(true);
      expect(byId.get(noThesisId)).toBe(false);
      expect(byId.get(omittedId)).toBe(false);
    });

    it('con tesis el checklist tiene exactamente TESIS_ANTIPLAGIO y TESIS_OFICIO_TUTOR más que sin tesis', async () => {
      const withThesis = await checklistCodes(thesisId);
      const withoutThesis = await checklistCodes(noThesisId);
      expect(withoutThesis.length).toBeGreaterThan(0);
      expect(withThesis.length - withoutThesis.length).toBe(2);
      expect(withThesis.filter((c) => !withoutThesis.includes(c))).toEqual(
        THESIS_CODES,
      );
    });

    it('sin tesis (false o sin el campo) el checklist no tiene los requisitos de tesis', async () => {
      for (const id of [noThesisId, omittedId]) {
        const codes = await checklistCodes(id);
        expect(codes.filter((c) => THESIS_CODES.includes(c))).toEqual([]);
      }
    });

    it('isThesis que no es booleano responde 400 y no crea el protocolo', async () => {
      const title = `${PREFIX}NO_BOOL estudio de prueba del trabajo de titulación`;
      const res = await api().post('/api/protocols').set(auth()).send({
        title,
        principalInvestigatorId: investigadorId,
        studyTypeId,
        isAffidavitAccepted: true,
        isThesis: 'si',
        investigators: [],
        institutions: [],
      });
      expect(res.status).toBe(400);
      const rows = await ds.query(
        `SELECT id FROM public.protocolos WHERE titulo = $1`,
        [title],
      );
      expect(rows).toHaveLength(0);
    });
  });

  describe('GET /protocols/:id (RF-19.1 c)', () => {
    it('devuelve isThesis = true en el protocolo con tesis', async () => {
      const res = await api().get(`/api/protocols/${thesisId}`).set(auth());
      expect(res.status).toBe(200);
      expect(data(res).isThesis).toBe(true);
    });

    it('devuelve isThesis = false en el protocolo sin tesis', async () => {
      const res = await api().get(`/api/protocols/${noThesisId}`).set(auth());
      expect(res.status).toBe(200);
      expect(data(res).isThesis).toBe(false);
    });

    it('GET /protocols/mis-protocolos también devuelve isThesis', async () => {
      const res = await api().get('/api/protocols/mis-protocolos').set(auth());
      expect(res.status).toBe(200);
      const payload = data(res);
      const items: any[] = Array.isArray(payload)
        ? payload
        : (payload.items ?? payload.data ?? []);
      const mine = items.find((p) => p.id === thesisId);
      expect(mine?.isThesis).toBe(true);
    });
  });

  describe('GET /protocols/requirements (RF-19.1 b)', () => {
    it.each(STUDY_TYPES)(
      'tipo %s: con tesis=true suma los 2 requisitos de tesis; sin tesis, no',
      async (tipo) => {
        const withThesis = await api()
          .get(`/api/protocols/requirements?tipo=${tipo}&tesis=true`)
          .set(auth());
        const withoutThesis = await api()
          .get(`/api/protocols/requirements?tipo=${tipo}`)
          .set(auth());
        expect(withThesis.status).toBe(200);
        expect(withoutThesis.status).toBe(200);
        const a = (data(withThesis) as Array<{ code: string }>).map(
          (r) => r.code,
        );
        const b = (data(withoutThesis) as Array<{ code: string }>).map(
          (r) => r.code,
        );
        expect(a.length - b.length).toBe(2);
        expect(a.filter((c) => !b.includes(c))).toEqual(THESIS_CODES);
        expect(b.filter((c) => THESIS_CODES.includes(c))).toEqual([]);
      },
    );
  });

  describe('subida de los documentos de tesis (RF-19.1 d)', () => {
    async function requirementId(code: string): Promise<number> {
      const [row] = await ds.query(
        `SELECT id FROM public.protocolo_requisitos WHERE protocolo_id = $1 AND codigo_requisito = $2`,
        [thesisId, code],
      );
      return row.id;
    }

    it('un .png en TESIS_ANTIPLAGIO responde 400 y no guarda el documento', async () => {
      const reqId = await requirementId('TESIS_ANTIPLAGIO');
      const res = await api()
        .post(`/api/protocols/${thesisId}/upload-document`)
        .set(auth())
        .send({
          fileName: 'zz-test-antiplagio.png',
          path: `zz-test/${thesisId}/zz-test-antiplagio.png`,
          requirementId: reqId,
        });
      expect(res.status).toBe(400);
      const docs = await ds.query(
        `SELECT id FROM recepcion.documentos WHERE protocolo_id = $1`,
        [thesisId],
      );
      expect(docs).toHaveLength(0);
    });

    it.each(THESIS_CODES)(
      'un PDF en %s responde 201 y deja el requisito PRESENTADO',
      async (code) => {
        const reqId = await requirementId(code);
        const res = await api()
          .post(`/api/protocols/${thesisId}/upload-document`)
          .set(auth())
          .send({
            fileName: `zz-test-${code.toLowerCase()}.pdf`,
            path: `zz-test/${thesisId}/zz-test-${code.toLowerCase()}.pdf`,
            requirementId: reqId,
          });
        expect(res.status).toBe(201);
        const [row] = await ds.query(
          `SELECT estado FROM public.protocolo_requisitos WHERE id = $1`,
          [reqId],
        );
        expect(row.estado).toBe('PRESENTADO');
      },
    );
  });

  describe('verificación de la Secretaría (RF-19.1 a, verificarRequisitos)', () => {
    beforeAll(async () => {
      const password = process.env.E2E_TEST_ACCOUNTS_PASSWORD;
      if (!password) {
        // Sin la contraseña no se intenta el login (evita bloquear la cuenta de prueba).
        throw new Error(
          'ABORT: falta E2E_TEST_ACCOUNTS_PASSWORD (contraseña de secretaria@test.com).',
        );
      }
      const sec = await api()
        .post('/api/auth/login')
        .send({ email: SECRETARIA_EMAIL, password });
      if (sec.status !== 201) {
        throw new Error(
          `Login de la secretaria falló con status ${sec.status}`,
        );
      }
      secretariaToken = sec.body.data?.access_token ?? sec.body.access_token;
    });

    it('con tesis y solo los demás requisitos subidos responde 400 y nombra los 2 documentos de tesis', async () => {
      const others = await ds.query(
        `SELECT id, codigo_requisito FROM public.protocolo_requisitos
          WHERE protocolo_id = $1 AND NOT (codigo_requisito = ANY($2))`,
        [verifyId, THESIS_CODES],
      );
      expect(others.length).toBeGreaterThan(0);
      for (const r of others) {
        const name = `zz-test-${String(r.codigo_requisito).toLowerCase()}.pdf`;
        const up = await api()
          .post(`/api/protocols/${verifyId}/upload-document`)
          .set(auth())
          .send({
            fileName: name,
            path: `zz-test/${verifyId}/${name}`,
            requirementId: r.id,
          });
        expect(up.status).toBe(201);
      }

      const res = await api()
        .patch(`/api/reception/protocol/${verifyId}/verify`)
        .set({ Authorization: `Bearer ${secretariaToken}` })
        .send({ isComplete: true });
      expect(res.status).toBe(400);
      const message = JSON.stringify(res.body);
      for (const name of THESIS_NAMES) expect(message).toContain(name);
    });
  });
});
