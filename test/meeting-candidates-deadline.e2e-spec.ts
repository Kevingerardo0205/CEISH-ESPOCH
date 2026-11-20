/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-002-N57 — un protocolo solo es candidato para una convocatoria cuando vence su plazo de
 * evaluación (spec-002 v1.3.3, RF-12.7 c.2 y c.5; EARS 7).
 *
 * Base real (ceish_test_db). RolesGuard real; solo JwtAuthGuard se sustituye: el usuario y sus
 * roles llegan en las cabeceras x-user-id y x-roles (los mismos roles sembrados en la base).
 * Datos: protocolos ZZ_TEST_N57_*, usuarios @e2e-n57.test; se borran en beforeAll y afterAll.
 * El paso del tiempo se simula con fecha_limite_revision en el pasado o en el futuro (sin tocar el reloj).
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
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';
import {
  toCalendarDateString,
  toDayMonthYear,
} from '../src/shared/services/deadline-calculator.service';

const PREFIX = 'ZZ_TEST_N57_';
const EMAIL_DOMAIN = '@e2e-n57.test';
const RECEPTION_COMPLETO = 10;
const PROTOCOL_STATUS = 10;

type Role = 'PRESIDENTE' | 'SECRETARIA' | 'EVALUADOR';
type Version = { protocolId: number; versionId: number; code: string };
/** Asignación sembrada: estado y fecha límite como expresión SQL relativa a NOW() (o NULL). */
type Seed = { evaluator: string; status: number; deadlineSql: string };

