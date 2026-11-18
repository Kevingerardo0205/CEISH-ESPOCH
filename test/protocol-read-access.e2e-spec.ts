/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.26 — spec-001 RF-02.10 a–b (v3.7.7): quién lee GET /protocols/:id.
 * - 200: investigador principal; PROTOCOLOS_LISTAR (SECRETARIA y PRESIDENTE) si no es borrador;
 *   evaluador con asignación en estado 5, 6 o 7 en alguna versión.
 * - 404 «Protocolo no encontrado.»: los demás (incluido quien figura como coinvestigador: la
 *   plataforma no admite coinvestigadores por ahora).
 *
 * Guards reales y login real. Usuarios ZZ_TEST_PREAD_ (correo @e2e-tsk-001-26.test, contraseñas
 * generadas aquí); secretaria@test.com y presidente@test.com con E2E_TEST_ACCOUNTS_PASSWORD.
 * Protocolos creados por la API; las asignaciones de evaluador se insertan para la versión de un
 * protocolo creado aquí. Correo y almacenamiento simulados de forma explícita. Limpieza en
 * beforeAll y afterAll. Solo ceish_test_db.
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
import { IProtocolRepository } from '../src/modules/protocols/domain/ports/protocol.repository.port';
import { ProtocolMapper } from '../src/modules/protocols/application/mappers/protocol.mapper';

const PREFIX = 'ZZ_TEST_PREAD_';
const EMAIL_DOMAIN = '@e2e-tsk-001-26.test';
const NOT_FOUND_MESSAGE = 'Protocolo no encontrado.';

type UserKey =
  | 'owner'
  | 'other'
  | 'coinvestigator'
  | 'eval5'
  | 'eval6'
  | 'eval7'
  | 'eval8'
  | 'evalNone';
const USERS: Array<{ key: UserKey; cedula: string; role: string }> = [
  { key: 'owner', cedula: 'ZZPRD0261', role: 'INVESTIGADOR' },
  { key: 'other', cedula: 'ZZPRD0262', role: 'INVESTIGADOR' },
  { key: 'coinvestigator', cedula: 'ZZPRD0263', role: 'INVESTIGADOR' },
  { key: 'eval5', cedula: 'ZZPRD0265', role: 'EVALUADOR' },
  { key: 'eval6', cedula: 'ZZPRD0266', role: 'EVALUADOR' },
  { key: 'eval7', cedula: 'ZZPRD0267', role: 'EVALUADOR' },
  { key: 'eval8', cedula: 'ZZPRD0268', role: 'EVALUADOR' },
  { key: 'evalNone', cedula: 'ZZPRD0269', role: 'EVALUADOR' },
];
const ASSIGNMENT_STATUS: Partial<Record<UserKey, number>> = {
  eval5: 5,
  eval6: 6,
  eval7: 7,
  eval8: 8,
};

