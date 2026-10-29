/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */

/**
 * TSK-001.1a — Matriz de roles fija: guards reales
 *
 * Pruebas E2E con JwtAuthGuard, RolesGuard y PermissionsGuard SIN overrideGuard.
 * Crea usuarios temporales (@e2e-frm.test) en beforeAll y los elimina en afterAll.
 * Requiere ceish_test_db con la migración FixedRolesMatrix1880000000000 aplicada.
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
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';
import { FixedRolesMatrix1880000000000 } from '../src/migrations/1880000000000-FixedRolesMatrix';

// ROL IDs en catalogos.roles (ceish_test_db post-migración)
const ROL = {
  INVESTIGADOR: 6,
  SECRETARIA: 7,
  PRESIDENTE: 8,
  EVALUADOR: 9,
} as const;

const RETIRED_PERMS = [
  'PERMISOS_GESTIONAR',
  'SEGUIMIENTO_ENMIENDAS',
  'TRADUCCION_ANCESTRAL',
  'DASHBOARD_SLA',
  'CONFIG_INTEGRACIONES',
];

describe('TSK-001.1a — Matriz roles fija: guards reales (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;

  const EMAIL_SUFFIX = '@e2e-frm.test';
  const PWD = 'E2eFrm_001!';

  interface TU {
    id: number;
    email: string;
    token: string;
    loginBody: any;
  }
  const u: Record<string, TU> = {} as any;

  const emailOf = (k: string) => `e2e_frm_${k}${EMAIL_SUFFIX}`;

  const get = (path: string, token: string) =>
    request(app.getHttpServer())
      .get(`/api${path}`)
      .set('Authorization', `Bearer ${token}`);

  const patch = (path: string, token: string, body: object) =>
    request(app.getHttpServer())
      .patch(`/api${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const clearGuardCache = () => (PermissionsGuard as any).cache.clear();

  // ──────────────────────────────────────────────────────────────────────────
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
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PdfGeneratorService)
      .useValue({
        generateAnnex9Report: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF test')),
        generateCallPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF test')),
      })
      .overrideProvider(DocxGeneratorService)
      .useValue({
        generateAnnex9Docx: jest.fn().mockResolvedValue(Buffer.from('PK test')),
      })
      .overrideProvider('IMeetingPdfGeneratorPort')
      .useValue({
        generateMeetingAnnouncementPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF test')),
        generateAgendaPdf: jest.fn().mockResolvedValue({
          url: '/api/test/pdf',
          buffer: Buffer.from('%PDF test'),
        }),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
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

    // Limpiar residuos de ejecuciones anteriores
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
       (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_SUFFIX}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_SUFFIX}`],
    );

    const hash = await bcrypt.hash(PWD, 10);

    const insertUser = async (key: string, activo = true): Promise<number> => {
      const email = emailOf(key);
      const cedula = `E2EFRM${key.substring(0, 4).toUpperCase()}01`;
      const rows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
        [cedula, `E2E FRM ${key}`, email, hash, activo],
      );
      return rows[0].id;
    };

    const assignRole = async (
      userId: number,
      rolId: number,
      fechaFin?: Date,
    ) => {
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id${fechaFin ? ', fecha_fin' : ''})
         VALUES ($1, $2${fechaFin ? ', $3' : ''})`,
        fechaFin ? [userId, rolId, fechaFin] : [userId, rolId],
      );
    };

    const secId = await insertUser('secretaria');
    await assignRole(secId, ROL.SECRETARIA);

    const presId = await insertUser('presidente');
    await assignRole(presId, ROL.PRESIDENTE);

    const evalId = await insertUser('evaluador');
    await assignRole(evalId, ROL.EVALUADOR);

    const invId = await insertUser('investigador');
    await assignRole(invId, ROL.INVESTIGADOR);

    const revId = await insertUser('revocado');
    await assignRole(revId, ROL.EVALUADOR, new Date(Date.now() - 86_400_000));

    const disId = await insertUser('desactivada', false);

    // Pre-login: activos
    for (const [key, id] of [
      ['secretaria', secId],
      ['presidente', presId],
      ['evaluador', evalId],
      ['investigador', invId],
      ['revocado', revId],
    ] as [string, number][]) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf(key), password: PWD });
      u[key] = {
        id,
        email: emailOf(key),
        token: res.body?.access_token ?? '',
        loginBody: res.body,
      };
    }
    u.desactivada = {
      id: disId,
      email: emailOf('desactivada'),
      token: '',
      loginBody: null,
    };
  }, 60_000);

  afterAll(async () => {
    const ids = Object.values(u)
      .map((x) => x.id)
      .filter(Boolean);
    if (ids.length > 0) {
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = ANY($1::int[])`,
        [ids],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE id = ANY($1::int[])`,
        [ids],
      );
    }
    await app.close();
  });

  beforeEach(() => clearGuardCache());

  // ─── SESIÓN ─────────────────────────────────────────────────────────────────
  describe('SESIÓN: login devuelve roles y permisos vigentes', () => {
    it('SECRETARIA: token contiene exactamente 35 permisos', () => {
      expect(u.secretaria.loginBody?.user?.permissions).toHaveLength(35);
    });

    it('PRESIDENTE: token contiene exactamente 21 permisos', () => {
      expect(u.presidente.loginBody?.user?.permissions).toHaveLength(21);
    });

    it('EVALUADOR: token contiene exactamente 9 permisos', () => {
      expect(u.evaluador.loginBody?.user?.permissions).toHaveLength(9);
    });

    it('INVESTIGADOR: token contiene exactamente 8 permisos', () => {
      expect(u.investigador.loginBody?.user?.permissions).toHaveLength(8);
    });

    it('SECRETARIA: token no incluye ningún permiso retirado', () => {
      const codes: string[] = (
        u.secretaria.loginBody?.user?.permissions ?? []
      ).map((p: any) => p.code as string);
      for (const retired of RETIRED_PERMS) {
        expect(codes).not.toContain(retired);
      }
    });

    it('REVOCADO: login devuelve roles=[] y permissions=[] (fecha_fin expirada)', () => {
      expect(u.revocado.loginBody?.user?.roles).toEqual([]);
      expect(u.revocado.loginBody?.user?.permissions).toEqual([]);
    });
  });

  // ─── DESACTIVADA ────────────────────────────────────────────────────────────
  describe('DESACTIVADA: cuenta inactiva rechaza login', () => {
    it('activo=false → login retorna 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: u.desactivada.email, password: PWD });
      expect(res.status).toBe(401);
    });
  });

  // ─── SECRETARIA ─────────────────────────────────────────────────────────────
  describe('SECRETARIA (35 permisos)', () => {
    it('GET /auth/users → 200 (tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/users', u.secretaria.token);
      expect(res.status).toBe(200);
    });

    it('GET /auth/admin-only → 403 (no tiene rol ADMIN_TI ni PRESIDENTE)', async () => {
      const res = await get('/auth/admin-only', u.secretaria.token);
      expect(res.status).toBe(403);
    });

    it('PATCH /auth/users/:id/roles → no 403 (tiene USUARIOS_GESTIONAR)', async () => {
      const res = await patch(
        `/auth/users/${u.desactivada.id}/roles`,
        u.secretaria.token,
        { roles: [] },
      );
      expect(res.status).not.toBe(403);
    });
  });

  // ─── PRESIDENTE ──────────────────────────────────────────────────────────────
  describe('PRESIDENTE (21 permisos)', () => {
    it('GET /auth/admin-only → 200 (tiene rol PRESIDENTE)', async () => {
      const res = await get('/auth/admin-only', u.presidente.token);
      expect(res.status).toBe(200);
    });

    it('GET /auth/users → 403 (no tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/users', u.presidente.token);
      expect(res.status).toBe(403);
    });

    it('PATCH /auth/users/:id/roles → 403 (no tiene USUARIOS_GESTIONAR)', async () => {
      const res = await patch(
        `/auth/users/${u.desactivada.id}/roles`,
        u.presidente.token,
        { roles: [] },
      );
      expect(res.status).toBe(403);
    });
  });

  // ─── EVALUADOR ───────────────────────────────────────────────────────────────
  describe('EVALUADOR (9 permisos)', () => {
    it('GET /auth/users → 403 (no tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/users', u.evaluador.token);
      expect(res.status).toBe(403);
    });

    it('GET /auth/admin-only → 403 (no tiene PRESIDENTE ni ADMIN_TI)', async () => {
      const res = await get('/auth/admin-only', u.evaluador.token);
      expect(res.status).toBe(403);
    });

    it('GET /auth/investigador-only → 403 (no tiene rol INVESTIGADOR)', async () => {
      const res = await get('/auth/investigador-only', u.evaluador.token);
      expect(res.status).toBe(403);
    });
  });

  // ─── INVESTIGADOR ────────────────────────────────────────────────────────────
  describe('INVESTIGADOR (8 permisos)', () => {
    it('GET /auth/investigador-only → 200 (tiene rol INVESTIGADOR)', async () => {
      const res = await get('/auth/investigador-only', u.investigador.token);
      expect(res.status).toBe(200);
    });

    it('GET /auth/users → 403 (no tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/users', u.investigador.token);
      expect(res.status).toBe(403);
    });

    it('GET /auth/admin-only → 403 (no tiene PRESIDENTE ni ADMIN_TI)', async () => {
      const res = await get('/auth/admin-only', u.investigador.token);
      expect(res.status).toBe(403);
    });
  });

  // ─── REVOCADO ────────────────────────────────────────────────────────────────
  describe('REVOCADO: fecha_fin expirada excluye el rol', () => {
    it('token revocado: GET /auth/investigador-only → 403 (EVALUADOR expirado)', async () => {
      const res = await get('/auth/investigador-only', u.revocado.token);
      expect(res.status).toBe(403);
    });

    it('token revocado: GET /auth/users → 403 (sin ningún permiso vigente)', async () => {
      const res = await get('/auth/users', u.revocado.token);
      expect(res.status).toBe(403);
    });
  });

  // ─── PERMISO RETIRADO ────────────────────────────────────────────────────────
  describe('PERMISO RETIRADO: eliminado_en excluye permisos de la sesión', () => {
    it('GET /auth/me para SECRETARIA no incluye ningún permiso retirado', async () => {
      const res = await get('/auth/me', u.secretaria.token);
      expect(res.status).toBe(200);
      const codes: string[] = (res.body?.permissions ?? []).map(
        (p: any) => p.code as string,
      );
      for (const retired of RETIRED_PERMS) {
        expect(codes).not.toContain(retired);
      }
    });
  });

  // ─── ALIAS ENUM: cobertura de mutaciones ─────────────────────────────────
  describe('ALIAS ENUM: cobertura de mutaciones de alias', () => {
    beforeEach(() => clearGuardCache());

    it('EVALUADOR: GET /evaluations/evaluators/dashboard → 403 (no tiene REPORTES_CARGA)', async () => {
      const res = await get(
        '/evaluations/evaluators/dashboard',
        u.evaluador.token,
      );
      expect(res.status).toBe(403);
    });

    it('SECRETARIA: POST /evaluations/profiles cuerpo inválido → no es 403 (tiene EVALUADORES_PERFILES)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/profiles')
        .set('Authorization', `Bearer ${u.secretaria.token}`)
        .send({});
      expect(res.status).not.toBe(403);
    });
  });

  // ─── REVOCADO-SEC: SECRETARIA expirada no otorga permisos ────────────────
  describe('REVOCADO-SEC: SECRETARIA con fecha_fin expirada excluida de guard y sesión', () => {
    let revSecId = 0;
    let revSecToken = '';
    let revSecLoginBody: any;

    beforeAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional = $1)`,
        [emailOf('revocado_sec')],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE email_institucional = $1`,
        [emailOf('revocado_sec')],
      );
      const hash = await bcrypt.hash(PWD, 10);
      const rows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        ['E2EFRMRS01', 'E2E FRM revocado sec', emailOf('revocado_sec'), hash],
      );
      revSecId = rows[0].id;
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)`,
        [revSecId, ROL.EVALUADOR],
      );
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_fin) VALUES ($1, $2, $3)`,
        [revSecId, ROL.SECRETARIA, new Date(Date.now() - 86_400_000)],
      );
      clearGuardCache();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf('revocado_sec'), password: PWD });
      revSecToken = res.body?.access_token ?? '';
      revSecLoginBody = res.body;
    }, 30_000);

    afterAll(async () => {
      if (revSecId) {
        await ds.query(
          `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
          [revSecId],
        );
        await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
          revSecId,
        ]);
      }
    });

    beforeEach(() => clearGuardCache());

    it('login no incluye SECRETARIA en roles (fecha_fin expirada)', () => {
      const roles: string[] = (revSecLoginBody?.user?.roles ?? []).map(
        (r: any) => r.code as string,
      );
      expect(roles).not.toContain('SECRETARIA');
    });

    it('login no incluye RECEPCION_LISTA en permissions (SECRETARIA expirada)', () => {
      const perms: string[] = (revSecLoginBody?.user?.permissions ?? []).map(
        (p: any) => p.code as string,
      );
      expect(perms).not.toContain('RECEPCION_LISTA');
    });

    it('GET /reception/protocols → 403 (SECRETARIA expirada; EVALUADOR no tiene RECEPCION_LISTA)', async () => {
      const res = await get('/reception/protocols', revSecToken);
      expect(res.status).toBe(403);
    });

    it('GET /auth/admin-only → 403 (no tiene PRESIDENTE ni ADMIN_TI vigente)', async () => {
      const res = await get('/auth/admin-only', revSecToken);
      expect(res.status).toBe(403);
    });
  });

  // ─── ROL INACTIVO ────────────────────────────────────────────────────────
  describe('ROL INACTIVO: activo=false excluye permisos del guard y la sesión', () => {
    let rolInactivoId = 0;
    let userInactivoId = 0;
    let tokenInactivo = '';
    let loginBodyInactivo: any;

    beforeAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id IN
         (SELECT id FROM catalogos.roles WHERE codigo = 'ZZ_TEST_INACTIVO')`,
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional = $1)`,
        [emailOf('zeziactivo')],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE email_institucional = $1`,
        [emailOf('zeziactivo')],
      );
      await ds.query(
        `DELETE FROM catalogos.roles WHERE codigo = 'ZZ_TEST_INACTIVO'`,
      );

      const rolRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.roles (nombre, codigo, activo)
         VALUES ($1, $2, false) RETURNING id`,
        ['ZZ Test Inactivo', 'ZZ_TEST_INACTIVO'],
      );
      rolInactivoId = rolRows[0].id;

      const permRows: Array<{ id: number }> = await ds.query(
        `SELECT id FROM catalogos.permisos WHERE codigo = 'RECEPCION_LISTA' AND eliminado_en IS NULL`,
      );
      await ds.query(
        `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
        [rolInactivoId, permRows[0].id],
      );

      const hash = await bcrypt.hash(PWD, 10);
      const userRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        ['E2EFRMZZ01', 'E2E FRM zeziactivo', emailOf('zeziactivo'), hash],
      );
      userInactivoId = userRows[0].id;
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)`,
        [userInactivoId, rolInactivoId],
      );

      clearGuardCache();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf('zeziactivo'), password: PWD });
      tokenInactivo = res.body?.access_token ?? '';
      loginBodyInactivo = res.body;
    }, 30_000);

    afterAll(async () => {
      if (rolInactivoId) {
        await ds.query(`DELETE FROM catalogos.rol_permisos WHERE rol_id = $1`, [
          rolInactivoId,
        ]);
      }
      if (userInactivoId) {
        await ds.query(
          `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
          [userInactivoId],
        );
        await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
          userInactivoId,
        ]);
      }
      if (rolInactivoId) {
        await ds.query(`DELETE FROM catalogos.roles WHERE id = $1`, [
          rolInactivoId,
        ]);
      }
    });

    beforeEach(() => clearGuardCache());

    it('login no incluye RECEPCION_LISTA (rol con activo=false excluido de sesión)', () => {
      const perms: string[] = (loginBodyInactivo?.user?.permissions ?? []).map(
        (p: any) => p.code as string,
      );
      expect(perms).not.toContain('RECEPCION_LISTA');
    });

    it('GET /reception/protocols → 403 (rol inactivo excluido del guard)', async () => {
      const res = await get('/reception/protocols', tokenInactivo);
      expect(res.status).toBe(403);
    });
  });

  // ─── ROL ELIMINADO ────────────────────────────────────────────────────────
  describe('ROL ELIMINADO: eliminado_en excluye permisos del guard y la sesión', () => {
    let rolEliminadoId = 0;
    let userEliminadoId = 0;
    let tokenEliminado = '';
    let loginBodyEliminado: any;

    beforeAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id IN
         (SELECT id FROM catalogos.roles WHERE codigo = 'ZZ_TEST_ELIMINADO')`,
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional = $1)`,
        [emailOf('zezeliminado')],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE email_institucional = $1`,
        [emailOf('zezeliminado')],
      );
      await ds.query(
        `DELETE FROM catalogos.roles WHERE codigo = 'ZZ_TEST_ELIMINADO'`,
      );

      const rolRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.roles (nombre, codigo, activo, eliminado_en)
         VALUES ($1, $2, true, NOW()) RETURNING id`,
        ['ZZ Test Eliminado', 'ZZ_TEST_ELIMINADO'],
      );
      rolEliminadoId = rolRows[0].id;

      const permRows: Array<{ id: number }> = await ds.query(
        `SELECT id FROM catalogos.permisos WHERE codigo = 'RECEPCION_LISTA' AND eliminado_en IS NULL`,
      );
      await ds.query(
        `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
        [rolEliminadoId, permRows[0].id],
      );

      const hash = await bcrypt.hash(PWD, 10);
      const userRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        ['E2EFRMZE01', 'E2E FRM zezeliminado', emailOf('zezeliminado'), hash],
      );
      userEliminadoId = userRows[0].id;
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)`,
        [userEliminadoId, rolEliminadoId],
      );

      clearGuardCache();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf('zezeliminado'), password: PWD });
      tokenEliminado = res.body?.access_token ?? '';
      loginBodyEliminado = res.body;
    }, 30_000);

    afterAll(async () => {
      if (rolEliminadoId) {
        await ds.query(`DELETE FROM catalogos.rol_permisos WHERE rol_id = $1`, [
          rolEliminadoId,
        ]);
      }
      if (userEliminadoId) {
        await ds.query(
          `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
          [userEliminadoId],
        );
        await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
          userEliminadoId,
        ]);
      }
      if (rolEliminadoId) {
        await ds.query(`DELETE FROM catalogos.roles WHERE id = $1`, [
          rolEliminadoId,
        ]);
      }
    });

    beforeEach(() => clearGuardCache());

    it('login no incluye RECEPCION_LISTA (rol con eliminado_en excluido de sesión)', () => {
      const perms: string[] = (loginBodyEliminado?.user?.permissions ?? []).map(
        (p: any) => p.code as string,
      );
      expect(perms).not.toContain('RECEPCION_LISTA');
    });

    it('GET /reception/protocols → 403 (rol con eliminado_en excluido del guard)', async () => {
      const res = await get('/reception/protocols', tokenEliminado);
      expect(res.status).toBe(403);
    });
  });

  // ─── PERMISO RETIRADO (GUARD) ─────────────────────────────────────────────
  describe('PERMISO RETIRADO guard: eliminado_en excluye del guard y de /auth/me', () => {
    const PERM_ID_PERMISOS_GESTIONAR = 28;
    const ROL_ID_SECRETARIA = 7;

    beforeAll(async () => {
      await ds.query(
        `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [ROL_ID_SECRETARIA, PERM_ID_PERMISOS_GESTIONAR],
      );
    });

    afterAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id = $1 AND permiso_id = $2`,
        [ROL_ID_SECRETARIA, PERM_ID_PERMISOS_GESTIONAR],
      );
    });

    beforeEach(() => clearGuardCache());

    it('GET /auth/me no incluye PERMISOS_GESTIONAR (eliminado_en filtra en sesión)', async () => {
      const res = await get('/auth/me', u.secretaria.token);
      expect(res.status).toBe(200);
      const codes: string[] = (res.body?.permissions ?? []).map(
        (p: any) => p.code as string,
      );
      expect(codes).not.toContain('PERMISOS_GESTIONAR');
    });

    it('GET /auth/roles → 403 (PERMISOS_GESTIONAR en rol_permisos pero eliminado_en lo excluye del guard)', async () => {
      const res = await get('/auth/roles', u.secretaria.token);
      expect(res.status).toBe(403);
    });
  });

  // ─── MIGRACIÓN ────────────────────────────────────────────────────────────
  describe('MIGRACIÓN: up() aborta si falta secretaria@test.com con SECRETARIA vigente', () => {
    it('lanza [TSK-001.1a] ABORT cuando la cuenta de prueba no tiene SECRETARIA vigente', async () => {
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        await qr.query(`
          UPDATE catalogos.usuarios_roles
          SET fecha_fin = NOW() - INTERVAL '1 second'
          WHERE usuario_id = (
            SELECT u.id FROM catalogos.usuarios u
            WHERE u.email_institucional = 'secretaria@test.com' LIMIT 1
          )
          AND rol_id = (
            SELECT r.id FROM catalogos.roles r
            WHERE r.codigo = 'SECRETARIA' LIMIT 1
          )
          AND (fecha_fin IS NULL OR fecha_fin >= NOW())
        `);
        const migration = new FixedRolesMatrix1880000000000();
        await expect(migration.up(qr)).rejects.toThrow('[TSK-001.1a] ABORT');
      } finally {
        await qr.rollbackTransaction();
        await qr.release();
      }
    }, 15_000);
  });

  // ─── MUTACIONES ──────────────────────────────────────────────────────────────
  describe('MUTACIONES: el guard refleja cambios en rol_permisos tras limpiar caché', () => {
    it('M1: al agregar USUARIOS_VER a PRESIDENTE, pasa GET /auth/users; al revertir, vuelve 403', async () => {
      // Obtener ID del permiso USUARIOS_VER
      const rows: Array<{ id: number }> = await ds.query(
        `SELECT id FROM catalogos.permisos WHERE codigo = 'USUARIOS_VER' AND eliminado_en IS NULL`,
      );
      expect(rows).toHaveLength(1);
      const permId = rows[0].id;

      // Insertar USUARIOS_VER en PRESIDENTE
      await ds.query(
        `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [ROL.PRESIDENTE, permId],
      );
      clearGuardCache();

      let res = await get('/auth/users', u.presidente.token);
      expect(res.status).toBe(200); // mutación: ahora tiene acceso

      // Revertir
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id = $1 AND permiso_id = $2`,
        [ROL.PRESIDENTE, permId],
      );
      clearGuardCache();

      res = await get('/auth/users', u.presidente.token);
      expect(res.status).toBe(403); // restaurado: vuelve a denegar
    });

    it('M2: al revocar USUARIOS_VER de SECRETARIA, falla GET /auth/users; al revertir, pasa', async () => {
      const rows: Array<{ id: number }> = await ds.query(
        `SELECT id FROM catalogos.permisos WHERE codigo = 'USUARIOS_VER' AND eliminado_en IS NULL`,
      );
      const permId = rows[0].id;

      // Quitar USUARIOS_VER de SECRETARIA temporalmente
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id = $1 AND permiso_id = $2`,
        [ROL.SECRETARIA, permId],
      );
      clearGuardCache();

      let res = await get('/auth/users', u.secretaria.token);
      expect(res.status).toBe(403); // mutación: ya no tiene USUARIOS_VER

      // Revertir
      await ds.query(
        `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [ROL.SECRETARIA, permId],
      );
      clearGuardCache();

      res = await get('/auth/users', u.secretaria.token);
      expect(res.status).toBe(200); // restaurado: vuelve a permitir
    });
  });
});
