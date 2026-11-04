/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-015-N06 — spec-003 RF-ALR.f (v1.5.2): GET /api/secretaria/pendientes.
 *
 * Guards reales y login real con secretaria@test.com y presidente@test.com.
 * La contraseña de esas cuentas de prueba se lee de E2E_TEST_ACCOUNTS_PASSWORD
 * (no se escribe en el código ni se imprime).
 * Datos: protocolos ZZ_TEST_PEND_*, usuarios @e2e-pend.test y convocatorias
 * ZZ_TEST_PEND_*, borrados en beforeAll y afterAll. Solo ceish_test_db.
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
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { endOfDayGuayaquil } from '../src/shared/services/deadline-calculator.service';
import { PendingItemsService } from '../src/modules/secretaria/application/services/pending-items.service';

const PREFIX = 'ZZ_TEST_PEND_';
const EMAIL_DOMAIN = '@e2e-pend.test';
const SECRETARIA_EMAIL = 'secretaria@test.com';
const PRESIDENTE_EMAIL = 'presidente@test.com';
const GROUP_ORDER = ['VENCIDO', 'HOY', 'SEMANA', 'PROXIMO', 'SIN_PLAZO'];

/** Plazo más antiguo del protocolo REASIGNAR: fecha_limite 2026-01-15 sin fecha_limite_ts. */
const OLDEST_DEADLINE_DATE = '2026-01-15';

