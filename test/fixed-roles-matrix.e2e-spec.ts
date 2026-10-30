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
import { JwtService } from '@nestjs/jwt';
import { FixedRolesMatrix1880000000000 } from '../src/migrations/1880000000000-FixedRolesMatrix';
import { UsersService } from '../src/modules/auth/application/services/users.service';

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
  let usersService: UsersService;
  let insertUser: (key: string, activo?: boolean) => Promise<number>;
  let assignRole: (
    userId: number,
    rolId: number,
    fechaFin?: Date,
  ) => Promise<void>;

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
    usersService = app.get(UsersService);

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
    // Limpiar roles ZZ_TEST_% residuales (sin usuarios asignados)
    await ds.query(
      `DELETE FROM catalogos.rol_permisos WHERE rol_id IN
       (SELECT id FROM catalogos.roles WHERE codigo LIKE 'ZZ_TEST_%')`,
    );
    await ds.query(
      `DELETE FROM catalogos.roles WHERE codigo LIKE 'ZZ_TEST_%'
       AND NOT EXISTS (SELECT 1 FROM catalogos.usuarios_roles ur WHERE ur.rol_id = catalogos.roles.id)`,
    );

    const hash = await bcrypt.hash(PWD, 10);

    let userSeq = 100;
    insertUser = async (key: string, activo = true): Promise<number> => {
      userSeq++;
      const email = emailOf(key);
      const cedula = `E2E${userSeq.toString().padStart(7, '0')}`;
      const rows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
        [cedula, `E2E FRM ${key}`, email, hash, activo],
      );
      return rows[0].id;
    };

    assignRole = async (userId: number, rolId: number, fechaFin?: Date) => {
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
    // Limpieza global: elimina TODOS los usuarios de prueba (incluidos los creados ad-hoc en describe blocks)
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
       (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_SUFFIX}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_SUFFIX}`],
    );
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

    it('GET /auth/admin-only → 403 (no tiene rol PRESIDENTE)', async () => {
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

    it('GET /auth/admin-only → 403 (no tiene rol PRESIDENTE)', async () => {
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

    it('GET /auth/admin-only → 403 (no tiene rol PRESIDENTE)', async () => {
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

    it('GET /auth/admin-only → 403 (no tiene rol PRESIDENTE vigente)', async () => {
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

    // TSK-001.1c: GET /auth/roles ahora usa @Permissions(USUARIOS_VER), no PERMISOS_GESTIONAR.
    // SECRETARIA tiene USUARIOS_VER activo → recibe 200 aunque PERMISOS_GESTIONAR esté retirado.
    it('GET /auth/roles → 200 (TSK-001.1c: usa USUARIOS_VER; PERMISOS_GESTIONAR retirado no afecta)', async () => {
      const res = await get('/auth/roles', u.secretaria.token);
      expect(res.status).toBe(200);
    });
  });

  // ─── ROL INACTIVO con @Roles (TSK-001.1a.1) ───────────────────────────────
  describe('ROL INACTIVO con @Roles: ZZ_TEST_INACTIVO_R excluido de roles y temporalRoles activos', () => {
    const ROLE_CODE = 'ZZ_TEST_INACTIVO_R';
    const USER_KEY = 'inactivo_roles';
    let rolId = 0;
    let userId = 0;
    let decodedToken: any;

    beforeAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE rol_id IN
         (SELECT id FROM catalogos.roles WHERE codigo = $1)`,
        [ROLE_CODE],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional = $1)`,
        [emailOf(USER_KEY)],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE email_institucional = $1`,
        [emailOf(USER_KEY)],
      );
      await ds.query(`DELETE FROM catalogos.roles WHERE codigo = $1`, [
        ROLE_CODE,
      ]);

      const rolRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.roles (nombre, codigo, activo)
         VALUES ($1, $2, false) RETURNING id`,
        ['ZZ Test Inactivo Roles', ROLE_CODE],
      );
      rolId = rolRows[0].id;

      const hash = await bcrypt.hash(PWD, 10);
      const userRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        ['E2EFRMZZR1', 'E2E FRM Inactivo Roles', emailOf(USER_KEY), hash],
      );
      userId = userRows[0].id;

      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_inicio, fecha_fin)
         VALUES ($1, $2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days')`,
        [userId, rolId],
      );

      clearGuardCache();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf(USER_KEY), password: PWD });

      const token = res.body?.access_token ?? '';
      const jwtService = app.get(JwtService);
      decodedToken = jwtService.decode(token);
    }, 30_000);

    afterAll(async () => {
      if (userId) {
        await ds.query(
          `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
          [userId],
        );
        await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
          userId,
        ]);
      }
      if (rolId) {
        await ds.query(`DELETE FROM catalogos.roles WHERE id = $1`, [rolId]);
      }
    });

    beforeEach(() => clearGuardCache());

    it('el token decodificado no debe contener el código en roles ni en temporalRoles con isExpired = false', () => {
      const roles: string[] = decodedToken?.roles ?? [];
      expect(roles).not.toContain(ROLE_CODE);

      const temporalRoles: Array<{ code: string; isExpired: boolean }> =
        decodedToken?.temporalRoles ?? [];
      const activeTempRoles = temporalRoles.filter(
        (tr) => tr.code === ROLE_CODE && tr.isExpired === false,
      );
      expect(activeTempRoles).toHaveLength(0);
    });
  });

  // ─── ROL PROGRAMADO (TSK-001.1a.1) ────────────────────────────────────────
  describe('ROL PROGRAMADO: EVALUADOR vigente y SECRETARIA con fecha_inicio = mañana', () => {
    const USER_KEY = 'programado';
    let userId = 0;
    let token = '';
    let decodedToken: any;

    beforeAll(async () => {
      await ds.query(
        `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional = $1)`,
        [emailOf(USER_KEY)],
      );
      await ds.query(
        `DELETE FROM catalogos.usuarios WHERE email_institucional = $1`,
        [emailOf(USER_KEY)],
      );

      const hash = await bcrypt.hash(PWD, 10);
      const userRows: Array<{ id: number }> = await ds.query(
        `INSERT INTO catalogos.usuarios
           (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
         VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
        ['E2EFRMPROG1', 'E2E FRM Programado', emailOf(USER_KEY), hash],
      );
      userId = userRows[0].id;

      // 1. EVALUADOR vigente
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_inicio, fecha_fin)
         VALUES ($1, $2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days')`,
        [userId, ROL.EVALUADOR],
      );

      // 2. SECRETARIA con fecha_inicio = mañana
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_inicio, fecha_fin)
         VALUES ($1, $2, NOW() + INTERVAL '1 day', NOW() + INTERVAL '30 days')`,
        [userId, ROL.SECRETARIA],
      );

      clearGuardCache();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: emailOf(USER_KEY), password: PWD });

      token = res.body?.access_token ?? '';
      const jwtService = app.get(JwtService);
      decodedToken = jwtService.decode(token);
    }, 30_000);

    afterAll(async () => {
      if (userId) {
        await ds.query(
          `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
          [userId],
        );
        await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
          userId,
        ]);
      }
    });

    beforeEach(() => clearGuardCache());

    it('SECRETARIA no aparece en roles', () => {
      const roles: string[] = decodedToken?.roles ?? [];
      expect(roles).not.toContain('SECRETARIA');
      expect(roles).toContain('EVALUADOR');
    });

    it('en temporalRoles aparece con isExpired = true', () => {
      const temporalRoles: Array<{ code: string; isExpired: boolean }> =
        decodedToken?.temporalRoles ?? [];
      const sec = temporalRoles.find((tr) => tr.code === 'SECRETARIA');
      expect(sec).toBeDefined();
      expect(sec?.isExpired).toBe(true);
    });

    it('un GET de meetings con @Roles(SECRETARIA, …) sin EVALUADOR → 403', async () => {
      const res = await get('/evaluations/meetings/pending-protocols', token);
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

    it('down() del rol 43: dentro de transacción con ROLLBACK, 43 queda con activo=false y eliminado_en=NULL, y ADMIN_TI con activo=true', async () => {
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      try {
        const migration = new FixedRolesMatrix1880000000000();
        await migration.down(qr);

        const roles: Array<{
          codigo: string;
          activo: boolean;
          eliminado_en: Date | null;
        }> = await qr.query(`
          SELECT codigo, activo, eliminado_en
          FROM catalogos.roles
          WHERE codigo IN ('43', 'ADMIN_TI')
        `);

        const rol43 = roles.find((r) => r.codigo === '43');
        const adminTi = roles.find((r) => r.codigo === 'ADMIN_TI');

        expect(rol43).toBeDefined();
        expect(rol43?.activo).toBe(false);
        expect(rol43?.eliminado_en).toBeNull();

        expect(adminTi).toBeDefined();
        expect(adminTi?.activo).toBe(true);
        expect(adminTi?.eliminado_en).toBeNull();
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

  // ─── TSK-001.1b: SEGREGACIÓN Y SECRETARÍA ÚNICA ──────────────────────────────
  describe('TSK-001.1b — Segregación de funciones y secretaría única (HU-001 b y b2)', () => {
    describe('updateUserRoles', () => {
      it('rechaza [INVESTIGADOR, EVALUADOR] en el mismo conjunto con 400', async () => {
        const testUserId = await insertUser('sod_comb');
        const res = await patch(
          `/auth/users/${testUserId}/roles`,
          u.secretaria.token,
          {
            roles: ['INVESTIGADOR', 'EVALUADOR'],
          },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toContain(
          'Violación de Segregación de Funciones: El rol INVESTIGADOR es incompatible con los roles del comité (EVALUADOR).',
        );
      });

      it('rechaza cambio de INVESTIGADOR a EVALUADOR si es co-investigador de protocolo en curso (con cantidad en mensaje)', async () => {
        const invId = await insertUser('inv_co_proto');
        await assignRole(invId, ROL.INVESTIGADOR);

        const pRows: Array<{ id: number }> = await ds.query(
          `INSERT INTO public.protocolos (titulo, investigador_principal_id, estado_id)
           VALUES ('PROTO TEST COINV SOD', $1, 13) RETURNING id`,
          [u.investigador.id],
        );
        const protoId = pRows[0].id;

        const piRows: Array<{ id: number }> = await ds.query(
          `INSERT INTO public.protocolo_investigadores
           (nombre_completo, identificacion, cargo, institucion, email, telefono, formacion_academica, rol, protocolo_id, usuario_id)
           VALUES ('CoInv Test', '0601234560', 'Docente', 'ESPOCH', 'coinv_sod@test.com', '0999999999', 'PhD', 'CO_INVESTIGADOR', $1, $2)
           RETURNING id`,
          [protoId, invId],
        );
        const piId = piRows[0].id;

        try {
          const res = await patch(
            `/auth/users/${invId}/roles`,
            u.secretaria.token,
            {
              roles: ['EVALUADOR'],
            },
          );
          expect(res.status).toBe(400);
          expect(res.body.message).toBe(
            'No se puede cambiar el rol de INVESTIGADOR a miembro del comité porque tiene 1 protocolo(s) en curso.',
          );
        } finally {
          await ds.query(
            `DELETE FROM public.protocolo_investigadores WHERE id = $1`,
            [piId],
          );
          await ds.query(`DELETE FROM public.protocolos WHERE id = $1`, [
            protoId,
          ]);
        }
      });

      it('permite cambio de INVESTIGADOR a EVALUADOR si no tiene protocolos en curso (o solo RECHAZADO)', async () => {
        const invId = await insertUser('inv_rech_proto');
        await assignRole(invId, ROL.INVESTIGADOR);

        const pRows: Array<{ id: number }> = await ds.query(
          `INSERT INTO public.protocolos (titulo, investigador_principal_id, estado_id)
           VALUES ('PROTO RECHAZADO TEST SOD', $1, 18) RETURNING id`,
          [invId],
        );
        const protoId = pRows[0].id;

        try {
          const res = await patch(
            `/auth/users/${invId}/roles`,
            u.secretaria.token,
            {
              roles: ['EVALUADOR'],
            },
          );
          expect(res.status).toBe(200);

          const rolesInDb: Array<{
            rol_id: number;
            fecha_fin: Date | null;
            motivo: string;
          }> = await ds.query(
            `SELECT rol_id, fecha_fin, motivo_delegacion as motivo FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
            [invId],
          );
          const invRole = rolesInDb.find((r) => r.rol_id === ROL.INVESTIGADOR);
          const evalRole = rolesInDb.find((r) => r.rol_id === ROL.EVALUADOR);

          expect(invRole).toBeDefined();
          expect(invRole?.fecha_fin).not.toBeNull();
          expect(invRole?.motivo).toContain('[REVOCADO]');
          expect(evalRole).toBeDefined();
          expect(evalRole?.fecha_fin).toBeNull();
        } finally {
          await ds.query(`DELETE FROM public.protocolos WHERE id = $1`, [
            protoId,
          ]);
        }
      });

      it('rechaza cambio inverso de EVALUADOR a INVESTIGADOR con 400', async () => {
        const evalId = await insertUser('eval_to_inv');
        await assignRole(evalId, ROL.EVALUADOR);

        const res = await patch(
          `/auth/users/${evalId}/roles`,
          u.secretaria.token,
          {
            roles: ['INVESTIGADOR'],
          },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Violación de Segregación de Funciones: No se puede asignar el rol INVESTIGADOR a un usuario con rol del comité vigente.',
        );
      });

      it('permite combinar roles del comité entre sí (EVALUADOR + PRESIDENTE)', async () => {
        const userComiteId = await insertUser('comite_multi');
        const res = await patch(
          `/auth/users/${userComiteId}/roles`,
          u.secretaria.token,
          {
            roles: ['EVALUADOR', 'PRESIDENTE'],
          },
        );
        expect(res.status).toBe(200);
      });

      it('rechaza asignar SECRETARIA a un segundo usuario si ya existe titular', async () => {
        const secondUserId = await insertUser('sec_segundo');
        const res = await patch(
          `/auth/users/${secondUserId}/roles`,
          u.secretaria.token,
          {
            roles: ['SECRETARIA'],
          },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Solo puede existir una titular con el rol SECRETARIA vigente en el sistema.',
        );
      });

      it('permite reasignar SECRETARIA a la misma titular', async () => {
        // Suspendemos temporalmente la cuenta pre-sembrada (id: 30) para que u.secretaria sea la única titular
        await ds.query(
          `UPDATE catalogos.usuarios_roles SET fecha_fin = NOW() - INTERVAL '1 minute' WHERE usuario_id = 30 AND rol_id = $1`,
          [ROL.SECRETARIA],
        );

        try {
          const res = await patch(
            `/auth/users/${u.secretaria.id}/roles`,
            u.secretaria.token,
            {
              roles: ['SECRETARIA'],
            },
          );
          expect(res.status).toBe(200);
        } finally {
          await ds.query(
            `UPDATE catalogos.usuarios_roles SET fecha_fin = NULL WHERE usuario_id = 30 AND rol_id = $1`,
            [ROL.SECRETARIA],
          );
        }
      });
    });

    describe('createUser', () => {
      it('rechaza roles [INVESTIGADOR, EVALUADOR] y no incrementa el conteo de usuarios', async () => {
        const countBefore = await ds.query(
          `SELECT count(*)::int as c FROM catalogos.usuarios`,
        );
        const res = await request(app.getHttpServer())
          .post('/api/auth/users')
          .set('Authorization', `Bearer ${u.secretaria.token}`)
          .send({
            nationalId: '0601234571',
            fullName: 'Usuario Creacion Fallida SoD',
            email: emailOf('cr_fail_sod'),
            roles: ['INVESTIGADOR', 'EVALUADOR'],
          });
        expect(res.status).toBe(400);
        const countAfter = await ds.query(
          `SELECT count(*)::int as c FROM catalogos.usuarios`,
        );
        expect(countAfter[0].c).toBe(countBefore[0].c);
      });

      it('rechaza rol SECRETARIA si ya existe titular y no incrementa el conteo de usuarios', async () => {
        const countBefore = await ds.query(
          `SELECT count(*)::int as c FROM catalogos.usuarios`,
        );
        const res = await request(app.getHttpServer())
          .post('/api/auth/users')
          .set('Authorization', `Bearer ${u.secretaria.token}`)
          .send({
            nationalId: '0601234572',
            fullName: 'Usuario Creacion Fallida Sec',
            email: emailOf('cr_fail_sec'),
            roles: ['SECRETARIA'],
          });
        expect(res.status).toBe(400);
        const countAfter = await ds.query(
          `SELECT count(*)::int as c FROM catalogos.usuarios`,
        );
        expect(countAfter[0].c).toBe(countBefore[0].c);
      });
    });

    describe('updateUser', () => {
      it('rechaza roles incompatibles o segunda SECRETARIA en PATCH /auth/users/:id', async () => {
        const testUserId = await insertUser('upd_usr_sod');
        await assignRole(testUserId, ROL.EVALUADOR);

        const resSod = await patch(
          `/auth/users/${testUserId}`,
          u.secretaria.token,
          {
            roles: ['INVESTIGADOR'],
          },
        );
        expect(resSod.status).toBe(400);

        const resSec = await patch(
          `/auth/users/${testUserId}`,
          u.secretaria.token,
          {
            roles: ['SECRETARIA'],
          },
        );
        expect(resSec.status).toBe(400);
      });
    });

    describe('extendTemporaryRole', () => {
      it('rechaza extender SECRETARIA vencida a otro usuario si ya hay titular', async () => {
        const secOldId = await insertUser('sec_old_ext');
        await assignRole(
          secOldId,
          ROL.SECRETARIA,
          new Date(Date.now() - 3_600_000),
        );

        const res = await patch(
          `/auth/users/${secOldId}/roles/SECRETARIA/extend`,
          u.secretaria.token,
          {
            validUntil: new Date(Date.now() + 86_400_000).toISOString(),
            reason: 'Intento de suplencia duplicada',
          },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Solo puede existir una titular con el rol SECRETARIA vigente en el sistema.',
        );
      });

      it('rechaza extender EVALUADOR vencido si el usuario tiene INVESTIGADOR activo', async () => {
        const invEvalId = await insertUser('inv_eval_ext');
        await assignRole(invEvalId, ROL.INVESTIGADOR);
        await assignRole(
          invEvalId,
          ROL.EVALUADOR,
          new Date(Date.now() - 3_600_000),
        );

        const res = await patch(
          `/auth/users/${invEvalId}/roles/EVALUADOR/extend`,
          u.secretaria.token,
          {
            validUntil: new Date(Date.now() + 86_400_000).toISOString(),
            reason: 'Intento extender evaluador con investigador activo',
          },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toContain(
          'Violación de Segregación de Funciones: No se puede extender un rol del comité a un usuario que tiene el rol INVESTIGADOR activo.',
        );
      });
    });

    describe('register', () => {
      it('rechaza registro con cédula ya registrada (400) y con correo ya registrado (400)', async () => {
        const invRow: Array<{ cedula: string }> = await ds.query(
          `SELECT cedula FROM catalogos.usuarios WHERE id = $1`,
          [u.investigador.id],
        );
        const invCedula = invRow[0].cedula;

        const resCed = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            documentType: 'CEDULA',
            nationalId: invCedula,
            firstName: 'Prueba',
            firstLastName: 'CedulaDup',
            email: emailOf('reg_ced_dup'),
            password: 'Password123!',
            nationality: 'ECUATORIANA',
            phone: '0999999999',
            acceptsTerms: true,
            acceptsRegulations: true,
          });
        expect(resCed.status).toBe(400);
        expect(resCed.body.message).toBe('Esta cédula ya está registrada');

        const resEmail = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            documentType: 'CEDULA',
            nationalId: '0609998881',
            firstName: 'Prueba',
            firstLastName: 'EmailDup',
            email: u.investigador.email,
            password: 'Password123!',
            nationality: 'ECUATORIANA',
            phone: '0999999999',
            acceptsTerms: true,
            acceptsRegulations: true,
          });
        expect(resEmail.status).toBe(400);
        expect(resEmail.body.message).toContain(
          'Este correo electrónico ya está registrado',
        );
      });
    });

    describe('Concurrencia UsersService', () => {
      it('exactamente 1 pasa y 1 falla al asignar SECRETARIA en paralelo (3 iteraciones)', async () => {
        const userAId = await insertUser('conc_a');
        const userBId = await insertUser('conc_b');

        const activeSecs: Array<{
          usuario_id: number;
          fecha_inicio: Date;
          fecha_fin: Date | null;
        }> = await ds.query(
          `SELECT usuario_id, fecha_inicio, fecha_fin FROM catalogos.usuarios_roles WHERE rol_id = $1 AND (fecha_fin IS NULL OR fecha_fin >= NOW())`,
          [ROL.SECRETARIA],
        );

        try {
          await ds.query(
            `UPDATE catalogos.usuarios_roles SET fecha_fin = NOW() - INTERVAL '1 minute' WHERE rol_id = $1 AND (fecha_fin IS NULL OR fecha_fin >= NOW())`,
            [ROL.SECRETARIA],
          );

          for (let i = 0; i < 3; i++) {
            await ds.query(
              `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN ($1, $2)`,
              [userAId, userBId],
            );

            const results = await Promise.allSettled([
              usersService.updateUserRoles(userAId, ['SECRETARIA']),
              usersService.updateUserRoles(userBId, ['SECRETARIA']),
            ]);

            const fulfilled = results.filter((r) => r.status === 'fulfilled');
            const rejected = results.filter((r) => r.status === 'rejected');

            expect(fulfilled).toHaveLength(1);
            expect(rejected).toHaveLength(1);
          }
        } finally {
          for (const sec of activeSecs) {
            await ds.query(
              `UPDATE catalogos.usuarios_roles SET fecha_fin = $1 WHERE usuario_id = $2 AND rol_id = $3`,
              [sec.fecha_fin, sec.usuario_id, ROL.SECRETARIA],
            );
          }
        }
      }, 30_000);
    });
  });

  // ─── TSK-001.1c: RETIRO DE ROLES/PERMISSIONS CONTROLLERS + LIMPIEZA ADMIN_TI ─
  describe('TSK-001.1c — GET /auth/roles read-only con USUARIOS_VER; rutas retiradas; asistente IA', () => {
    // MUT-D: restaurar guard PERMISOS_GESTIONAR en GET /auth/roles → SECRETARIA obtendría 403;
    //        este test espera 200 → falla al mutar.
    it('GET /auth/roles → 200 con SECRETARIA (tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/roles', u.secretaria.token);
      expect(res.status).toBe(200);
    });

    // MUT-A: quitar filtro activo=true del getRoles() → respuesta incluiría roles inactivos → length > 4
    it('GET /auth/roles → devuelve exactamente 4 roles activos (SECRETARIA, PRESIDENTE, EVALUADOR, INVESTIGADOR)', async () => {
      const res = await get('/auth/roles', u.secretaria.token);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(4);
      const codes: string[] = res.body.map((r: any) => r.code as string);
      expect(codes).toContain('SECRETARIA');
      expect(codes).toContain('PRESIDENTE');
      expect(codes).toContain('EVALUADOR');
      expect(codes).toContain('INVESTIGADOR');
      expect(codes).not.toContain('ADMIN_TI');
    });

    it('GET /auth/roles → 403 con EVALUADOR (no tiene USUARIOS_VER)', async () => {
      const res = await get('/auth/roles', u.evaluador.token);
      expect(res.status).toBe(403);
    });

    it('POST /auth/roles → 404 (endpoint retirado en TSK-001.1c)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/roles')
        .set('Authorization', `Bearer ${u.secretaria.token}`)
        .send({ code: 'TEST', name: 'Test', description: 'Test' });
      expect(res.status).toBe(404);
    });

    it('GET /auth/modules → 404 (PermissionsController retirado en TSK-001.1c)', async () => {
      const res = await get('/auth/modules', u.secretaria.token);
      expect(res.status).toBe(404);
    });

    it('GET /auth/permissions → 404 (PermissionsController retirado en TSK-001.1c)', async () => {
      const res = await get('/auth/permissions', u.secretaria.token);
      expect(res.status).toBe(404);
    });

    // MUT-B: restaurar @Roles(PRESIDENTE) en AI admin → PRESIDENTE obtendría 200;
    //        este test espera 403 con PRESIDENTE → falla al mutar.
    it('PUT /admin/ai-assistant/roles → 403 con PRESIDENTE (solo SECRETARIA tiene acceso)', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/ai-assistant/roles')
        .set('Authorization', `Bearer ${u.presidente.token}`)
        .send({ allowedRoles: ['SECRETARIA', 'EVALUADOR'] });
      expect(res.status).toBe(403);
    });

    it('PUT /admin/ai-assistant/roles → no 403 con SECRETARIA', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/admin/ai-assistant/roles')
        .set('Authorization', `Bearer ${u.secretaria.token}`)
        .send({ allowedRoles: ['SECRETARIA', 'EVALUADOR'] });
      expect(res.status).not.toBe(403);
    });

    // MUT-E: si updateUserRoles acepta roles inactivos/inexistentes, este test falla
    it('PATCH /auth/users/:id/roles con ["ADMIN_TI"] → 400 (código inexistente en roles activos)', async () => {
      const testUserId = await insertUser('inv_rol_admti');
      const res = await patch(
        `/auth/users/${testUserId}/roles`,
        u.secretaria.token,
        { roles: ['ADMIN_TI'] },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Rol no válido/);
    });

    // MUT-F: si updateUserRoles ignora códigos inexistentes, asigna solo EVALUADOR sin error
    it('PATCH /auth/users/:id/roles con ["FOO","EVALUADOR"] → 400 y usuario sin cambios', async () => {
      const testUserId = await insertUser('inv_rol_foo');
      const rolesBefore: Array<{ rol_id: number }> = await ds.query(
        `SELECT rol_id FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
        [testUserId],
      );
      const res = await patch(
        `/auth/users/${testUserId}/roles`,
        u.secretaria.token,
        { roles: ['FOO', 'EVALUADOR'] },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Rol no válido/);
      const rolesAfter: Array<{ rol_id: number }> = await ds.query(
        `SELECT rol_id FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
        [testUserId],
      );
      expect(rolesAfter).toHaveLength(rolesBefore.length);
    });

    // MUT-E: si updateUserRoles no filtra activo=false, aceptaría este rol inactivo
    describe('TSK-001.1c — rol inactivo creado en prueba rechazado por updateUserRoles', () => {
      const INACTIVE_CODE = 'ZZ_TEST_INV_CODES';
      let inactiveRolId = 0;
      let testUserId = 0;

      beforeAll(async () => {
        await ds.query(`DELETE FROM catalogos.roles WHERE codigo = $1`, [
          INACTIVE_CODE,
        ]);
        const rows: Array<{ id: number }> = await ds.query(
          `INSERT INTO catalogos.roles (nombre, codigo, activo)
           VALUES ($1, $2, false) RETURNING id`,
          ['ZZ Test Inv Codes', INACTIVE_CODE],
        );
        inactiveRolId = rows[0].id;
        testUserId = await insertUser('inv_rol_inactive');
      }, 15_000);

      afterAll(async () => {
        if (testUserId) {
          await ds.query(
            `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
            [testUserId],
          );
          await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
            testUserId,
          ]);
        }
        if (inactiveRolId) {
          await ds.query(`DELETE FROM catalogos.roles WHERE id = $1`, [
            inactiveRolId,
          ]);
        }
      });

      it('PATCH /auth/users/:id/roles con rol inactivo → 400 (activo=false excluido)', async () => {
        const res = await patch(
          `/auth/users/${testUserId}/roles`,
          u.secretaria.token,
          { roles: [INACTIVE_CODE] },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Rol no válido/);
      });
    });

    // MUT-E2: si TypeORM @DeleteDateColumn no filtra eliminado_en, updateUserRoles aceptaría el rol
    describe('TSK-001.1c — rol activo+eliminado rechazado por updateUserRoles', () => {
      const DELETED_CODE = 'ZZ_TEST_DEL';
      let deletedRolId = 0;
      let testUserId = 0;

      beforeAll(async () => {
        await ds.query(`DELETE FROM catalogos.roles WHERE codigo = $1`, [
          DELETED_CODE,
        ]);
        const rows: Array<{ id: number }> = await ds.query(
          `INSERT INTO catalogos.roles (nombre, codigo, activo, eliminado_en)
           VALUES ($1, $2, true, NOW()) RETURNING id`,
          ['ZZ Test Del', DELETED_CODE],
        );
        deletedRolId = rows[0].id;
        testUserId = await insertUser('inv_rol_deleted');
      }, 15_000);

      afterAll(async () => {
        if (testUserId) {
          await ds.query(
            `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
            [testUserId],
          );
          await ds.query(`DELETE FROM catalogos.usuarios WHERE id = $1`, [
            testUserId,
          ]);
        }
        if (deletedRolId) {
          await ds.query(`DELETE FROM catalogos.roles WHERE id = $1`, [
            deletedRolId,
          ]);
        }
      });

      it('PATCH /auth/users/:id/roles con ZZ_TEST_DEL (activo=true, eliminado_en=NOW) → 400', async () => {
        const res = await patch(
          `/auth/users/${testUserId}/roles`,
          u.secretaria.token,
          { roles: [DELETED_CODE] },
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Rol no válido/);
      });
    });
  });
});
