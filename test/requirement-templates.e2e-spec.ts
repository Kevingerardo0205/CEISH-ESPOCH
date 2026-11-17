/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.18 — spec-001 RF-18.1 a–d (v3.7.5): requisito → plantilla para «Descargar formato».
 * - Migración 1950000000000: relación de los 8 requisitos y aborto si un código falta o se repite
 *   (las pruebas de aborto corren dentro de una transacción que se revierte).
 * - GET /protocols/checklist/:id: templateCode por fila (solo con plantilla activa y con archivo).
 * - GET /documents/templates/:code/download: { downloadUrl } sin redirección; 404 en español.
 *
 * Guards reales y login real del investigador ZZ_TEST_PLT_ (correo @e2e-tsk-001-18.test,
 * contraseña generada aquí). Plantillas de prueba ZZ_TEST_PLT_*: durante el bloque del checklist,
 * ANEXO_1, ANEXO_2 y ANEXO_4 apuntan a ellas y luego se restauran (su plantilla original es la de
 * su mismo código). Almacenamiento simulado de forma explícita. Limpieza en beforeAll y afterAll.
 * Solo ceish_test_db.
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
import { DataSource, QueryRunner } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { AddTemplateCodeToRequirements1950000000000 } from '../src/migrations/1950000000000-AddTemplateCodeToRequirements';

const PREFIX = 'ZZ_TEST_PLT_';
const EMAIL_DOMAIN = '@e2e-tsk-001-18.test';

/** Relación que deja la migración (spec v3.7.5, RF-18.1 a). */
const EXPECTED_LINKS: Record<string, string> = {
  ANEXO_1: 'ANEXO_1',
  ANEXO_2: 'ANEXO_2',
  ANEXO_4: 'ANEXO_4',
  ANEXO_5: 'ANEXO_5',
  ANEXO_6: 'ANEXO_6',
  CONFIDENCIALIDAD: 'CONFIDENCIALIDAD',
  CONFLICTO_INTERES: 'CONFLICTO_INTERES',
  CONSENTIMIENTO: 'ANEXO_3',
};
const MIGRATION_TEMPLATES = [
  'ANEXO_1',
  'ANEXO_2',
  'ANEXO_3',
  'ANEXO_4',
  'ANEXO_5',
  'ANEXO_6',
  'CONFIDENCIALIDAD',
  'CONFLICTO_INTERES',
];

const TPL_WITH_FILE = `${PREFIX}CON_ARCHIVO`;
const TPL_NO_FILE = `${PREFIX}SIN_ARCHIVO`;
const TPL_INACTIVE = `${PREFIX}INACTIVA`;
const FILE_KEY = 'zz-test/plantillas/con_archivo.docx';
/** Requisito (codigo_anexo) → plantilla de prueba durante el bloque del checklist. */
const REPOINT: Record<string, string> = {
  ANEXO_1: TPL_WITH_FILE,
  ANEXO_2: TPL_NO_FILE,
  ANEXO_4: TPL_INACTIVE,
};