describe('TSK-015-N06 — GET /api/secretaria/pendientes (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let presidenteToken: string;
  let investigatorId: number;
  let evaluatorId: number;
  let baseline: {
    todos: number;
    vencidos: number;
    hoy: number;
    semana: number;
  };
  const ids: Record<string, number> = {};

  const getPending = (token: string | null, query = '') => {
    const req = request(app.getHttpServer()).get(
      `/api/secretaria/pendientes${query}`,
    );
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  async function cleanup(): Promise<void> {
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos
       WHERE version_id IN (${versionIds})
          OR convocatoria_id IN (SELECT id FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (${versionIds})`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN (${versionIds})`,
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
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
    if (res.status !== 201 || !res.body?.access_token) {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return res.body.access_token;
  }

  /** Protocolo + versión activa + recepción (opcional). */
  async function insertProtocol(
    key: string,
    opts: {
      protocolStatusId?: number | null;
      receptionStatusId?: number | null;
      riskConfirmed?: boolean;
      termsAccepted?: boolean;
      deleted?: boolean;
    },
  ): Promise<{ protocolId: number; versionId: number }> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos
         (titulo, codigo_ceish, investigador_principal_id, estado_id,
          nivel_riesgo_confirmado, sometimiento_tiempos_aceptado, eliminado_en)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7::boolean THEN NOW() ELSE NULL END)
       RETURNING id`,
      [
        `${PREFIX}${key}`,
        `${PREFIX}${key}`,
        investigatorId,
        opts.protocolStatusId ?? null,
        opts.riskConfirmed ?? false,
        opts.termsAccepted ?? true,
        opts.deleted ?? false,
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
    if (opts.receptionStatusId != null) {
      await ds.query(
        `INSERT INTO recepcion.recepciones (version_id, estado_id) VALUES ($1, $2)`,
        [v.id, opts.receptionStatusId],
      );
    }
    ids[key] = p.id;
    return { protocolId: p.id, versionId: v.id };
  }

  async function insertAssignment(
    versionId: number,
    statusId: number,
    deadline: { date?: string; tsSql?: string },
  ): Promise<void> {
    await ds.query(
      `INSERT INTO evaluacion.asignaciones_evaluacion
         (version_id, evaluador_id, estado_id, fecha_limite, fecha_limite_ts)
       VALUES ($1, $2, $3, $4::date, ${deadline.tsSql ?? 'NULL'})`,
      [versionId, evaluatorId, statusId, deadline.date ?? null],
    );
  }

  async function insertMeeting(
    tag: string,
    status: 'PROGRAMADA' | 'CANCELADA',
  ): Promise<string> {
    const [c] = await ds.query(
      `INSERT INTO evaluacion.convocatorias
         (numero_convocatoria, anio_lectivo, tipo_session, fecha_reunion,
          fecha_entrega_evaluacion, estado)
       VALUES ($1, 2026, 'ORDINARIA', NOW() - INTERVAL '30 days',
               NOW() - INTERVAL '28 days', $2)
       RETURNING id`,
      [`${PREFIX}${tag}`, status],
    );
    return c.id;
  }

  async function linkMeeting(
    meetingId: string,
    protocolId: number,
    versionId: number,
  ): Promise<void> {
    await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
       VALUES ($1, $2, $3, 1, NOW())`,
      [meetingId, protocolId, versionId],
    );
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
    (PermissionsGuard as any).cache?.clear?.();

    secretariaToken = await login(SECRETARIA_EMAIL, password);
    presidenteToken = await login(PRESIDENTE_EMAIL, password);

    // Línea base con los datos que ya hay en ceish_test_db.
    const before = await getPending(secretariaToken);
    expect(before.status).toBe(200);
    baseline = before.body.data.totales;

    const [inv] = await ds.query(
      `INSERT INTO catalogos.usuarios (cedula, nombres_completos, email_institucional, activo, email_verificado)
       VALUES ('ZZPEND00001', 'ZZ_TEST_PEND Investigador', 'investigador${EMAIL_DOMAIN}', true, true)
       RETURNING id`,
    );
    investigatorId = inv.id;
    const [ev] = await ds.query(
      `INSERT INTO catalogos.usuarios (cedula, nombres_completos, email_institucional, activo, email_verificado)
       VALUES ('ZZPEND00002', 'ZZ_TEST_PEND Evaluador', 'evaluador${EMAIL_DOMAIN}', true, true)
       RETURNING id`,
    );
    evaluatorId = ev.id;

    // a) VALIDAR
    await insertProtocol('VALIDAR', { receptionStatusId: 15 });
    await insertProtocol('VAL_ELIMINADO', {
      receptionStatusId: 15,
      deleted: true,
    });
    await insertProtocol('VAL_INICIADO', { receptionStatusId: 9 });

    // b) ASIGNAR
    await insertProtocol('ASIGNAR', { receptionStatusId: 10 });
    await insertProtocol('ASIG_SIN_ACEPTACION', {
      receptionStatusId: 10,
      termsAccepted: false,
    });
    await insertProtocol('ASIG_RIESGO_CONFIRMADO', {
      receptionStatusId: 10,
      riskConfirmed: true,
    });
    const conActiva = await insertProtocol('ASIG_CON_ACTIVA', {
      receptionStatusId: 10,
    });
    await insertAssignment(conActiva.versionId, 6, {});

    // c) REASIGNAR: dos asignaciones vencidas (una por fecha_limite, otra por ts)
    // y una COMPLETADO más antigua que no debe contar.
    const meetingOk = await insertMeeting('OK', 'PROGRAMADA');
    const reas = await insertProtocol('REASIGNAR', {
      protocolStatusId: 13,
      receptionStatusId: 10,
      riskConfirmed: true,
    });
    await linkMeeting(meetingOk, reas.protocolId, reas.versionId);
    await insertAssignment(reas.versionId, 6, { date: OLDEST_DEADLINE_DATE });
    await insertAssignment(reas.versionId, 6, {
      date: '2026-02-01',
      tsSql: `NOW() - INTERVAL '1 day'`,
    });
    await insertAssignment(reas.versionId, 7, { date: '2025-01-01' });

    // c) exclusiones
    const sinConv = await insertProtocol('REAS_SIN_CONV', {
      protocolStatusId: 13,
      receptionStatusId: 10,
    });
    await insertAssignment(sinConv.versionId, 6, {
      date: OLDEST_DEADLINE_DATE,
    });

    const futura = await insertProtocol('REAS_FUTURA', {
      protocolStatusId: 13,
      receptionStatusId: 10,
    });
    await linkMeeting(meetingOk, futura.protocolId, futura.versionId);
    await insertAssignment(futura.versionId, 6, {
      date: '2099-01-01',
      tsSql: `NOW() + INTERVAL '3 days'`,
    });

    const completada = await insertProtocol('REAS_COMPLETADA', {
      protocolStatusId: 13,
      receptionStatusId: 10,
    });
    await linkMeeting(meetingOk, completada.protocolId, completada.versionId);
    await insertAssignment(completada.versionId, 7, {
      date: OLDEST_DEADLINE_DATE,
    });

    const meetingCancel = await insertMeeting('CANCEL', 'CANCELADA');
    const cancelada = await insertProtocol('REAS_CANCELADA', {
      protocolStatusId: 13,
      receptionStatusId: 10,
    });
    await linkMeeting(meetingCancel, cancelada.protocolId, cancelada.versionId);
    await insertAssignment(cancelada.versionId, 6, {
      date: OLDEST_DEADLINE_DATE,
    });
  }, 90_000);

  afterAll(async () => {
    if (ds?.isInitialized) await cleanup();
    if (app) await app.close();
  }, 30_000);

  describe('filas a/b/c', () => {
    let items: any[];
    let body: any;

    beforeAll(async () => {
      const res = await getPending(secretariaToken);
      expect(res.status).toBe(200);
      body = res.body;
      items = res.body.data.items;
    });

    const mine = (key: string) =>
      items.filter((i) => i.protocolId === ids[key]);

    it('respuesta con statusCode, message y data', () => {
      expect(body.statusCode).toBe(200);
      expect(body.message).toBe('Pendientes obtenidos exitosamente');
      expect(Object.keys(body.data).sort()).toEqual([
        'fechaReferencia',
        'items',
        'totales',
      ]);
    });

    it('a) recepción en 15 → VALIDAR sin plazo, etapa RECEPCION', () => {
      expect(mine('VALIDAR')).toEqual([
        {
          protocolId: ids.VALIDAR,
          ceishCode: `${PREFIX}VALIDAR`,
          title: `${PREFIX}VALIDAR`,
          estadoActual: 'Recepción por validar',
          etapa: 'RECEPCION',
          etapaOrden: 1,
          fechaPlazo: null,
          estadoPlazo: 'SIN_PLAZO',
          accion: 'VALIDAR',
          accionTexto: 'Validar documentos',
        },
      ]);
    });

    it('b) COMPLETO sin asignaciones y con plazos aceptados → ASIGNAR sin plazo, etapa ASIGNACION', () => {
      expect(mine('ASIGNAR')).toEqual([
        {
          protocolId: ids.ASIGNAR,
          ceishCode: `${PREFIX}ASIGNAR`,
          title: `${PREFIX}ASIGNAR`,
          estadoActual: 'Recepción completa · sin evaluadores',
          etapa: 'ASIGNACION',
          etapaOrden: 2,
          fechaPlazo: null,
          estadoPlazo: 'SIN_PLAZO',
          accion: 'ASIGNAR',
          accionTexto: 'Asignar evaluadores',
        },
      ]);
    });

    it('c) asignación vencida en convocatoria → una sola fila REASIGNAR con el plazo más antiguo', () => {
      expect(mine('REASIGNAR')).toEqual([
        {
          protocolId: ids.REASIGNAR,
          ceishCode: `${PREFIX}REASIGNAR`,
          title: `${PREFIX}REASIGNAR`,
          estadoActual: 'En evaluación · dictamen vencido',
          etapa: 'EVALUACION',
          etapaOrden: 3,
          fechaPlazo: endOfDayGuayaquil(OLDEST_DEADLINE_DATE).toISOString(),
          estadoPlazo: 'VENCIDO',
          accion: 'REASIGNAR',
          accionTexto: 'Reasignar evaluador',
        },
      ]);
    });

    it.each([
      ['VAL_ELIMINADO', 'protocolo eliminado'],
      ['VAL_INICIADO', 'recepción INICIADO (9)'],
      ['ASIG_SIN_ACEPTACION', 'espera la aceptación del investigador'],
      ['ASIG_RIESGO_CONFIRMADO', 'riesgo ya confirmado'],
      ['ASIG_CON_ACTIVA', 'ya tiene una asignación activa'],
      ['REAS_SIN_CONV', 'asignación vencida sin convocatoria'],
      ['REAS_FUTURA', 'asignación en convocatoria sin vencer'],
      ['REAS_COMPLETADA', 'asignación COMPLETADO (7) vencida'],
      ['REAS_CANCELADA', 'convocatoria CANCELADA'],
    ])('excluye %s (%s)', (key) => {
      expect(mine(key)).toEqual([]);
    });

    it('orden: grupos VENCIDO, HOY, SEMANA, PROXIMO, SIN_PLAZO; fechaPlazo ascendente dentro del grupo', () => {
      const groups = items.map((i) => GROUP_ORDER.indexOf(i.estadoPlazo));
      expect(groups).toEqual([...groups].sort((a, b) => a - b));
      const vencidos = items
        .filter((i) => i.estadoPlazo === 'VENCIDO')
        .map((i) => Date.parse(i.fechaPlazo));
      expect(vencidos).toEqual([...vencidos].sort((a, b) => a - b));
    });

    it('fechaReferencia es la fecha de hoy en Ecuador según NOW() de la base', async () => {
      const [{ hoy }] = await ds.query(
        `SELECT to_char(NOW() AT TIME ZONE 'America/Guayaquil', 'YYYY-MM-DD') AS hoy`,
      );
      expect(body.data.fechaReferencia).toBe(hoy);
    });
  });

  describe('totales y filtros', () => {
    it('totales suman las filas nuevas sobre la línea base (todos +3, vencidos +1)', async () => {
      const res = await getPending(secretariaToken);
      expect(res.body.data.totales).toEqual({
        todos: baseline.todos + 3,
        vencidos: baseline.vencidos + 1,
        hoy: baseline.hoy,
        semana: baseline.semana,
      });
      expect(res.body.data.items).toHaveLength(res.body.data.totales.todos);
    });

    it.each([
      ['vencidos', 'VENCIDO'],
      ['hoy', 'HOY'],
      ['semana', 'SEMANA'],
    ])(
      '?filtro=%s → solo %s, y totales no cambian con el filtro',
      async (filtro, group) => {
        const all = await getPending(secretariaToken);
        const res = await getPending(secretariaToken, `?filtro=${filtro}`);
        expect(res.status).toBe(200);
        expect(res.body.data.totales).toEqual(all.body.data.totales);
        const expected = all.body.data.items.filter(
          (i: any) => i.estadoPlazo === group,
        );
        expect(res.body.data.items).toEqual(expected);
      },
    );

    it('?filtro=vencidos incluye la fila REASIGNAR y excluye VALIDAR y ASIGNAR', async () => {
      const res = await getPending(secretariaToken, '?filtro=vencidos');
      const found = res.body.data.items.map((i: any) => i.protocolId);
      expect(found).toContain(ids.REASIGNAR);
      expect(found).not.toContain(ids.VALIDAR);
      expect(found).not.toContain(ids.ASIGNAR);
    });

    it('?filtro=todos equivale a sin filtro', async () => {
      const all = await getPending(secretariaToken);
      const res = await getPending(secretariaToken, '?filtro=todos');
      expect(res.body.data).toEqual(all.body.data);
    });

    it('?filtro inválido → 400', async () => {
      const res = await getPending(secretariaToken, '?filtro=proximo');
      expect(res.status).toBe(400);
    });
  });

  describe('acceso', () => {
    it('sin token → 401', async () => {
      const res = await getPending(null);
      expect(res.status).toBe(401);
    });

    it('PRESIDENTE (tiene DASHBOARD_VENCIMIENTOS, no el rol) → 403', async () => {
      const res = await getPending(presidenteToken);
      expect(res.status).toBe(403);
    });
  });

  describe('rendimiento', () => {
    it('una sola consulta a la base por petición', async () => {
      const service = app.get(PendingItemsService);
      const spy = jest.spyOn(ds, 'query');
      try {
        await service.getPending('todos');
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });
  });
});
