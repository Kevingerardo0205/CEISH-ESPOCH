/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-002-N52 — asignación de evaluadores pares por la PRESIDENTE (spec-002 v1.3.2:
 * RF-12.1 a–e y g, RF-12.2a, RF-12.REV, RF-12.6, RF-12.7 c.1 y derogación de (4) y (4b)).
 *
 * Base real (ceish_test_db). RolesGuard y PermissionsGuard reales: los permisos salen de
 * catalogos.usuarios_roles → rol_permisos. Solo JwtAuthGuard se sustituye: el usuario y sus
 * roles llegan en las cabeceras x-user-id y x-roles (los mismos roles sembrados en la base).
 * Datos: protocolos ZZ_TEST_PRES_*, usuarios @e2e-pres.test; se borran en beforeAll y afterAll.
 * Correo: IEmailServicePort.sendHtml simulado (sin envío real).
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
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';
import {
  EvaluatorProfile,
  toEvaluatorProfile,
} from '../src/shared/enums/evaluator-enums';
import { LEGACY_EVALUATOR_IDS_MESSAGE } from '../src/modules/evaluations/application/dtos/evaluator-dtos';
import { BusinessDayCalculator } from '../src/shared/services/deadline-calculator.service';
import { AddFechaLimiteRevisionToAssignments1980000000000 } from '../src/migrations/1980000000000-AddFechaLimiteRevisionToAssignments';

const PREFIX = 'ZZ_TEST_PRES_';
const EMAIL_DOMAIN = '@e2e-pres.test';
const REVIEW_BUSINESS_DAYS = 8;
const RECEPTION_COMPLETO = 10;
const RECEPTION_NOT_COMPLETE = 9;
const PROTOCOL_STATUS = 10;

type Role = 'PRESIDENTE' | 'SECRETARIA' | 'EVALUADOR';
type Item = { evaluatorId: number; profile: EvaluatorProfile };

