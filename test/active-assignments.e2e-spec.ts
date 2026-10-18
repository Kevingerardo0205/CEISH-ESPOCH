/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { Permission } from '../src/shared/enums/permission.enum';
import { EvaluationsController } from '../src/modules/evaluations/infrastructure/controllers/evaluations.controller';
import { ROLES_KEY } from '../src/shared/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../src/shared/decorators/permissions.decorator';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';

const TEST_AA_IP = '10.0.6.2';

describe('Active Assignments E2E (ceish_test_db)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // IDs fijos — distintos de los demás suites
  // RH usa: usuarios 930-934, protocolos/versiones 950-952, asignaciones 9501-9505
  const U_EVAL_1 = 940; // perfil Jurídico
  const U_EVAL_2 = 941; // perfil Salud
  const U_EVAL_3 = 942; // perfil Metodológico
  const U_EVAL_4 = 943; // perfil Sociedad Civil
  const U_EXTRA_1 = 944; // evaluador para asignaciones excluidas (ARCHIVED)
  const U_EXTRA_2 = 945; // evaluador para asignaciones excluidas (REASIGNED)
  const U_REQUESTER = 946; // usuario que hace la petición HTTP

  const PROTO_ACTIVE = 960; // protocolo con asignaciones activas en versión 1
  const PROTO_NO_V1 = 961; // protocolo SIN fila con numero_version=1
  const PROTO_NO_ASG = 962; // protocolo con versión 1 pero sin asignaciones
  const PROTO_V2 = 963; // protocolo con v1 vacía y v2 con asignaciones (fija deuda técnica)

  const VER_ACTIVE_V1 = 960; // numero_version=1 de PROTO_ACTIVE
  const VER_NO_V1_V2 = 961; // numero_version=2 de PROTO_NO_V1 (la v1 no existe)
  const VER_NO_ASG_V1 = 962; // numero_version=1 de PROTO_NO_ASG
  const VER_V2_V1 = 963; // numero_version=1 de PROTO_V2 (sin asignaciones)
  const VER_V2_V2 = 964; // numero_version=2 de PROTO_V2 (con asignaciones)

  const ASG_SUGGESTED = 9601; // estado=5 SUGGESTED
  const ASG_ASSIGNED = 9602; // estado=6 ASSIGNED, isAnnex10=true, deadline set
  const ASG_COMPLETED = 9603; // estado=7 COMPLETED, submittedAt set
  const ASG_SOC_CIVIL = 9607; // estado=5 SUGGESTED, Sociedad Civil
  const ASG_ARCHIVED = 9604; // estado=8 ARCHIVED — NO debe aparecer
  const ASG_REASIGNED = 9605; // estado=26 REASIGNED_VENCIMIENTO — NO debe aparecer
  const ASG_V2_ONLY = 9606; // en VER_V2_V2 — NO debe aparecer (deuda: v2 no es v1)

  let profileJuridicoId: number;
  let profileSaludId: number;
  let profileMetodologicoId: number;
  let profileSociedadCivilId: number;

  beforeAll(async () => {
    const dbName = process.env.TEST_DB_NAME || 'ceish_test_db';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(`ABORT: BD no autorizada '${dbName}'. Solo bases *test.`);
    }
    process.env.DB_NAME = dbName;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const userId = req.headers['x-user-id']
            ? Number(req.headers['x-user-id'])
            : U_REQUESTER;
          req.user = {
            id: userId,
            email: `user${userId}@test-aa.com`,
            roles: ['SECRETARIA', 'PRESIDENTE'],
            permissions: Object.values(Permission),
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(MailerNotificationAdapter)
      .useValue(
        new MailerNotificationAdapter({
          sendMail: jest.fn().mockResolvedValue(undefined),
        }),
      )
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendUnscheduledProtocolsAlert: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest
          .fn()
          .mockResolvedValue('https://storage.test.com/file.pdf'),
        getFileUrl: jest
          .fn()
          .mockResolvedValue('https://storage.test.com/file.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PdfGeneratorService)
      .useValue({
        generateAnnex9Report: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 test')),
        generateCallPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 call')),
      })
      .overrideProvider(DocxGeneratorService)
      .useValue({
        generateAnnex9Docx: jest
          .fn()
          .mockResolvedValue(Buffer.from('PK docx test')),
      })
      .overrideProvider('IMeetingPdfGeneratorPort')
      .useValue({
        generateAgendaPdf: jest.fn().mockResolvedValue({
          url: '/api/evaluations/meetings/mock-id/pdf',
          buffer: Buffer.from('%PDF-1.4 agenda'),
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    const testDbResult = await dataSource.query('SELECT current_database();');
    const nestDbName: string = testDbResult[0]?.current_database;
    if (
      !nestDbName ||
      (!nestDbName.endsWith('test') &&
        !nestDbName.endsWith('test_db') &&
        !nestDbName.endsWith('_test_db'))
    ) {
      throw new Error(
        `ABORT (NestApp): BD activa '${nestDbName}' no es de tests.`,
      );
    }

    // ── Resolver IDs de perfiles del catálogo ──────────────────────────────
    const profileRows: Array<{ id: number; nombre: string }> =
      await dataSource.query(
        `SELECT id, nombre FROM catalogos.perfiles_evaluador WHERE activo = true ORDER BY id`,
      );

    const findProfileId = (keyword: string): number => {
      const row = profileRows.find((r) =>
        r.nombre
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .toUpperCase()
          .includes(keyword),
      );
      if (!row)
        throw new Error(`Perfil '${keyword}' no encontrado en catálogo`);
      return row.id;
    };

    profileJuridicoId = findProfileId('JURIDIC');
    profileSaludId = findProfileId('SALUD');
    profileMetodologicoId = findProfileId('METODOL');
    profileSociedadCivilId = findProfileId('SOCIEDAD');

    // ── Sembrar usuarios ───────────────────────────────────────────────────
    await dataSource.query(`
      INSERT INTO catalogos.usuarios (id, cedula, nombres_completos, email_institucional, activo, email_verificado)
      VALUES
        (${U_EVAL_1},    '0000000940', 'Evaluador Juridico AA',       'eval940@test-aa.com', true, true),
        (${U_EVAL_2},    '0000000941', 'Evaluador Salud AA',           'eval941@test-aa.com', true, true),
        (${U_EVAL_3},    '0000000942', 'Evaluador Metodologico AA',    'eval942@test-aa.com', true, true),
        (${U_EVAL_4},    '0000000943', 'Evaluador Sociedad Civil AA',  'eval943@test-aa.com', true, true),
        (${U_EXTRA_1},   '0000000944', 'Evaluador Extra1 AA',          'eval944@test-aa.com', true, true),
        (${U_EXTRA_2},   '0000000945', 'Evaluador Extra2 AA',          'eval945@test-aa.com', true, true),
        (${U_REQUESTER}, '0000000946', 'Secretaria Solicitante AA',    'eval946@test-aa.com', true, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // ── Sembrar protocolos ─────────────────────────────────────────────────
    await dataSource.query(`
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_ACTIVE}, 'AA Protocolo activo v1', ${U_EVAL_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_ACTIVE});

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_NO_V1}, 'AA Protocolo sin version 1', ${U_EVAL_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_NO_V1});

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_NO_ASG}, 'AA Protocolo v1 sin asignaciones', ${U_EVAL_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_NO_ASG});

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_V2}, 'AA Protocolo con v1 vacia y v2 con asignaciones', ${U_EVAL_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_V2});
    `);

    // ── Sembrar versiones ──────────────────────────────────────────────────
    await dataSource.query(`
      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES
        (${VER_ACTIVE_V1},  ${PROTO_ACTIVE},  1, 10),
        (${VER_NO_V1_V2},   ${PROTO_NO_V1},   2, 10),
        (${VER_NO_ASG_V1},  ${PROTO_NO_ASG},  1, 10),
        (${VER_V2_V1},      ${PROTO_V2},      1, 10),
        (${VER_V2_V2},      ${PROTO_V2},      2, 10)
      ON CONFLICT (id) DO NOTHING;

      UPDATE public.protocolos SET version_actual_id = ${VER_ACTIVE_V1} WHERE id = ${PROTO_ACTIVE};
      UPDATE public.protocolos SET version_actual_id = ${VER_NO_V1_V2}  WHERE id = ${PROTO_NO_V1};
      UPDATE public.protocolos SET version_actual_id = ${VER_NO_ASG_V1} WHERE id = ${PROTO_NO_ASG};
      UPDATE public.protocolos SET version_actual_id = ${VER_V2_V2}     WHERE id = ${PROTO_V2};
    `);

    // ── Sembrar asignaciones ───────────────────────────────────────────────
    // Timestamps explícitos para test de orden determinista (AA-08)
    await dataSource.query(`
      INSERT INTO evaluacion.asignaciones_evaluacion
        (id, version_id, evaluador_id, perfil_id, estado_id,
         es_asignado_anexo_10, fecha_limite, fecha_entrega_real, fecha_asignacion)
      VALUES
        (${ASG_SUGGESTED}, ${VER_ACTIVE_V1}, ${U_EVAL_1}, ${profileJuridicoId},
         5, false, NULL, NULL, NOW() - INTERVAL '3 hours'),

        (${ASG_ASSIGNED}, ${VER_ACTIVE_V1}, ${U_EVAL_2}, ${profileSaludId},
         6, true, '2026-12-31', NULL, NOW() - INTERVAL '2 hours'),

        (${ASG_COMPLETED}, ${VER_ACTIVE_V1}, ${U_EVAL_3}, ${profileMetodologicoId},
         7, false, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '1 hour'),

        (${ASG_SOC_CIVIL}, ${VER_ACTIVE_V1}, ${U_EVAL_4}, ${profileSociedadCivilId},
         5, false, NULL, NULL, NOW() - INTERVAL '30 minutes'),

        (${ASG_ARCHIVED}, ${VER_ACTIVE_V1}, ${U_EXTRA_1}, ${profileJuridicoId},
         8, false, NULL, NULL, NOW() - INTERVAL '10 minutes'),

        (${ASG_REASIGNED}, ${VER_ACTIVE_V1}, ${U_EXTRA_2}, ${profileSaludId},
         26, false, NULL, NULL, NOW() - INTERVAL '5 minutes'),

        (${ASG_V2_ONLY}, ${VER_V2_V2}, ${U_EVAL_1}, ${profileJuridicoId},
         6, true, '2027-03-01', NULL, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  }, 60000);

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        // 1) Eliminar asignaciones (no hay FKs dependientes sobre ellas aquí)
        await dataSource.query(`
          DELETE FROM evaluacion.asignaciones_evaluacion
            WHERE id IN (
              ${ASG_SUGGESTED}, ${ASG_ASSIGNED}, ${ASG_COMPLETED}, ${ASG_SOC_CIVIL},
              ${ASG_ARCHIVED}, ${ASG_REASIGNED}, ${ASG_V2_ONLY}
            );
        `);
        // 2) Limpiar version_actual_id antes de borrar versiones (FK)
        await dataSource.query(`
          UPDATE public.protocolos
            SET version_actual_id = NULL
            WHERE id IN (${PROTO_ACTIVE}, ${PROTO_NO_V1}, ${PROTO_NO_ASG}, ${PROTO_V2});
        `);
        // 3) Borrar versiones y protocolos
        await dataSource.query(`
          DELETE FROM public.versiones_protocolo
            WHERE id IN (
              ${VER_ACTIVE_V1}, ${VER_NO_V1_V2}, ${VER_NO_ASG_V1},
              ${VER_V2_V1}, ${VER_V2_V2}
            );
          DELETE FROM public.protocolos
            WHERE id IN (${PROTO_ACTIVE}, ${PROTO_NO_V1}, ${PROTO_NO_ASG}, ${PROTO_V2});
          DELETE FROM catalogos.usuarios
            WHERE id IN (
              ${U_EVAL_1}, ${U_EVAL_2}, ${U_EVAL_3}, ${U_EVAL_4},
              ${U_EXTRA_1}, ${U_EXTRA_2}, ${U_REQUESTER}
            );
        `);
      }
    } catch {
      // cleanup best-effort
    }
    if (app) await app.close();
  }, 30000);

  // ── Tests ─────────────────────────────────────────────────────────────────

  it('AA-01: ID no numérico devuelve 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/evaluations/protocol/abc/active-assignments')
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(400);
  });

  it('AA-02: protocolo inexistente devuelve 404 con mensaje en español', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/evaluations/protocol/99999/active-assignments')
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/99999/);
  });

  it('AA-03: protocolo sin versión numero_version=1 devuelve 200 con assignments vacío y versionId null', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_NO_V1}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    expect(res.body.protocolId).toBe(PROTO_NO_V1);
    expect(res.body.versionId).toBeNull();
    expect(res.body.versionNumber).toBeNull();
    expect(res.body.assignments).toEqual([]);
  });

  it('AA-04: protocolo con versión 1 sin asignaciones devuelve 200 con assignments vacío', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_NO_ASG}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    expect(res.body.protocolId).toBe(PROTO_NO_ASG);
    expect(res.body.versionId).toBe(VER_NO_ASG_V1);
    expect(res.body.versionNumber).toBe(1);
    expect(res.body.assignments).toEqual([]);
  });

  it('AA-05: happy path — devuelve shape completo del DTO para las 4 asignaciones activas', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_ACTIVE}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    expect(res.body.protocolId).toBe(PROTO_ACTIVE);
    expect(res.body.versionId).toBe(VER_ACTIVE_V1);
    expect(res.body.versionNumber).toBe(1);

    const assignments: any[] = res.body.assignments;
    expect(assignments).toHaveLength(4);

    // Verificar que los IDs esperados están presentes
    const ids: number[] = assignments.map((a: any) => a.assignmentId);
    expect(ids).toContain(ASG_SUGGESTED);
    expect(ids).toContain(ASG_ASSIGNED);
    expect(ids).toContain(ASG_COMPLETED);
    expect(ids).toContain(ASG_SOC_CIVIL);

    // Verificar shape de la asignación con deadline (ASG_ASSIGNED)
    const asgAssigned = assignments.find(
      (a) => a.assignmentId === ASG_ASSIGNED,
    );
    expect(asgAssigned).toBeDefined();
    expect(asgAssigned.evaluatorId).toBe(U_EVAL_2);
    expect(typeof asgAssigned.evaluatorFullName).toBe('string');
    expect(asgAssigned.evaluatorFullName.length).toBeGreaterThan(0);
    expect(asgAssigned.evaluatorProfile).toBe('SALUD');
    expect(asgAssigned.status).toBe('ASSIGNED');
    expect(asgAssigned.isAssignedForAnnex10).toBe(true);
    expect(asgAssigned.deadlineDate).toBe('2026-12-31');
    expect(asgAssigned.submittedAt).toBeNull();
    // assignedAt debe ser ISO-8601 completo (con T y Z)
    expect(asgAssigned.assignedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Verificar shape de la asignación completada (ASG_COMPLETED)
    const asgCompleted = assignments.find(
      (a) => a.assignmentId === ASG_COMPLETED,
    );
    expect(asgCompleted).toBeDefined();
    expect(asgCompleted.status).toBe('COMPLETED');
    expect(asgCompleted.evaluatorProfile).toBe('METODOLOGICO');
    expect(asgCompleted.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Verificar shape de SUGGESTED sin deadline ni submittedAt
    const asgSuggested = assignments.find(
      (a) => a.assignmentId === ASG_SUGGESTED,
    );
    expect(asgSuggested.status).toBe('SUGGESTED');
    expect(asgSuggested.evaluatorProfile).toBe('JURIDICO');
    expect(asgSuggested.deadlineDate).toBeNull();
    expect(asgSuggested.submittedAt).toBeNull();
    expect(asgSuggested.isAssignedForAnnex10).toBe(false);
  });

  it('AA-06: asignaciones con estado ARCHIVED (8) y REASIGNED_VENCIMIENTO (26) no aparecen en la respuesta', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_ACTIVE}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    const ids: number[] = res.body.assignments.map((a: any) => a.assignmentId);
    expect(ids).not.toContain(ASG_ARCHIVED);
    expect(ids).not.toContain(ASG_REASIGNED);
    // Exactamente 4 activas (estados 5, 6, 7)
    expect(res.body.assignments).toHaveLength(4);
  });

  it('AA-07: isAssignedForAnnex10 se refleja correctamente (true e false)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_ACTIVE}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    const assignments: any[] = res.body.assignments;

    const withAnnex = assignments.find((a) => a.assignmentId === ASG_ASSIGNED);
    const withoutAnnex = assignments.find(
      (a) => a.assignmentId === ASG_SUGGESTED,
    );
    expect(withAnnex.isAssignedForAnnex10).toBe(true);
    expect(withoutAnnex.isAssignedForAnnex10).toBe(false);
  });

  it('AA-08: orden determinista — assignedAt ASC, desempate por id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_ACTIVE}/active-assignments`)
      .set('x-forwarded-for', TEST_AA_IP);
    expect(res.status).toBe(200);
    const assignments: any[] = res.body.assignments;
    // La más antigua (NOW()-3h) debe ir primero
    expect(assignments[0].assignmentId).toBe(ASG_SUGGESTED);
    // La segunda (NOW()-2h)
    expect(assignments[1].assignmentId).toBe(ASG_ASSIGNED);
    // Las dos de NOW()-1h y NOW()-30m por assignedAt ASC
    const lastTwo = [assignments[2].assignmentId, assignments[3].assignmentId];
    expect(lastTwo).toContain(ASG_COMPLETED);
    expect(lastTwo).toContain(ASG_SOC_CIVIL);
    // Desempate por id: ASG_COMPLETED(9603) < ASG_SOC_CIVIL(9607)
    expect(assignments[2].assignmentId).toBe(ASG_COMPLETED);
    expect(assignments[3].assignmentId).toBe(ASG_SOC_CIVIL);
  });

  it(
    'AA-09: asignaciones sembradas en versión 2 del mismo protocolo NO aparecen ' +
      '(comportamiento actual: endpoint usa numero_version=1; ' +
      'DEUDA: assign-evaluators.use-case.ts:127-143 y evaluations.service.ts:856-858 ' +
      'también fijan version_number=1; cambiar escritor y lector juntos si se habilitan ' +
      'evaluaciones de versiones posteriores)',
    async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/evaluations/protocol/${PROTO_V2}/active-assignments`)
        .set('x-forwarded-for', TEST_AA_IP);
      expect(res.status).toBe(200);
      expect(res.body.versionId).toBe(VER_V2_V1); // resuelve v1, no v2
      expect(res.body.versionNumber).toBe(1);
      expect(res.body.assignments).toEqual([]);
      // ASG_V2_ONLY está en VER_V2_V2 y no debe aparecer aquí
      const ids: number[] = res.body.assignments.map(
        (a: any) => a.assignmentId,
      );
      expect(ids).not.toContain(ASG_V2_ONLY);
    },
  );

  it('AA-10: el endpoint declara roles SECRETARIA y PRESIDENTE y permiso EVALUATORS_ASSIGN (metadata Reflector)', () => {
    const reflector = new Reflector();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = EvaluationsController.prototype.getActiveAssignments;
    const roles = reflector.get<string[]>(ROLES_KEY, handler);
    const permissions = reflector.get<Permission[]>(PERMISSIONS_KEY, handler);
    expect(roles).toContain('SECRETARIA');
    expect(roles).toContain('PRESIDENTE');
    expect(permissions).toContain(Permission.EVALUATORS_ASSIGN);
  });
});