describe('TSK-001.18 — requisito → plantilla (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let token: string;
  let investigadorId: number;
  let studyTypeId: number;
  let protocolId: number;
  const getDownloadUrl = jest.fn((key: string): Promise<string> =>
    Promise.resolve(`https://test.local/signed/${key}`),
  );

  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const data = (res: request.Response): any => res.body?.data ?? res.body;

  async function restoreCatalog(): Promise<void> {
    // La plantilla original de ANEXO_1, ANEXO_2 y ANEXO_4 es la de su mismo código.
    await ds.query(
      `UPDATE catalogos.tipos_documento SET codigo_plantilla = codigo_anexo
        WHERE codigo_plantilla LIKE '${PREFIX}%'`,
    );
  }

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await restoreCatalog();
    await ds.query(
      `DELETE FROM sistema.plantillas_documentos WHERE codigo LIKE '${PREFIX}%'`,
    );
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

  async function links(): Promise<Record<string, string>> {
    const rows: Array<{ codigo_anexo: string; codigo_plantilla: string }> =
      await ds.query(
        `SELECT codigo_anexo, codigo_plantilla FROM catalogos.tipos_documento
          WHERE codigo_plantilla IS NOT NULL ORDER BY codigo_anexo`,
      );
    return Object.fromEntries(
      rows.map((r) => [r.codigo_anexo, r.codigo_plantilla]),
    );
  }

  /** Corre `work` dentro de una transacción que siempre se revierte. */
  async function inRolledBackTransaction(
    work: (qr: QueryRunner) => Promise<void>,
  ): Promise<void> {
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await work(qr);
    } finally {
      await qr.rollbackTransaction();
      await qr.release();
    }
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
        getDownloadUrl,
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

    const [{ count }] = await ds.query(
      `SELECT count(*)::int AS count FROM information_schema.columns
        WHERE table_schema = 'catalogos' AND table_name = 'tipos_documento'
          AND column_name = 'codigo_plantilla'`,
    );
    if (count !== 1) {
      throw new Error(
        'ABORT: falta la migración 1950000000000-AddTemplateCodeToRequirements en ceish_test_db.',
      );
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
       VALUES ('ZZPLT0018', $1, $2, $3, true, true) RETURNING id`,
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

    const title = `${PREFIX}CHECKLIST estudio de prueba de los formatos descargables`;
    const created = await api().post('/api/protocols').set(auth()).send({
      title,
      principalInvestigatorId: investigadorId,
      studyTypeId,
      isAffidavitAccepted: true,
      investigators: [],
      institutions: [],
    });
    if (created.status !== 201) {
      throw new Error(`POST /api/protocols falló con status ${created.status}`);
    }
    const [row] = await ds.query(
      `SELECT id FROM public.protocolos WHERE titulo = $1`,
      [title],
    );
    protocolId = row.id;

    for (const [code, isActive, filePath] of [
      [TPL_WITH_FILE, true, FILE_KEY],
      [TPL_NO_FILE, true, null],
      [TPL_INACTIVE, false, 'zz-test/plantillas/inactiva.docx'],
    ] as Array<[string, boolean, string | null]>) {
      await ds.query(
        `INSERT INTO sistema.plantillas_documentos (codigo, nombre, ruta_archivo, activo)
         VALUES ($1, $2, $3, $4)`,
        [code, `${code} plantilla de prueba`, filePath, isActive],
      );
    }
  }, 60_000);

  afterAll(async () => {
    if (ds) await cleanup();
    if (app) await app.close();
  });

  describe('migración 1950000000000 (RF-18.1 a)', () => {
    it('relaciona los 8 requisitos con su plantilla y deja el resto en NULL', async () => {
      expect(await links()).toEqual(EXPECTED_LINKS);
      const templates: Array<{ codigo: string }> = await ds.query(
        `SELECT codigo FROM sistema.plantillas_documentos WHERE codigo = ANY($1) ORDER BY codigo`,
        [MIGRATION_TEMPLATES],
      );
      expect(templates.map((t) => t.codigo)).toEqual(MIGRATION_TEMPLATES);
    });

    it('up() aborta si un codigo_anexo de la relación no existe', async () => {
      await inRolledBackTransaction(async (qr) => {
        await qr.query(
          `UPDATE catalogos.tipos_documento SET eliminado_en = NOW() WHERE codigo_anexo = 'ANEXO_6'`,
        );
        await expect(
          new AddTemplateCodeToRequirements1950000000000().up(qr),
        ).rejects.toThrow(/codigo_anexo ANEXO_6 aparece 0 veces/);
      });
      expect(await links()).toEqual(EXPECTED_LINKS);
    });

    it('up() aborta si un codigo_anexo de la relación está repetido', async () => {
      await inRolledBackTransaction(async (qr) => {
        await qr.query(
          `INSERT INTO catalogos.tipos_documento (nombre, codigo_anexo, es_obligatorio, es_condicional)
           VALUES ('${PREFIX}duplicado', 'CONFIDENCIALIDAD', true, false)`,
        );
        await expect(
          new AddTemplateCodeToRequirements1950000000000().up(qr),
        ).rejects.toThrow(/codigo_anexo CONFIDENCIALIDAD aparece 2 veces/);
      });
      expect(await links()).toEqual(EXPECTED_LINKS);
    });

    it('down() quita la columna y las plantillas sin archivo; up() las vuelve a crear', async () => {
      await inRolledBackTransaction(async (qr) => {
        const migration = new AddTemplateCodeToRequirements1950000000000();
        await migration.down(qr);
        const [{ count: columns }] = await qr.query(
          `SELECT count(*)::int AS count FROM information_schema.columns
            WHERE table_schema = 'catalogos' AND table_name = 'tipos_documento'
              AND column_name = 'codigo_plantilla'`,
        );
        expect(columns).toBe(0);
        const [{ count: templates }] = await qr.query(
          `SELECT count(*)::int AS count FROM sistema.plantillas_documentos WHERE codigo = ANY($1)`,
          [MIGRATION_TEMPLATES],
        );
        expect(templates).toBe(0);

        await migration.up(qr);
        const rows: Array<{ codigo_anexo: string; codigo_plantilla: string }> =
          await qr.query(
            `SELECT codigo_anexo, codigo_plantilla FROM catalogos.tipos_documento
              WHERE codigo_plantilla IS NOT NULL`,
          );
        expect(
          Object.fromEntries(
            rows.map((r) => [r.codigo_anexo, r.codigo_plantilla]),
          ),
        ).toEqual(EXPECTED_LINKS);
      });
      expect(await links()).toEqual(EXPECTED_LINKS);
    });
  });

  describe('GET /protocols/checklist/:id con templateCode (RF-18.1 b)', () => {
    let rows: any[];

    beforeAll(async () => {
      for (const [requirement, template] of Object.entries(REPOINT)) {
        await ds.query(
          `UPDATE catalogos.tipos_documento SET codigo_plantilla = $2
            WHERE codigo_anexo = $1 AND eliminado_en IS NULL`,
          [requirement, template],
        );
      }
      const res = await api()
        .get(`/api/protocols/checklist/${protocolId}`)
        .set(auth());
      expect(res.status).toBe(200);
      rows = data(res);
    });

    afterAll(async () => {
      await restoreCatalog();
    });

    const byCode = (code: string): any =>
      rows.find((r) => r.requirementCode === code);

    it('cada fila trae templateCode y conserva los campos que usa el frontend', () => {
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row).toHaveProperty('templateCode');
        expect(row).toHaveProperty('requirementCode');
        expect(row).toHaveProperty('requirementName');
        expect(row).toHaveProperty('status');
        expect(row).toHaveProperty('observations');
        expect(row).toHaveProperty('id');
      }
    });

    it('con plantilla activa y con archivo devuelve su código', () => {
      expect(byCode('ANEXO_1').templateCode).toBe(TPL_WITH_FILE);
    });

    it('con plantilla sin archivo devuelve null', () => {
      expect(byCode('ANEXO_2').templateCode).toBeNull();
      // CONSENTIMIENTO → ANEXO_3, creada por la migración sin archivo.
      expect(byCode('CONSENTIMIENTO').templateCode).toBeNull();
    });

    it('con plantilla inactiva devuelve null', () => {
      expect(byCode('ANEXO_4').templateCode).toBeNull();
    });

    it('requisito sin relación con plantilla devuelve null', () => {
      expect(byCode('INSTRUMENTOS').templateCode).toBeNull();
    });

    it('el checklist no trae URL firmada', () => {
      expect(JSON.stringify(rows)).not.toContain('https://');
    });
  });

  describe('GET /documents/templates/:code/download (RF-18.1 c)', () => {
    beforeEach(() => getDownloadUrl.mockClear());

    it('con plantilla activa y con archivo responde 200 con data.downloadUrl, sin redirección', async () => {
      const res = await api()
        .get(`/api/documents/templates/${TPL_WITH_FILE}/download`)
        .set(auth())
        .redirects(0);
      expect(res.status).toBe(200);
      expect(res.headers.location).toBeUndefined();
      expect(data(res)).toEqual({
        downloadUrl: `https://test.local/signed/${FILE_KEY}`,
      });
      expect(getDownloadUrl).toHaveBeenCalledTimes(1);
      expect(getDownloadUrl.mock.calls[0][0]).toBe(FILE_KEY);
    });

    it.each([
      ['sin archivo', TPL_NO_FILE],
      ['inactiva', TPL_INACTIVE],
      ['inexistente', `${PREFIX}NO_EXISTE`],
    ])(
      'plantilla %s responde 404 con mensaje en español',
      async (_label, code) => {
        const res = await api()
          .get(`/api/documents/templates/${code}/download`)
          .set(auth())
          .redirects(0);
        expect(res.status).toBe(404);
        expect(JSON.stringify(res.body)).toContain(
          `Plantilla con código ${code} no encontrada o sin archivo asignado.`,
        );
        expect(getDownloadUrl).not.toHaveBeenCalled();
      },
    );

    it('sin sesión responde 401', async () => {
      const res = await api()
        .get(`/api/documents/templates/${TPL_WITH_FILE}/download`)
        .redirects(0);
      expect(res.status).toBe(401);
    });
  });
});