describe('TSK-001.26 — GET /protocols/:id con control de acceso (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let studyTypeId: number;
  let studyTypeName: string;
  /** Nivel de riesgo que la prueba fija en su protocolo enviado (TSK-001.27). */
  let riskLevel: { id: number; code: string; name: string };
  /** Protocolo enviado (recepción en 15): no es borrador. */
  let submittedId: number;
  /** Protocolo en borrador (recepción en 9, versión 1). */
  let draftId: number;
  const ids = {} as Record<UserKey, number>;
  const tokens = {} as Record<UserKey | 'secretaria' | 'presidente', string>;

  const api = () => request(app.getHttpServer());
  const read = (who: keyof typeof tokens, protocolId: number) =>
    api()
      .get(`/api/protocols/${protocolId}`)
      .set('Authorization', `Bearer ${tokens[who]}`);
  const expectNotFound = (res: request.Response, title: string): void => {
    expect(res.status).toBe(404);
    const text = JSON.stringify(res.body);
    expect(text).toContain(NOT_FOUND_MESSAGE);
    expect(text).not.toContain(title);
  };

  async function cleanup(): Promise<void> {
    const users = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%' OR investigador_principal_id IN (${users})`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion
        WHERE evaluador_id IN (${users}) OR version_id IN (${versionIds})`,
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

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    if (res.status !== 201) {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return res.body.data?.access_token ?? res.body.access_token;
  }

  async function createProtocol(
    title: string,
    investigators: object[] = [],
  ): Promise<number> {
    const res = await api()
      .post('/api/protocols')
      .set('Authorization', `Bearer ${tokens.owner}`)
      .send({
        title: `${PREFIX}${title}`,
        studyTypeId,
        isAffidavitAccepted: true,
        investigators,
        institutions: [],
      });
    if (res.status !== 201) {
      throw new Error(`POST /api/protocols falló con status ${res.status}`);
    }
    const [row] = await ds.query(
      `SELECT id FROM public.protocolos WHERE titulo = $1`,
      [`${PREFIX}${title}`],
    );
    return row.id;
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
      `SELECT id, nombre FROM catalogos.tipos_estudio WHERE codigo = 'IO'`,
    );
    studyTypeId = st.id;
    studyTypeName = st.nombre;
    const [rl] = await ds.query(
      `SELECT id, codigo AS code, nombre AS name FROM catalogos.niveles_riesgo
        WHERE activo ORDER BY id LIMIT 1`,
    );
    riskLevel = rl;

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
      tokens[key] = await login(email, generated);
    }
    tokens.secretaria = await login('secretaria@test.com', password);
    tokens.presidente = await login('presidente@test.com', password);

    // Protocolo enviado, con un coinvestigador registrado por la API (usuario_id del coinvestigador).
    submittedId = await createProtocol(
      'ENVIADO estudio de prueba del control de acceso',
      [
        {
          fullName: `${PREFIX}Coinvestigador`,
          identification: 'ZZPRD0263',
          position: 'Docente',
          institution: 'ZZ_TEST institución',
          email: `coinvestigator${EMAIL_DOMAIN}`,
          phone: '0000000000',
          education: 'Maestría',
          role: 'CO_INVESTIGADOR',
          userId: ids.coinvestigator,
        },
      ],
    );
    const submit = await api()
      .post(`/api/protocols/${submittedId}/submit`)
      .set('Authorization', `Bearer ${tokens.owner}`);
    if (submit.status !== 201) {
      throw new Error(`submit falló con status ${submit.status}`);
    }
    draftId = await createProtocol('BORRADOR estudio de prueba del control');
    // TSK-001.27: nivel de riesgo fijado solo en el protocolo enviado (creado por esta prueba).
    await ds.query(
      `UPDATE public.protocolos SET nivel_riesgo_id = $1 WHERE id = $2`,
      [riskLevel.id, submittedId],
    );

    const [{ version_actual_id: versionId }] = await ds.query(
      `SELECT version_actual_id FROM public.protocolos WHERE id = $1`,
      [submittedId],
    );
    for (const [key, statusId] of Object.entries(ASSIGNMENT_STATUS)) {
      await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ($1, $2, $3)`,
        [versionId, ids[key as UserKey], statusId],
      );
    }
  });

  afterAll(async () => {
    if (ds) await cleanup();
    if (app) await app.close();
  });

  const SUBMITTED_TITLE = `${PREFIX}ENVIADO estudio de prueba del control de acceso`;
  const DRAFT_TITLE = `${PREFIX}BORRADOR estudio de prueba del control`;

  it('datos de prueba: el protocolo enviado tiene la recepción en 15 y el borrador en 9 con versión 1', async () => {
    const rows: any[] = await ds.query(
      `SELECT p.id, r.estado_id, v.numero_version
         FROM public.protocolos p
         JOIN public.versiones_protocolo v ON v.id = p.version_actual_id
         JOIN recepcion.recepciones r ON r.version_id = v.id
        WHERE p.id = ANY($1) ORDER BY p.id`,
      [[submittedId, draftId]],
    );
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[submittedId].estado_id).toBe(15);
    expect(byId[draftId].estado_id).toBe(9);
    expect(byId[draftId].numero_version).toBe(1);
    const coinv: any[] = await ds.query(
      `SELECT usuario_id FROM public.protocolo_investigadores
        WHERE protocolo_id = $1 AND rol = 'CO_INVESTIGADOR'`,
      [submittedId],
    );
    expect(coinv.map((r) => r.usuario_id)).toEqual([ids.coinvestigator]);
  });

  describe('responden 200 (RF-02.10 a)', () => {
    it.each([
      ['el investigador principal (protocolo enviado)', 'owner', 'submitted'],
      ['el investigador principal (su borrador)', 'owner', 'draft'],
      ['la SECRETARIA (PROTOCOLOS_LISTAR)', 'secretaria', 'submitted'],
      ['el PRESIDENTE (PROTOCOLOS_LISTAR)', 'presidente', 'submitted'],
      ['un evaluador con asignación en estado 5', 'eval5', 'submitted'],
      ['un evaluador con asignación en estado 6', 'eval6', 'submitted'],
      ['un evaluador con asignación en estado 7', 'eval7', 'submitted'],
    ] as Array<[string, keyof typeof tokens, 'submitted' | 'draft']>)(
      '%s',
      async (_label, who, which) => {
        const protocolId = which === 'draft' ? draftId : submittedId;
        const res = await read(who, protocolId);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(protocolId);
        expect(res.body.data.title).toBe(
          which === 'draft' ? DRAFT_TITLE : SUBMITTED_TITLE,
        );
      },
    );
  });

  describe('responden 404 «Protocolo no encontrado.» sin datos (RF-02.10 b)', () => {
    it.each([
      ['un investigador ajeno', 'other', 'submitted'],
      [
        'un usuario que figura como coinvestigador',
        'coinvestigator',
        'submitted',
      ],
      ['un evaluador sin asignación', 'evalNone', 'submitted'],
      ['un evaluador con asignación en estado 8', 'eval8', 'submitted'],
      ['la SECRETARIA con un borrador', 'secretaria', 'draft'],
      ['el PRESIDENTE con un borrador', 'presidente', 'draft'],
      [
        'un evaluador asignado al otro protocolo con el borrador',
        'eval6',
        'draft',
      ],
    ] as Array<[string, keyof typeof tokens, 'submitted' | 'draft']>)(
      '%s',
      async (_label, who, which) => {
        const protocolId = which === 'draft' ? draftId : submittedId;
        const res = await read(who, protocolId);
        expectNotFound(res, which === 'draft' ? DRAFT_TITLE : SUBMITTED_TITLE);
      },
    );

    it('un protocolo que no existe también responde 404 con el mismo mensaje', async () => {
      const [{ max }] = await ds.query(
        'SELECT COALESCE(MAX(id), 0) + 1000 AS max FROM public.protocolos',
      );
      const res = await read('secretaria', Number(max));
      expectNotFound(res, SUBMITTED_TITLE);
    });
  });

  it('sin token responde 401', async () => {
    const res = await api().get(`/api/protocols/${submittedId}`);
    expect(res.status).toBe(401);
  });

  /**
   * TSK-001.27 — spec-001 RF-EST.2 (v3.7.8): encabezado del protocolo en GET /protocols/:id.
   * Campos nuevos para el investigador, la SECRETARIA y el evaluador asignado; las claves de la
   * respuesta anterior (findById + toResponse, que siguen en el código) siguen con el mismo valor.
   */
  describe('encabezado del protocolo (TSK-001.27, RF-EST.2)', () => {
    /** Respuesta anterior: findById + ProtocolMapper.toResponse, serializada como JSON. */
    async function previousResponse(protocolId: number): Promise<any> {
      const repo = app.get(IProtocolRepository);
      const orm = await repo.findById(protocolId);
      return JSON.parse(JSON.stringify(ProtocolMapper.toResponse(orm!)));
    }
    const typeOf = (v: unknown): string =>
      v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;

    it.each([
      ['el investigador principal', 'owner'],
      ['la SECRETARIA', 'secretaria'],
      ['el evaluador asignado (estado 5)', 'eval5'],
    ] as Array<[string, keyof typeof tokens]>)(
      '%s recibe etapa, investigador principal, tipo de estudio y nivel de riesgo',
      async (_label, who) => {
        const res = await read(who, submittedId);
        expect(res.status).toBe(200);
        const data = res.body.data;
        expect(data.etapa).toBe('RECEPCION');
        expect(data.etapaOrden).toBe(1);
        expect(data.principalInvestigator).toEqual({
          id: ids.owner,
          fullName: `${PREFIX}owner`,
        });
        expect(data.studyType).toBe(studyTypeName);
        expect(data.studyTypeCode).toBe('IO');
        expect(data.riskLevel).toBe(riskLevel.name);
        expect(data.riskLevelCode).toBe(riskLevel.code);
        expect(data).toHaveProperty('ceishCode', null);
      },
    );

    it('el borrador: etapa RECEPCION 1 y nivel de riesgo null', async () => {
      const res = await read('owner', draftId);
      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.etapa).toBe('RECEPCION');
      expect(data.etapaOrden).toBe(1);
      expect(data.principalInvestigator).toEqual({
        id: ids.owner,
        fullName: `${PREFIX}owner`,
      });
      expect(data).toHaveProperty('riskLevel', null);
      expect(data).toHaveProperty('riskLevelCode', null);
      expect(data).toHaveProperty('ceishCode', null);
    });

    it.each([
      ['enviado', 'submitted'],
      ['borrador', 'draft'],
    ] as Array<[string, 'submitted' | 'draft']>)(
      'protocolo %s: todas las claves de la respuesta anterior siguen, con el mismo tipo y valor',
      async (_label, which) => {
        const protocolId = which === 'draft' ? draftId : submittedId;
        const before = await previousResponse(protocolId);
        const res = await read('owner', protocolId);
        expect(res.status).toBe(200);
        const data = res.body.data;
        const keys = Object.keys(before);
        expect(keys.length).toBeGreaterThan(20);
        for (const key of keys) {
          expect([key, typeOf(data[key])]).toEqual([key, typeOf(before[key])]);
          expect([key, data[key]]).toEqual([key, before[key]]);
        }
      },
    );

    it('no devuelve cédulas, correos ni teléfonos', async () => {
      const res = await read('secretaria', submittedId);
      expect(res.status).toBe(200);
      const text = JSON.stringify(res.body.data);
      for (const leaked of [
        'ZZPRD0261', // cédula del investigador principal
        'ZZPRD0263', // cédula del coinvestigador
        `owner${EMAIL_DOMAIN}`,
        `coinvestigator${EMAIL_DOMAIN}`,
        '0000000000', // teléfono del coinvestigador
      ]) {
        expect(text).not.toContain(leaked);
      }
      expect(res.body.data).not.toHaveProperty('investigators');
      expect(res.body.data).not.toHaveProperty('institutions');
    });
  });
});
