/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-001.4 — spec-001 RF-EST.3 (v3.5.6): filtros y acceso de GET /api/protocols.
 *
 * Guards reales y login real:
 * - secretaria@test.com y presidente@test.com con la contraseña de E2E_TEST_ACCOUNTS_PASSWORD
 *   (no se escribe en el código ni se imprime; si falta, se aborta antes del login);
 * - EVALUADOR e INVESTIGADOR: usuarios ZZ_TEST_PLIST_ propios con una contraseña generada aquí.
 * Datos: protocolos y usuarios ZZ_TEST_PLIST_ (correo @e2e-plist.test), borrados en beforeAll
 * y afterAll. Solo ceish_test_db.
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
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { ProtocolStage } from '../src/modules/protocols/domain/enums/protocol-stage.enum';

const PREFIX = 'ZZ_TEST_PLIST_';
const EMAIL_DOMAIN = '@e2e-plist.test';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const PRESIDENTE_EMAIL = 'presidente@test.com';
const STAGES = Object.values(ProtocolStage);

interface SeedOpts {
  title?: string;
  code?: string;
  principalId?: number;
  protocolStatusId?: number | null;
  receptionStatusId?: number | null;
  receptionDateUtc?: string | null;
  createdAtUtc?: string;
  withResolution?: boolean;
  coInvestigators?: string[];
}