describe('TSK-002-N57 — candidatos para convocatoria solo con el plazo de evaluación vencido (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let orphanBaseline: number;
  const u: Record<string, number> = {};
  const roleIdByCode: Record<string, number> = {};
  let meetingDay = 0;

  // ---------- helpers ----------

  const asUser = (
    req: request.Test,
    key: string,
    roles: Role[],
  ): request.Test =>
    req.set('x-user-id', String(u[key])).set('x-roles', roles.join(','));

  const pendingList = async (
    key = 'SEC',
    roles: Role[] = ['SECRETARIA'],
  ): Promise<request.Response> =>
    asUser(
      request(app.getHttpServer()).get(
        '/api/evaluations/meetings/pending-protocols',
      ),
      key,
      roles,
    );

  const pendingVersionIds = async (): Promise<number[]> => {
    const res = await pendingList();
    expect(res.status).toBe(200);
    return (res.body.data as any[]).map((p) => Number(p.versionId));
  };

  /** Cada convocatoria con una fecha de reunión distinta (2027) para no chocar entre pruebas. */
  const createMeeting = (versionIds: number[]): request.Test => {
    meetingDay += 1;
    const day = String(meetingDay).padStart(2, '0');
    return asUser(
      request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send({
          sessionType: 'ORDINARIA',
          meetingDate: `2027-03-${day}T14:00:00.000Z`,
          evalSubmissionDeadline: `2027-04-${day}T22:00:00.000Z`,
          protocolVersionIds: versionIds,
        }),
      'SEC',
      ['SECRETARIA'],
    );
  };

  const messageOf = (res: request.Response): string => {
    const m = res.body?.message;
    return Array.isArray(m) ? m.join(' | ') : String(m);
  };

  /** dd/mm/aaaa (día de Ecuador) del MAX(fecha_limite_revision) guardado para la versión. */
  const deadlineText = async (versionId: number): Promise<string> => {
    const [row] = await ds.query(
      `SELECT MAX(fecha_limite_revision) AS d FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = $1 AND estado_id IN ($2, $3, $4, $5, $6)`,
      [
        versionId,
        AssignmentStatus.SUGGESTED,
        AssignmentStatus.ASSIGNED,
        AssignmentStatus.COMPLETED,
        AssignmentStatus.REASIGNED_VENCIMIENTO,
        AssignmentStatus.REASIGNED_COI,
      ],
    );
    return toDayMonthYear(toCalendarDateString(new Date(row.d)))!;
  };

  const noAssignmentsLine = (code: string): string =>
    `El protocolo ${code} no tiene evaluadores asignados; no se puede agendar.`;

  const pendingLine = (code: string, date: string): string =>
    `El plazo de evaluación de los pares vence el ${date} (hora de Ecuador); el protocolo ${code} se podrá agendar desde el día siguiente.`;

  async function cleanup(): Promise<void> {
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const versionIds = `SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`;
    const userIds = `SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`;
    // convocatorias primero (convocatoria_protocolos → convocatorias es ON DELETE CASCADE)
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE id IN (
         SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id IN (${versionIds}))`,
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
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN (${userIds})`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  async function insertUser(key: string, roles: Role[]): Promise<void> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios (cedula, nombres_completos, email_institucional, activo, email_verificado)
       VALUES ($1, $2, $3, true, true) RETURNING id`,
      [
        `ZZN57${String(Object.keys(u).length + 1).padStart(5, '0')}`,
        `${PREFIX}${key}`,
        `${key.toLowerCase()}${EMAIL_DOMAIN}`,
      ],
    );
    const id = Number(row.id);
    for (const role of roles) {
      await ds.query(
        `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id) VALUES ($1, $2)`,
        [id, roleIdByCode[role]],
      );
    }
    u[key] = id;
  }

  /** Protocolo con su versión activa en recepción COMPLETO y las asignaciones indicadas. */
  async function insertVersion(key: string, seeds: Seed[]): Promise<Version> {
    const code = `${PREFIX}${key}`;
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, codigo_ceish, investigador_principal_id, estado_id)
       VALUES ($1, $1, $2, $3) RETURNING id`,
      [code, u.INV, PROTOCOL_STATUS],
    );
    const protocolId = Number(p.id);
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [protocolId, PROTOCOL_STATUS],
    );
    const versionId = Number(v.id);
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [versionId, protocolId],
    );
    await ds.query(
      `INSERT INTO recepcion.recepciones (version_id, estado_id) VALUES ($1, $2)`,
      [versionId, RECEPTION_COMPLETO],
    );
    for (const s of seeds) {
      await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion
           (version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_asignacion, fecha_limite_revision)
         VALUES ($1, $2, $3, false, NOW() - INTERVAL '20 days', ${s.deadlineSql})`,
        [versionId, u[s.evaluator], s.status],
      );
    }
    return { protocolId, versionId, code };
  }

  const PAST = `NOW() - INTERVAL '1 day'`;
  const FUTURE = `NOW() + INTERVAL '3 days'`;

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

    const roles: Array<{ id: number; codigo: string }> = await ds.query(
      `SELECT id, codigo FROM catalogos.roles
        WHERE codigo IN ('PRESIDENTE', 'SECRETARIA', 'EVALUADOR')
          AND activo = true AND eliminado_en IS NULL`,
    );
    for (const r of roles) roleIdByCode[r.codigo] = Number(r.id);

    await insertUser('INV', []);
    await insertUser('SEC', ['SECRETARIA']);
    await insertUser('PRES', ['PRESIDENTE']);
    await insertUser('EV1', ['EVALUADOR']);
    await insertUser('EV2', ['EVALUADOR']);
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

  // ---------- pruebas ----------

  it('C1. plazo vencido → aparece en la lista y POST /meetings → 201 sin ADVERTENCIA_PLAZO_REVISION', async () => {
    const v = await insertVersion('C1_VENCIDO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: PAST,
      },
      {
        evaluator: 'EV2',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: PAST,
      },
    ]);
    expect(await pendingVersionIds()).toContain(v.versionId);

    const res = await createMeeting([v.versionId]);
    expect(res.status).toBe(201);
    const warnings: string[] = res.body.advertencias;
    expect(Array.isArray(warnings)).toBe(true);
    expect(
      warnings.filter((w) => w.includes('ADVERTENCIA_PLAZO_REVISION')),
    ).toEqual([]);
  });

  it('C2. plazo sin vencer con todas COMPLETED → no aparece y 409 PLAZO_EVALUACION_NO_VENCIDO con la fecha dd/mm/aaaa', async () => {
    const v = await insertVersion('C2_NO_VENCIDO_COMPLETO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.COMPLETED,
        deadlineSql: FUTURE,
      },
      {
        evaluator: 'EV2',
        status: AssignmentStatus.COMPLETED,
        deadlineSql: FUTURE,
      },
    ]);
    expect(await pendingVersionIds()).not.toContain(v.versionId);

    const res = await createMeeting([v.versionId]);
    expect(res.status).toBe(409);
    const date = await deadlineText(v.versionId);
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(messageOf(res)).toBe(
      `PLAZO_EVALUACION_NO_VENCIDO: ${pendingLine(v.code, date)}`,
    );
  });

  it('C3. plazo vencido con todas COMPLETED → aparece', async () => {
    const v = await insertVersion('C3_VENCIDO_COMPLETO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.COMPLETED,
        deadlineSql: PAST,
      },
      {
        evaluator: 'EV2',
        status: AssignmentStatus.COMPLETED,
        deadlineSql: PAST,
      },
    ]);
    expect(await pendingVersionIds()).toContain(v.versionId);
  });

  it('C4. dos fechas límite distintas, una vencida y otra no → no aparece y 409 con la fecha mayor', async () => {
    const v = await insertVersion('C4_MIXTO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: PAST,
      },
      {
        evaluator: 'EV2',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: FUTURE,
      },
    ]);
    expect(await pendingVersionIds()).not.toContain(v.versionId);

    const res = await createMeeting([v.versionId]);
    expect(res.status).toBe(409);
    const [row] = await ds.query(`SELECT ${FUTURE} AS d`);
    const futureDate = toDayMonthYear(toCalendarDateString(new Date(row.d)))!;
    expect(await deadlineText(v.versionId)).toBe(futureDate);
    expect(messageOf(res)).toContain(pendingLine(v.code, futureDate));
  });

  it('C5. reasignada con fecha vencida y la asignación nueva sin fecha límite → aparece (RF-12.7 c.5)', async () => {
    const v = await insertVersion('C5_REASIGNADA', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.REASIGNED_VENCIMIENTO,
        deadlineSql: PAST,
      },
      {
        evaluator: 'EV2',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: 'NULL',
      },
    ]);
    expect(await pendingVersionIds()).toContain(v.versionId);
  });

  it('C6. solo asignaciones REASIGNADO_* (sin activas) → no aparece y 409 «no tiene evaluadores asignados»', async () => {
    const v = await insertVersion('C6_SOLO_REASIGNADAS', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.REASIGNED_COI,
        deadlineSql: PAST,
      },
    ]);
    expect(await pendingVersionIds()).not.toContain(v.versionId);

    const res = await createMeeting([v.versionId]);
    expect(res.status).toBe(409);
    expect(messageOf(res)).toBe(
      `PLAZO_EVALUACION_NO_VENCIDO: ${noAssignmentsLine(v.code)}`,
    );
  });

  it('C7. sin asignaciones → no aparece y 409 «no tiene evaluadores asignados»', async () => {
    const v = await insertVersion('C7_SIN_ASIGNACIONES', []);
    expect(await pendingVersionIds()).not.toContain(v.versionId);

    const res = await createMeeting([v.versionId]);
    expect(res.status).toBe(409);
    expect(messageOf(res)).toBe(
      `PLAZO_EVALUACION_NO_VENCIDO: ${noAssignmentsLine(v.code)}`,
    );
  });

  it('C8. una versión vencida y dos no candidatas → 409 con una línea por protocolo, en el orden enviado, y no se guarda', async () => {
    const ok = await insertVersion('C8_VENCIDO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: PAST,
      },
    ]);
    const notYet = await insertVersion('C8_NO_VENCIDO', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: FUTURE,
      },
    ]);
    const none = await insertVersion('C8_SIN_ASIGNACIONES', []);
    const [{ count: before }] = await ds.query(
      `SELECT COUNT(*)::int AS count FROM evaluacion.convocatorias`,
    );

    const res = await createMeeting([
      ok.versionId,
      notYet.versionId,
      none.versionId,
    ]);
    expect(res.status).toBe(409);
    const date = await deadlineText(notYet.versionId);
    expect(messageOf(res).split('\n')).toEqual([
      `PLAZO_EVALUACION_NO_VENCIDO: ${pendingLine(notYet.code, date)}`,
      noAssignmentsLine(none.code),
    ]);
    const [{ count: after }] = await ds.query(
      `SELECT COUNT(*)::int AS count FROM evaluacion.convocatorias`,
    );
    expect(Number(after)).toBe(Number(before));
  });

  it('C9. fecha límite al cierre de ayer en Ecuador (23:59:59.999) → aparece', async () => {
    const endOfYesterdayEcuador = `(date_trunc('day', NOW() AT TIME ZONE 'America/Guayaquil') - INTERVAL '1 millisecond') AT TIME ZONE 'America/Guayaquil'`;
    const v = await insertVersion('C9_CIERRE_AYER', [
      {
        evaluator: 'EV1',
        status: AssignmentStatus.ASSIGNED,
        deadlineSql: endOfYesterdayEcuador,
      },
    ]);
    expect(await pendingVersionIds()).toContain(v.versionId);
  });

  it('C10. PRESIDENTE sigue con 200 en la lista', async () => {
    const res = await pendingList('PRES', ['PRESIDENTE']);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