describe('TSK-002-N52 — asignación por la PRESIDENTE (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let sendHtmlMock: jest.Mock;
  let mailer: MailerNotificationAdapter;
  let orphanBaseline: number;
  let riskLevelId: number;

  /** id del catálogo (perfiles_evaluador) por perfil canónico. */
  const profileIds = {} as Record<EvaluatorProfile, number>;
  /** id de usuario por clave. */
  const u: Record<string, number> = {};
  const roleIdByCode: Record<string, number> = {};

  // ---------- helpers ----------

  const asUser = (
    req: request.Test,
    userId: number,
    roles: Role[],
  ): request.Test =>
    req.set('x-user-id', String(userId)).set('x-roles', roles.join(','));

  const assignPeer = (
    protocolId: number,
    body: Record<string, unknown>,
    userId = u.PRES,
    roles: Role[] = ['PRESIDENTE', 'EVALUADOR'],
  ): request.Test =>
    asUser(
      request(app.getHttpServer())
        .post(`/api/evaluations/protocols/${protocolId}/assign-peer-evaluators`)
        .send(body),
      userId,
      roles,
    );

  const assignBody = (
    body: Record<string, unknown>,
    userId = u.PRES,
    roles: Role[] = ['PRESIDENTE', 'EVALUADOR'],
  ): request.Test =>
    asUser(
      request(app.getHttpServer()).post('/api/evaluations/assign').send(body),
      userId,
      roles,
    );

  const it_ = (evaluatorId: number, profile: EvaluatorProfile): Item => ({
    evaluatorId,
    profile,
  });

  async function cleanup(): Promise<void> {
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    const assignmentIds = `SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (${versionIds})`;
    const userIds = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    // convocatorias primero (convocatoria_protocolos → convocatorias es ON DELETE CASCADE)
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE id IN (
         SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id IN (${versionIds}))`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos WHERE version_id IN (${versionIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (${assignmentIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignacion_historial
        WHERE asignacion_anterior_id IN (${assignmentIds}) OR asignacion_nueva_id IN (${assignmentIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (${assignmentIds})`,
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
      `DELETE FROM catalogos.evaluadores_perfil WHERE usuario_id IN (${userIds})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN (${userIds})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  async function insertUser(
    key: string,
    opts: { roles: Role[]; profiles?: EvaluatorProfile[]; active?: boolean },
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios (cedula, nombres_completos, email_institucional, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        `ZZPRES${String(Object.keys(u).length + 1).padStart(5, '0')}`,
        `${PREFIX}${key}`,
        `${key.toLowerCase()}${EMAIL_DOMAIN}`,
        opts.active ?? true,
      ],
    );
    const id = Number(row.id);
    for (const role of opts.roles) {
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)`,
        [id, roleIdByCode[role]],
      );
    }
    for (const profile of opts.profiles ?? []) {
      await ds.query(
        `INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo) VALUES ($1, $2, true)`,
        [id, profileIds[profile]],
      );
    }
    u[key] = id;
    return id;
  }

  /**
   * Protocolo con dos versiones; la activa es la 2 (la asignación debe ir a la activa, no a la 1).
   * La recepción y la aceptación de tiempos se aplican a la versión activa.
   */
  async function insertProtocol(
    key: string,
    opts: { receptionStatusId?: number | null; termsAccepted?: boolean } = {},
  ): Promise<{ protocolId: number; versionId: number; oldVersionId: number }> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos
         (titulo, codigo_ceish, investigador_principal_id, estado_id, sometimiento_tiempos_aceptado)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        `${PREFIX}${key}`,
        `${PREFIX}${key}`,
        u.INV,
        PROTOCOL_STATUS,
        opts.termsAccepted ?? true,
      ],
    );
    const protocolId = Number(p.id);
    const [v1] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [protocolId, PROTOCOL_STATUS],
    );
    const [v2] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 2, $2) RETURNING id`,
      [protocolId, PROTOCOL_STATUS],
    );
    const versionId = Number(v2.id);
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [versionId, protocolId],
    );
    const reception =
      opts.receptionStatusId === undefined
        ? RECEPTION_COMPLETO
        : opts.receptionStatusId;
    if (reception !== null) {
      await ds.query(
        `INSERT INTO recepcion.recepciones (version_id, estado_id) VALUES ($1, $2)`,
        [versionId, reception],
      );
    }
    return { protocolId, versionId, oldVersionId: Number(v1.id) };
  }

  type AssignmentRow = {
    id: number;
    version_id: number;
    evaluador_id: number;
    perfil_id: number | null;
    estado_id: number;
    es_asignado_anexo_10: boolean;
    asignado_por: number | null;
    fecha_asignacion_utc: Date;
    fecha_limite_revision: Date | null;
  };

  const assignmentsOf = (protocolId: number): Promise<AssignmentRow[]> =>
    ds.query(
      `SELECT a.id, a.version_id, a.evaluador_id, a.perfil_id, a.estado_id,
              a.es_asignado_anexo_10, a.asignado_por,
              (a.fecha_asignacion AT TIME ZONE 'UTC') AS fecha_asignacion_utc,
              a.fecha_limite_revision
         FROM evaluacion.asignaciones_evaluacion a
         JOIN public.versiones_protocolo v ON v.id = a.version_id
        WHERE v.protocolo_id = $1
        ORDER BY a.id`,
      [protocolId],
    );

  const expectedReviewDeadline = (assignedAtUtc: Date): number =>
    BusinessDayCalculator.calculateDetailedDeadline({
      startDate: new Date(assignedAtUtc),
      businessDaysToAdd: REVIEW_BUSINESS_DAYS,
      holidays: [],
    }).deadlineInstant.getTime();

  const dataOf = (res: request.Response): any => res.body?.data ?? res.body;

  const messageOf = (res: request.Response): string => {
    const m = res.body?.message;
    return Array.isArray(m) ? m.join(' | ') : String(m);
  };

  // ---------- setup ----------

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || '';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(`ABORT: solo ceish_test_db. DB recibida: '${dbName}'`);
    }

    sendHtmlMock = jest.fn().mockResolvedValue(undefined);

    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const id = Number(req.headers['x-user-id']);
          const roles = String(req.headers['x-roles'] ?? '')
            .split(',')
            .filter(Boolean);
          req.user = {
            id,
            email: `user${id}${EMAIL_DOMAIN}`,
            roles,
            permissions: [],
            temporalRoles: [],
          };
          return Number.isInteger(id) && id > 0;
        },
      })
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendUnscheduledProtocolsAlert: jest.fn().mockResolvedValue(undefined),
        sendHtml: sendHtmlMock,
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
      .overrideProvider('IMeetingPdfGeneratorPort')
      .useValue({
        generateMeetingAnnouncementPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 meeting')),
        generateAgendaPdf: jest.fn().mockResolvedValue({
          url: '/api/evaluations/meetings/mock-id/pdf',
          buffer: Buffer.from('%PDF-1.4 agenda'),
        }),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();
    ds = app.get(DataSource);
    mailer = app.get(MailerNotificationAdapter);

    const [{ current_database: active }] = await ds.query(
      'SELECT current_database()',
    );
    if (
      !String(active).endsWith('test') &&
      !String(active).endsWith('test_db') &&
      !String(active).endsWith('_test_db')
    ) {
      throw new Error(`ABORT: DataSource conectado a '${active}'.`);
    }

    await cleanup();
    (PermissionsGuard as any).cache?.clear?.();

    const [{ count }] = await ds.query(
      `SELECT COUNT(*)::int AS count FROM evaluacion.convocatorias c
        WHERE NOT EXISTS (SELECT 1 FROM evaluacion.convocatoria_protocolos cp WHERE cp.convocatoria_id = c.id)`,
    );
    orphanBaseline = Number(count);

    // Parámetro del plazo (8 días laborables)
    const [param] = await ds.query(
      `SELECT valor FROM sistema.parametros_sistema WHERE clave = 'plazo_revision_oficio_dias'`,
    );
    expect(Number(param.valor)).toBe(REVIEW_BUSINESS_DAYS);

    // Roles
    const roles: Array<{ id: number; codigo: string }> = await ds.query(
      `SELECT id, codigo FROM catalogos.roles
        WHERE codigo IN ('PRESIDENTE', 'SECRETARIA', 'EVALUADOR', 'INVESTIGADOR')
          AND activo = true AND eliminado_en IS NULL`,
    );
    for (const r of roles) roleIdByCode[r.codigo] = Number(r.id);
    for (const code of ['PRESIDENTE', 'SECRETARIA', 'EVALUADOR']) {
      expect(roleIdByCode[code]).toBeDefined();
    }

    // Perfiles del catálogo (el de menor id por perfil canónico; Bioético es el id 7)
    const profiles: Array<{ id: number; nombre: string }> = await ds.query(
      `SELECT id, nombre FROM catalogos.perfiles_evaluador WHERE activo = true ORDER BY id`,
    );
    for (const p of profiles) {
      const canonical = toEvaluatorProfile(p.nombre);
      if (canonical && profileIds[canonical] === undefined) {
        profileIds[canonical] = Number(p.id);
      }
    }
    for (const profile of Object.values(EvaluatorProfile)) {
      expect(profileIds[profile]).toBeDefined();
    }
    expect(profileIds[EvaluatorProfile.BIOETICO]).toBe(7);

    const [risk] = await ds.query(
      `SELECT id FROM catalogos.niveles_riesgo WHERE activo = true ORDER BY id LIMIT 1`,
    );
    riskLevelId = Number(risk.id);

    // Usuarios
    await insertUser('INV', { roles: [] });
    // La Presidente también es evaluadora con perfil Jurídico (puede elegirse a sí misma)
    await insertUser('PRES', {
      roles: ['PRESIDENTE', 'EVALUADOR'],
      profiles: [EvaluatorProfile.JURIDICO],
    });
    await insertUser('SEC', { roles: ['SECRETARIA'] });
    await insertUser('MET', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.METODOLOGICO],
    });
    await insertUser('SAL', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.SALUD],
    });
    await insertUser('SAL2', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.SALUD],
    });
    await insertUser('JUR', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.JURIDICO],
    });
    await insertUser('BIO', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.BIOETICO],
    });
    // Persona con Sociedad civil y otro perfil (Salud): la Presidente elige con cuál entra
    await insertUser('SC1', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.SOCIEDAD_CIVIL, EvaluatorProfile.SALUD],
    });
    await insertUser('SC2', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.SOCIEDAD_CIVIL],
    });
    await insertUser('NOROLE', {
      roles: [],
      profiles: [EvaluatorProfile.METODOLOGICO],
    });
    await insertUser('INACTIVE', {
      roles: ['EVALUADOR'],
      profiles: [EvaluatorProfile.METODOLOGICO],
      active: false,
    });
  }, 60000);

  afterAll(async () => {
    try {
      if (ds?.isInitialized) {
        await cleanup();
        const [{ count }] = await ds.query(
          `SELECT COUNT(*)::int AS count FROM evaluacion.convocatorias c
            WHERE NOT EXISTS (SELECT 1 FROM evaluacion.convocatoria_protocolos cp WHERE cp.convocatoria_id = c.id)`,
        );
        expect(Number(count)).toBe(orphanBaseline);
      }
    } finally {
      (PermissionsGuard as any).cache?.clear?.();
      await app?.close();
    }
  });

  beforeEach(() => {
    sendHtmlMock.mockReset();
    sendHtmlMock.mockResolvedValue(undefined);
  });

  // ---------- casos ----------

  describe('A. Asignaciones válidas', () => {
    let expedita: { protocolId: number; versionId: number };

    it('A1. expedita con las 5 filas → 201; Anexo 10 en todas menos Sociedad civil; reviewType, asignado_por, perfil_id, versión activa, plazo y estado sin cambio', async () => {
      const p = await insertProtocol('A1_EXPEDITA');
      expedita = p;
      const handleSpy = jest.spyOn(mailer, 'handleEvaluatorAssignedEvent');

      const body = {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.MET, EvaluatorProfile.METODOLOGICO),
          it_(u.SAL, EvaluatorProfile.SALUD),
          it_(u.JUR, EvaluatorProfile.JURIDICO),
          it_(u.BIO, EvaluatorProfile.BIOETICO),
          it_(u.SC1, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      };
      const res = await assignPeer(p.protocolId, body);
      expect(res.status).toBe(201);
      expect(dataOf(res)).toHaveLength(5);

      const rows = await assignmentsOf(p.protocolId);
      expect(rows).toHaveLength(5);
      const byEvaluator = new Map(rows.map((r) => [Number(r.evaluador_id), r]));
      const expectedProfile: Record<number, EvaluatorProfile> = {
        [u.MET]: EvaluatorProfile.METODOLOGICO,
        [u.SAL]: EvaluatorProfile.SALUD,
        [u.JUR]: EvaluatorProfile.JURIDICO,
        [u.BIO]: EvaluatorProfile.BIOETICO,
        [u.SC1]: EvaluatorProfile.SOCIEDAD_CIVIL,
      };
      for (const [evaluatorId, profile] of Object.entries(expectedProfile)) {
        const row = byEvaluator.get(Number(evaluatorId));
        expect(row).toBeDefined();
        // versión activa (la 2), no la 1
        expect(Number(row!.version_id)).toBe(p.versionId);
        expect(Number(row!.estado_id)).toBe(AssignmentStatus.ASSIGNED);
        // Anexo 10 para todos menos Sociedad civil (sin sorteo)
        expect(row!.es_asignado_anexo_10).toBe(
          profile !== EvaluatorProfile.SOCIEDAD_CIVIL,
        );
        expect(Number(row!.asignado_por)).toBe(u.PRES);
        // perfil_id del catálogo (antes NULL); Bioético = 7
        expect(Number(row!.perfil_id)).toBe(profileIds[profile]);
        // fecha_limite_revision = 8 días laborables desde el día de la asignación en Ecuador
        expect(row!.fecha_limite_revision).not.toBeNull();
        expect(new Date(row!.fecha_limite_revision!).getTime()).toBe(
          expectedReviewDeadline(row!.fecha_asignacion_utc),
        );
      }
      expect(Number(byEvaluator.get(u.BIO)!.perfil_id)).toBe(7);

      const [proto] = await ds.query(
        `SELECT tipo_revision, estado_id FROM public.protocolos WHERE id = $1`,
        [p.protocolId],
      );
      expect(proto.tipo_revision).toBe('EXPEDITA');
      expect(Number(proto.estado_id)).toBe(PROTOCOL_STATUS);

      // Oficio al asignar sin convocatoria (RF-12.6): perfil, plazo con su fecha límite, código y título
      expect(handleSpy).toHaveBeenCalledTimes(5);
      await Promise.allSettled(
        handleSpy.mock.results
          .filter((r) => r.type === 'return')
          .map((r) => r.value),
      );
      for (const [payload] of handleSpy.mock.calls) {
        const p0 = payload as any;
        expect(p0.reviewBusinessDays).toBe(REVIEW_BUSINESS_DAYS);
        expect(p0.reviewDeadlineDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(p0.deadlineDate).toBeNull();
        expect(p0.protocolCode).toBe(`${PREFIX}A1_EXPEDITA`);
        expect(p0.protocolTitle).toBe(`${PREFIX}A1_EXPEDITA`);
      }
      expect(sendHtmlMock).toHaveBeenCalledTimes(5);
      const deadlineRow = rows[0];
      const ymd = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(deadlineRow.fecha_limite_revision!));
      const [y, m, d] = ymd.split('-');
      for (const call of sendHtmlMock.mock.calls) {
        const html = String(call[2]);
        expect(html).toContain(`${REVIEW_BUSINESS_DAYS} días laborables`);
        expect(html).toContain(`${d}/${m}/${y}`);
        expect(html).toContain(`${PREFIX}A1_EXPEDITA`);
        expect(html).toContain('Título del protocolo');
      }
      const toBio = sendHtmlMock.mock.calls.find((c) =>
        String(c[0]).startsWith('bio'),
      );
      expect(String(toBio![2])).toContain(EvaluatorProfile.BIOETICO);
      handleSpy.mockRestore();
    });

    it('A2. el evaluador ve la asignación en my-assignments sin convocatoria', async () => {
      const res = await asUser(
        request(app.getHttpServer()).get('/api/evaluations/my-assignments'),
        u.MET,
        ['EVALUADOR'],
      );
      expect(res.status).toBe(200);
      const list: any[] = dataOf(res);
      const rows = await assignmentsOf(expedita.protocolId);
      const mine = rows.find((r) => Number(r.evaluador_id) === u.MET)!;
      expect(list.map((a) => Number(a.id))).toContain(Number(mine.id));
    });

    it('A3. el evaluador envía submit-risk sin convocatoria → 201', async () => {
      const rows = await assignmentsOf(expedita.protocolId);
      const mine = rows.find((r) => Number(r.evaluador_id) === u.MET)!;
      const res = await asUser(
        request(app.getHttpServer())
          .post(`/api/evaluations/peer-assignments/${mine.id}/submit-risk`)
          .send({ riskLevelId, observations: `${PREFIX}riesgo` }),
        u.MET,
        ['EVALUADOR'],
      );
      expect(res.status).toBe(201);
    });

    it('A4. ya asignado → 409', async () => {
      const res = await assignPeer(expedita.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.SAL2, EvaluatorProfile.SALUD),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(409);
      expect(messageOf(res)).toContain('ya tiene evaluadores asignados');
    });

    it('A5. al agendar la convocatoria, cada evaluador ya asignado recibe el correo con la fecha de entrega', async () => {
      const handleSpy = jest.spyOn(mailer, 'handleEvaluatorAssignedEvent');
      const res = await asUser(
        request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2027-06-14T14:00:00.000Z',
            evalSubmissionDeadline: '2027-06-21T22:00:00.000Z',
            protocolVersionIds: [expedita.versionId],
          }),
        u.PRES,
        ['PRESIDENTE', 'EVALUADOR'],
      );
      expect(res.status).toBe(201);

      const start = Date.now();
      while (handleSpy.mock.calls.length < 5 && Date.now() - start < 3000) {
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(handleSpy).toHaveBeenCalledTimes(5);
      await Promise.allSettled(
        handleSpy.mock.results
          .filter((r) => r.type === 'return')
          .map((r) => r.value),
      );
      for (const [payload] of handleSpy.mock.calls) {
        expect((payload as any).deadlineDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(sendHtmlMock).toHaveBeenCalledTimes(5);
      handleSpy.mockRestore();
    });

    it('A6. expedita con 2 (Sociedad civil + otro) por /assign con protocolId → 201', async () => {
      const p = await insertProtocol('A6_EXPEDITA_2');
      const res = await assignBody({
        protocolId: p.protocolId,
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          it_(u.MET, EvaluatorProfile.METODOLOGICO),
        ],
      });
      expect(res.status).toBe(201);
      const rows = await assignmentsOf(p.protocolId);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => Number(r.version_id) === p.versionId)).toBe(
        true,
      );
    });

    it('A7. pleno con varias personas del mismo perfil y la Presidente como evaluadora → 201', async () => {
      const p = await insertProtocol('A7_PLENO');
      const res = await assignPeer(p.protocolId, {
        reviewType: 'PLENO',
        evaluators: [
          it_(u.SAL, EvaluatorProfile.SALUD),
          it_(u.SAL2, EvaluatorProfile.SALUD),
          it_(u.PRES, EvaluatorProfile.JURIDICO),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(201);
      const rows = await assignmentsOf(p.protocolId);
      expect(rows).toHaveLength(4);
      const pres = rows.find((r) => Number(r.evaluador_id) === u.PRES)!;
      expect(Number(pres.perfil_id)).toBe(
        profileIds[EvaluatorProfile.JURIDICO],
      );
      expect(pres.es_asignado_anexo_10).toBe(true);
      const [proto] = await ds.query(
        `SELECT tipo_revision, estado_id FROM public.protocolos WHERE id = $1`,
        [p.protocolId],
      );
      expect(proto.tipo_revision).toBe('PLENO');
      expect(Number(proto.estado_id)).toBe(PROTOCOL_STATUS);
    });

    it('A8. pleno con 2 personas de Sociedad civil disponibles y una quitada → 201', async () => {
      const p = await insertProtocol('A8_PLENO_SC_QUITADA');
      // SC1 y SC2 tienen Sociedad civil; solo entra SC2.
      const res = await assignPeer(p.protocolId, {
        reviewType: 'PLENO',
        evaluators: [
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          it_(u.JUR, EvaluatorProfile.JURIDICO),
        ],
      });
      expect(res.status).toBe(201);
      expect(await assignmentsOf(p.protocolId)).toHaveLength(2);
    });

    it('A9. persona con Sociedad civil y Salud entra por Salud (define el riesgo) y otra persona cubre Sociedad civil → 201', async () => {
      const p = await insertProtocol('A9_SC_OTRO_PERFIL');
      const res = await assignPeer(p.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.SC1, EvaluatorProfile.SALUD),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(201);
      const rows = await assignmentsOf(p.protocolId);
      const sc1 = rows.find((r) => Number(r.evaluador_id) === u.SC1)!;
      expect(Number(sc1.perfil_id)).toBe(profileIds[EvaluatorProfile.SALUD]);
      expect(sc1.es_asignado_anexo_10).toBe(true);
    });

    it('A10. un fallo del correo no deshace la asignación → 201 y las filas quedan', async () => {
      const p = await insertProtocol('A10_CORREO_FALLA');
      sendHtmlMock.mockRejectedValue(new Error('SMTP caído (simulado)'));
      const handleSpy = jest.spyOn(mailer, 'handleEvaluatorAssignedEvent');
      const res = await assignPeer(p.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          it_(u.BIO, EvaluatorProfile.BIOETICO),
        ],
      });
      expect(res.status).toBe(201);
      await Promise.allSettled(
        handleSpy.mock.results
          .filter((r) => r.type === 'return')
          .map((r) => r.value),
      );
      expect(sendHtmlMock).toHaveBeenCalled();
      expect(await assignmentsOf(p.protocolId)).toHaveLength(2);
      handleSpy.mockRestore();
    });
  });

  describe('B. Composición → 400 en español (nunca 500)', () => {
    let p: { protocolId: number; versionId: number };
    beforeAll(async () => {
      p = await insertProtocol('B_COMPOSICION');
    });
    afterEach(async () => {
      // ninguna petición de este bloque debe crear filas
      expect(await assignmentsOf(p.protocolId)).toHaveLength(0);
    });

    const cases: Array<[string, () => Record<string, unknown>, string]> = [
      [
        'B1. pleno sin ninguna de Sociedad civil',
        () => ({
          reviewType: 'PLENO',
          evaluators: [
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.JUR, EvaluatorProfile.JURIDICO),
          ],
        }),
        'al menos un evaluador de Sociedad civil',
      ],
      [
        'B2. sin reviewType',
        () => ({
          evaluators: [
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          ],
        }),
        'El tipo de revisión es obligatorio',
      ],
      [
        'B3. expedita sin Sociedad civil',
        () => ({
          reviewType: 'EXPEDITA',
          evaluators: [
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.MET, EvaluatorProfile.METODOLOGICO),
          ],
        }),
        'al menos un evaluador de Sociedad civil',
      ],
      [
        'B4. solo Sociedad civil',
        () => ({
          reviewType: 'PLENO',
          evaluators: [
            it_(u.SC1, EvaluatorProfile.SOCIEDAD_CIVIL),
            it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          ],
        }),
        'que no sea de Sociedad civil',
      ],
      [
        'B5. persona repetida (con otro perfil)',
        () => ({
          reviewType: 'PLENO',
          evaluators: [
            it_(u.SC1, EvaluatorProfile.SOCIEDAD_CIVIL),
            it_(u.SC1, EvaluatorProfile.SALUD),
          ],
        }),
        'más de una vez',
      ],
      [
        'B6. dos personas del mismo perfil en expedita',
        () => ({
          reviewType: 'EXPEDITA',
          evaluators: [
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.SAL2, EvaluatorProfile.SALUD),
            it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          ],
        }),
        'una persona por perfil',
      ],
      [
        'B7. un solo evaluador',
        () => ({
          reviewType: 'PLENO',
          evaluators: [it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL)],
        }),
        'al menos 2 evaluadores',
      ],
      [
        'B8. ENSAYO_CLINICO no es opción',
        () => ({
          reviewType: 'ENSAYO_CLINICO',
          evaluators: [
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
          ],
        }),
        'EXPEDITA o PLENO',
      ],
    ];

    it.each(cases)('%s → 400', async (_name, build, fragment) => {
      const res = await assignPeer(p.protocolId, build());
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain(fragment);
    });
  });

  describe('C. Evaluadores → 400', () => {
    let p: { protocolId: number; versionId: number };
    beforeAll(async () => {
      p = await insertProtocol('C_EVALUADORES');
    });
    afterEach(async () => {
      expect(await assignmentsOf(p.protocolId)).toHaveLength(0);
    });

    it('C1. evaluador sin el perfil enviado → 400', async () => {
      const res = await assignPeer(p.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.SAL, EvaluatorProfile.JURIDICO),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain('no tiene activo el perfil JURIDICO');
    });

    it('C2. usuario sin el rol EVALUADOR → 400', async () => {
      const res = await assignPeer(p.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.NOROLE, EvaluatorProfile.METODOLOGICO),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain('no tiene el rol EVALUADOR');
    });

    it('C3. evaluador inactivo → 400', async () => {
      const res = await assignPeer(p.protocolId, {
        reviewType: 'EXPEDITA',
        evaluators: [
          it_(u.INACTIVE, EvaluatorProfile.METODOLOGICO),
          it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        ],
      });
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain('no está activo');
    });
  });

  describe('D. Comprobaciones del protocolo → 409', () => {
    const valid = (): Record<string, unknown> => ({
      reviewType: 'EXPEDITA',
      evaluators: [
        it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        it_(u.MET, EvaluatorProfile.METODOLOGICO),
      ],
    });

    it('D1. recepción no COMPLETO → 409', async () => {
      const p = await insertProtocol('D1_RECEPCION', {
        receptionStatusId: RECEPTION_NOT_COMPLETE,
      });
      const res = await assignPeer(p.protocolId, valid());
      expect(res.status).toBe(409);
      expect(messageOf(res)).toContain('recepción');
      expect(await assignmentsOf(p.protocolId)).toHaveLength(0);
    });

    it('D2. tiempos no aceptados → 409', async () => {
      const p = await insertProtocol('D2_TIEMPOS', { termsAccepted: false });
      const res = await assignPeer(p.protocolId, valid());
      expect(res.status).toBe(409);
      expect(messageOf(res)).toContain('tiempos');
      expect(await assignmentsOf(p.protocolId)).toHaveLength(0);
    });

    it('D3. dos peticiones a la vez → una 201 y otra 409', async () => {
      const p = await insertProtocol('D3_CONCURRENCIA');
      const [r1, r2] = await Promise.all([
        assignPeer(p.protocolId, valid()),
        assignPeer(p.protocolId, {
          reviewType: 'PLENO',
          evaluators: [
            it_(u.SC1, EvaluatorProfile.SOCIEDAD_CIVIL),
            it_(u.SAL, EvaluatorProfile.SALUD),
            it_(u.JUR, EvaluatorProfile.JURIDICO),
          ],
        }),
      ]);
      expect([r1.status, r2.status].sort()).toEqual([201, 409]);
      const rows = await assignmentsOf(p.protocolId);
      expect([2, 3]).toContain(rows.length);
      expect(
        rows.filter(
          (r) => Number(r.estado_id) === Number(AssignmentStatus.ASSIGNED),
        ),
      ).toHaveLength(rows.length);
    });
  });

  describe('E. Contrato y roles', () => {
    let p: { protocolId: number; versionId: number };
    const valid = (): Record<string, unknown> => ({
      reviewType: 'EXPEDITA',
      evaluators: [
        it_(u.SC2, EvaluatorProfile.SOCIEDAD_CIVIL),
        it_(u.MET, EvaluatorProfile.METODOLOGICO),
      ],
    });
    beforeAll(async () => {
      p = await insertProtocol('E_CONTRATO');
    });
    afterEach(async () => {
      expect(await assignmentsOf(p.protocolId)).toHaveLength(0);
    });

    it('E1. SECRETARIA → 403 en assign-peer-evaluators', async () => {
      const res = await assignPeer(p.protocolId, valid(), u.SEC, [
        'SECRETARIA',
      ]);
      expect(res.status).toBe(403);
    });

    it('E2. SECRETARIA → 403 en /assign', async () => {
      const res = await assignBody(
        { protocolId: p.protocolId, ...valid() },
        u.SEC,
        ['SECRETARIA'],
      );
      expect(res.status).toBe(403);
    });

    it('E3. { evaluatorIds } → 400 con el mensaje en español', async () => {
      const res = await assignPeer(p.protocolId, {
        evaluatorIds: [u.SC2, u.MET],
      });
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain(LEGACY_EVALUATOR_IDS_MESSAGE);
    });

    it('E4. /assign sin protocolId → 400', async () => {
      const res = await assignBody(valid());
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain('El ID del protocolo es obligatorio.');
    });

    it('E5. protocolId del cuerpo distinto al de la ruta → 400', async () => {
      const res = await assignPeer(p.protocolId, {
        protocolId: p.protocolId + 100000,
        ...valid(),
      });
      expect(res.status).toBe(400);
      expect(messageOf(res)).toContain('no coincide con el de la ruta');
    });
  });

  describe('F. Migración 1980: el SQL da lo mismo que BusinessDayCalculator', () => {
    it('F1. viernes, después de las 19:00 de Ecuador, fin de mes y fin de semana', async () => {
      const p = await insertProtocol('F1_MIGRACION');
      // fecha_asignacion es timestamp sin zona y guarda la hora UTC
      const instantsUtc = [
        '2026-11-20 15:00:00', // viernes 10:00 de Ecuador
        '2026-11-20 01:30:00', // jueves 20:30 de Ecuador (viernes en UTC)
        '2026-01-31 03:00:00', // viernes 30/01 22:00 de Ecuador (fin de mes)
        '2026-02-27 16:00:00', // viernes fin de febrero
        '2026-03-07 12:00:00', // sábado
        '2026-12-24 23:59:00', // jueves 18:59 de Ecuador
      ];
      const ids: number[] = [];
      for (const ts of instantsUtc) {
        const [row] = await ds.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_asignacion, fecha_limite_revision)
           VALUES ($1, $2, $3, false, $4::timestamp, NULL) RETURNING id`,
          [p.versionId, u.MET, AssignmentStatus.COMPLETED, ts],
        );
        ids.push(Number(row.id));
      }

      // up() dentro de una transacción que se revierte: no toca otras filas de la base
      const qr = ds.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      let filled: Array<{
        id: number;
        asignada_utc: Date;
        fecha_limite_revision: Date;
      }>;
      try {
        await new AddFechaLimiteRevisionToAssignments1980000000000().up(qr);
        filled = await qr.query(
          `SELECT id, (fecha_asignacion AT TIME ZONE 'UTC') AS asignada_utc, fecha_limite_revision
             FROM evaluacion.asignaciones_evaluacion WHERE id = ANY($1::int[]) ORDER BY id`,
          [ids],
        );
      } finally {
        await qr.rollbackTransaction();
        await qr.release();
        logSpy.mockRestore();
      }

      expect(filled).toHaveLength(instantsUtc.length);
      for (const row of filled) {
        expect(row.fecha_limite_revision).not.toBeNull();
        expect(new Date(row.fecha_limite_revision).getTime()).toBe(
          expectedReviewDeadline(row.asignada_utc),
        );
      }
      // Caso de referencia: viernes 20/11/2026 → 8 días laborables → miércoles 02/12/2026 23:59:59.999 ECT
      expect(new Date(filled[0].fecha_limite_revision).toISOString()).toBe(
        '2026-12-03T04:59:59.999Z',
      );
      // Jueves 19/11/2026 20:30 ECT → martes 01/12/2026 23:59:59.999 ECT
      expect(new Date(filled[1].fecha_limite_revision).toISOString()).toBe(
        '2026-12-02T04:59:59.999Z',
      );

      // La transacción se revirtió: las filas siguen sin fecha_limite_revision
      const after: Array<{ fecha_limite_revision: Date | null }> =
        await ds.query(
          `SELECT fecha_limite_revision FROM evaluacion.asignaciones_evaluacion WHERE id = ANY($1::int[])`,
          [ids],
        );
      expect(after.every((r) => r.fecha_limite_revision === null)).toBe(true);
    });
  });
});