describe('TSK-001.4 — GET /api/protocols: filtros y acceso (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Record<string, string> = {};
  const ids: Record<string, number> = {};
  let principalBaseId: number;
  let principalSoloId: number;
  let investigadorUserId: number;
  let presidenteRolId: number;
  let permisoId: number;

  const api = () => request(app.getHttpServer());
  const list = (query: string, who = 'secretaria') =>
    api()
      .get(`/api/protocols${query ? `?${query}` : ''}`)
      .set('Authorization', `Bearer ${token[who]}`);
  const enc = (v: string) => encodeURIComponent(v);
  const idsOf = (res: request.Response): number[] =>
    (res.body.data as any[]).map((r) => r.id).sort((a, b) => a - b);
  const expectIds = (...keys: string[]) =>
    keys.map((k) => ids[k]).sort((a, b) => a - b);

  async function cleanup(): Promise<void> {
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM resolucion.resoluciones WHERE protocolo_id IN (${protocolIds})`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN (${versionIds})`,
    );
    await ds.query(
      `DELETE FROM public.protocolo_investigadores WHERE protocolo_id IN (${protocolIds})`,
    );
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
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_DOMAIN}`],
    );
  }

  async function restorePresidentePermission(): Promise<void> {
    await ds.query(
      `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [presidenteRolId, permisoId],
    );
    (PermissionsGuard as any).cache.clear();
  }

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    if (res.status !== 201 || !res.body?.access_token) {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return res.body.access_token;
  }

  async function insertUser(
    key: string,
    fullName: string,
    passwordHash: string | null = null,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [
        `ZZPL${key}`.slice(0, 20),
        fullName,
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

  /** Protocolo ZZ_TEST_PLIST_ + versión activa + recepción y resolución opcionales. */
  async function seed(key: string, opts: SeedOpts = {}): Promise<number> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos
         (titulo, codigo_ceish, investigador_principal_id, estado_id, creado_en)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamp, NOW())) RETURNING id`,
      [
        `${PREFIX}${opts.title ?? key}`,
        opts.code ?? null,
        opts.principalId ?? principalBaseId,
        opts.protocolStatusId ?? null,
        opts.createdAtUtc ?? null,
      ],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [p.id, opts.protocolStatusId ?? null],
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [v.id, p.id],
    );
    if (
      opts.receptionStatusId !== undefined &&
      opts.receptionStatusId !== null
    ) {
      await ds.query(
        `INSERT INTO recepcion.recepciones (version_id, estado_id, fecha_recepcion)
         VALUES ($1, $2, COALESCE($3::timestamp, NOW()))`,
        [v.id, opts.receptionStatusId, opts.receptionDateUtc ?? null],
      );
    }
    if (opts.withResolution) {
      await ds.query(
        `INSERT INTO resolucion.resoluciones (protocolo_id, version_id, tipo_resolucion_id)
         VALUES ($1, $2, 1)`,
        [p.id, v.id],
      );
    }
    for (const [i, name] of (opts.coInvestigators ?? []).entries()) {
      await ds.query(
        `INSERT INTO public.protocolo_investigadores
           (protocolo_id, nombre_completo, identificacion, email, telefono, cargo, institucion, formacion_academica)
         VALUES ($1, $2, $3, $4, '0000000000', 'Docente', 'ZZ_TEST_PLIST Institución', 'Maestría')`,
        [p.id, name, `ZZPLCO${p.id}${i}`, `co${p.id}_${i}${EMAIL_DOMAIN}`],
      );
    }
    ids[key] = p.id;
    return p.id;
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
    await app.init();
    ds = app.get(DataSource);

    const [{ current_database: active }] = await ds.query(
      'SELECT current_database()',
    );
    if (!String(active).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${active}'.`);
    }

    await cleanup();
    (PermissionsGuard as any).cache.clear();

    const [perm] = await ds.query(
      `SELECT id FROM catalogos.permisos WHERE codigo = 'PROTOCOLOS_LISTAR'`,
    );
    if (!perm) {
      throw new Error(
        'ABORT: falta PROTOCOLOS_LISTAR (corre la migración 1900000000000 en ceish_test_db).',
      );
    }
    permisoId = perm.id;
    const [pres] = await ds.query(
      `SELECT id FROM catalogos.roles WHERE codigo = 'PRESIDENTE'`,
    );
    presidenteRolId = pres.id;

    token.secretaria = await login(SECRETARIA_EMAIL, password);
    token.presidente = await login(PRESIDENTE_EMAIL, password);

    // EVALUADOR e INVESTIGADOR propios: contraseña generada aquí, nunca la de cuentas reales.
    const generated = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generated, 10);
    const evaluadorId = await insertUser(
      'evaluador',
      `${PREFIX}Evaluador`,
      hash,
    );
    await assignRole(evaluadorId, 'EVALUADOR');
    investigadorUserId = await insertUser(
      'investigador',
      `${PREFIX}Investigador`,
      hash,
    );
    await assignRole(investigadorUserId, 'INVESTIGADOR');
    token.evaluador = await login(`evaluador${EMAIL_DOMAIN}`, generated);
    token.investigador = await login(`investigador${EMAIL_DOMAIN}`, generated);

    principalBaseId = await insertUser('principal', `${PREFIX}Principal Base`);
    principalSoloId = await insertUser(
      'principal_solo',
      `${PREFIX}Principal Obsidiana`,
    );

    // Búsqueda
    await seed('COD_A1', { code: 'ZZPLIST_COD_A1' });
    await seed('COD_DECOY', { code: 'ZZPLIST_CODXA1' });
    await seed('TITULO', { title: 'Estudio Lapislazuli sobre agua' });
    await seed('PCT', { title: 'Cobertura 100% rural' });
    await seed('PCT_DECOY', { title: 'Cobertura 1000 rural' });
    await seed('COINV', {
      title: 'Coinvestigadores',
      coInvestigators: [
        'Coinvestigadora Turquesa Uno',
        'Coinvestigadora Turquesa Dos',
      ],
    });
    await seed('PRINCIPAL_SOLO', {
      title: 'Sin coinvestigadores',
      principalId: principalSoloId,
    });
    await seed('INV_OWN', {
      title: 'Del investigador',
      principalId: investigadorUserId,
    });

    // Año (fechas en UTC; Ecuador = UTC−5)
    await seed('YEAR_REC_BORDE', {
      title: 'YEARX recepcion borde',
      receptionStatusId: 9,
      receptionDateUtc: '2031-01-01 04:30:00', // 2030-12-31 23:30 en Ecuador
      createdAtUtc: '2031-01-05 12:00:00',
    });
    await seed('YEAR_REC_MEDIANOCHE', {
      title: 'YEARX recepcion medianoche',
      receptionStatusId: 9,
      receptionDateUtc: '2031-01-01 05:00:00', // 2031-01-01 00:00 en Ecuador
      createdAtUtc: '2030-06-01 12:00:00',
    });
    await seed('YEAR_SIN_REC', {
      title: 'YEARX sin recepcion',
      createdAtUtc: '2032-01-01 04:59:00', // 2031-12-31 23:59 en Ecuador
    });

    // Etapa
    await seed('ST_ASIG', {
      title: 'STAGEX asignacion',
      receptionStatusId: 10,
    });
    await seed('ST_EVAL', {
      title: 'STAGEX evaluacion',
      protocolStatusId: 13,
      receptionStatusId: 10,
    });
    await seed('ST_RES', {
      title: 'STAGEX resolucion',
      protocolStatusId: 17,
      receptionStatusId: 10,
    });
    await seed('ST_SEG', {
      title: 'STAGEX seguimiento',
      protocolStatusId: 17,
      receptionStatusId: 10,
      withResolution: true,
    });
    await seed('ST_REC', { title: 'STAGEX recepcion', receptionStatusId: 9 });
    await seed('ST_SIN_REC', { title: 'STAGEX sin recepcion' });
    await seed('ST_EVALUADO', {
      title: 'STAGEX evaluado',
      protocolStatusId: 14,
      receptionStatusId: 10,
    });

    // Paginación por etapa
    for (const k of ['PAG_1', 'PAG_2', 'PAG_3']) {
      await seed(k, {
        title: `PAGX ${k}`,
        protocolStatusId: 13,
        receptionStatusId: 10,
      });
    }
  }, 120_000);

  afterAll(async () => {
    if (ds?.isInitialized) {
      if (presidenteRolId && permisoId) await restorePresidentePermission();
      await cleanup();
    }
    if (app) await app.close();
  }, 30_000);

  // ─── Acceso ─────────────────────────────────────────────────────────────────
  describe('acceso', () => {
    it('sin token → 401', async () => {
      const res = await api().get('/api/protocols');
      expect(res.status).toBe(401);
    });

    it('SECRETARIA → 200', async () => {
      const res = await list('');
      expect(res.status).toBe(200);
    });

    it('PRESIDENTE → 200, y ?statusId=14 sigue filtrando EVALUADO', async () => {
      const res = await list(
        `statusId=14&search=${enc('STAGEX')}`,
        'presidente',
      );
      expect(res.status).toBe(200);
      expect(idsOf(res)).toEqual(expectIds('ST_EVALUADO'));
      expect(res.body.data.every((r: any) => r.statusId === 14)).toBe(true);
    });

    it('EVALUADOR → 403', async () => {
      const res = await list('', 'evaluador');
      expect(res.status).toBe(403);
    });

    it('INVESTIGADOR → 403 en /protocols y 200 en /protocols/mis-protocolos', async () => {
      const res = await list('', 'investigador');
      expect(res.status).toBe(403);

      const mine = await api()
        .get('/api/protocols/mis-protocolos')
        .set('Authorization', `Bearer ${token.investigador}`);
      expect(mine.status).toBe(200);
      expect((mine.body.data as any[]).map((r) => r.id)).toEqual([ids.INV_OWN]);
    });

    it('PRESIDENTE sin PROTOCOLOS_LISTAR en su rol → 403', async () => {
      await ds.query(
        `DELETE FROM catalogos.rol_permisos WHERE rol_id = $1 AND permiso_id = $2`,
        [presidenteRolId, permisoId],
      );
      (PermissionsGuard as any).cache.clear();
      try {
        const res = await list('', 'presidente');
        expect(res.status).toBe(403);
      } finally {
        await restorePresidentePermission();
      }
    });
  });

  // ─── search ─────────────────────────────────────────────────────────────────
  describe('search', () => {
    it('por código: "_" se busca literal (no como comodín)', async () => {
      const res = await list(`search=${enc('ZZPLIST_COD_A1')}`);
      expect(res.status).toBe(200);
      expect(idsOf(res)).toEqual(expectIds('COD_A1'));
      expect(res.body.total).toBe(1);
    });

    it('por título, sin distinguir mayúsculas', async () => {
      const res = await list(`search=${enc('  lapislazuli  ')}`);
      expect(idsOf(res)).toEqual(expectIds('TITULO'));
    });

    it('"%" se busca literal', async () => {
      const res = await list(`search=${enc('Cobertura 100%')}`);
      expect(idsOf(res)).toEqual(expectIds('PCT'));
    });

    it('por coinvestigador: una sola fila aunque coincidan 2, con total correcto', async () => {
      const res = await list(`search=${enc('turquesa')}`);
      expect(idsOf(res)).toEqual(expectIds('COINV'));
      expect(res.body.total).toBe(1);
      expect(res.body.totalPages).toBe(1);
    });

    it('por investigador principal sin fila en protocolo_investigadores', async () => {
      const res = await list(`search=${enc('Principal Obsidiana')}`);
      expect(idsOf(res)).toEqual(expectIds('PRINCIPAL_SOLO'));
    });

    it('vacío se ignora (igual que sin search)', async () => {
      const a = await list('limit=1');
      const b = await list(`limit=1&search=${enc('   ')}`);
      expect(b.status).toBe(200);
      expect(b.body.total).toBe(a.body.total);
    });

    it('101 caracteres → 400', async () => {
      const res = await list(`search=${'a'.repeat(101)}`);
      expect(res.status).toBe(400);
    });
  });

  // ─── year ───────────────────────────────────────────────────────────────────
  describe('year (America/Guayaquil)', () => {
    it('2030: recepción del 31/12 a las 23:30 en Ecuador', async () => {
      const res = await list(`year=2030&search=YEARX`);
      expect(idsOf(res)).toEqual(expectIds('YEAR_REC_BORDE'));
    });

    it('2031: recepción a medianoche del 1/1 y creación (sin recepción) del 31/12 a las 23:59', async () => {
      const res = await list(`year=2031&search=YEARX`);
      expect(idsOf(res)).toEqual(
        expectIds('YEAR_REC_MEDIANOCHE', 'YEAR_SIN_REC'),
      );
    });

    it('2032: nada (la creación de las 04:59 UTC sigue siendo 2031 en Ecuador)', async () => {
      const res = await list(`year=2032&search=YEARX`);
      expect(res.body.total).toBe(0);
    });

    it.each(['1999', '2101', 'abc'])('year=%s → 400', async (year) => {
      const res = await list(`year=${year}`);
      expect(res.status).toBe(400);
    });
  });

  // ─── etapa ──────────────────────────────────────────────────────────────────
  describe('etapa', () => {
    it.each([
      [ProtocolStage.RECEPCION, ['ST_REC', 'ST_SIN_REC']],
      [ProtocolStage.ASIGNACION, ['ST_ASIG']],
      [ProtocolStage.EVALUACION, ['ST_EVAL']],
      [ProtocolStage.RESOLUCION, ['ST_RES', 'ST_EVALUADO']],
      [ProtocolStage.SEGUIMIENTO, ['ST_SEG']],
      [ProtocolStage.RENOVACION, []],
    ])('%s: devuelve solo esa etapa', async (etapa, keys) => {
      const res = await list(`etapa=${etapa}&search=STAGEX`);
      expect(res.status).toBe(200);
      expect(idsOf(res)).toEqual(expectIds(...keys));
      expect(res.body.data.every((r: any) => r.etapa === etapa)).toBe(true);
    });

    it('sobre todo ceish_test_db: cada item trae la etapa filtrada y la suma por etapa = total sin filtro', async () => {
      const all = await list('limit=1');
      let sum = 0;
      const totals: Record<string, number> = {};
      for (const etapa of STAGES) {
        const res = await list(`etapa=${etapa}&limit=100`);
        expect(res.status).toBe(200);
        expect(res.body.data.every((r: any) => r.etapa === etapa)).toBe(true);
        totals[etapa] = res.body.total;
        sum += res.body.total;
      }
      // Visible en el reporte de la tarea.
      console.log(
        `[TSK-001.4] totales por etapa: ${JSON.stringify(totals)}; sin filtro: ${all.body.total}`,
      );
      expect(sum).toBe(all.body.total);
    });

    it('con paginación: total y totalPages de la etapa', async () => {
      const p1 = await list('etapa=EVALUACION&search=PAGX&limit=2&page=1');
      expect(p1.body.total).toBe(3);
      expect(p1.body.totalPages).toBe(2);
      expect(p1.body.data).toHaveLength(2);
      const p2 = await list('etapa=EVALUACION&search=PAGX&limit=2&page=2');
      expect(p2.body.data).toHaveLength(1);
      const all = [...idsOf(p1), ...idsOf(p2)].sort((a, b) => a - b);
      expect(all).toEqual(expectIds('PAG_1', 'PAG_2', 'PAG_3'));
    });

    it('etapa inválida → 400', async () => {
      const res = await list('etapa=RIESGO');
      expect(res.status).toBe(400);
    });

    it('limit=101 → 400', async () => {
      const res = await list('limit=101');
      expect(res.status).toBe(400);
    });
  });

  // ─── respuesta ──────────────────────────────────────────────────────────────
  describe('respuesta', () => {
    it('principalInvestigator { id, fullName } y los campos previos', async () => {
      const res = await list(`search=${enc('Principal Obsidiana')}`);
      const row = res.body.data[0];
      expect(row.principalInvestigator).toEqual({
        id: principalSoloId,
        fullName: `${PREFIX}Principal Obsidiana`,
      });
      for (const field of [
        'id',
        'ceishCode',
        'title',
        'statusId',
        'receptionStatus',
        'etapa',
        'etapaOrden',
        'investigators',
        'checklist',
      ]) {
        expect(row).toHaveProperty(field);
      }
    });
  });
});
