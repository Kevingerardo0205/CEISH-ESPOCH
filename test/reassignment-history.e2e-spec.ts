/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
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

const TEST_RH_IP = '10.0.6.1';

describe('Reassignment History E2E (ceish_test_db)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // IDs fijos para este suite — distintos de los usados en otros tests
  const U_PREV_1 = 930;
  const U_NEW_1 = 931;
  const U_PREV_2 = 932;
  const U_NEW_2 = 933;
  const U_EXEC = 934;
  const PROTO_WITH_HISTORY = 950;
  const PROTO_NO_HISTORY = 951;
  const PROTO_OTHER = 952; // protocolo aislado para test de aislamiento
  const VER_WITH_HISTORY = 950;
  const VER_NO_HISTORY = 951;
  const VER_OTHER = 952;
  const ASG_OUT_1 = 9501; // asignación saliente 1
  const ASG_OUT_2 = 9502; // asignación saliente 2
  const ASG_NEW_1 = 9503; // asignación nueva 1
  const ASG_NEW_2 = 9504; // asignación nueva 2
  const ASG_OTHER = 9505; // asignación del protocolo aislado

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
            : U_EXEC;
          req.user = {
            id: userId,
            email: `user${userId}@test.com`,
            roles: ['SECRETARIA', 'PRESIDENTE'],
            permissions: Object.values(Permission),
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          // simulamos 403 cuando x-no-permission header está presente
          if (req.headers['x-no-permission']) return false;
          return true;
        },
      })
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
        `ABORT: DataSource conectado a BD no autorizada '${nestDbName}'.`,
      );
    }

    await dataSource.query(
      `SET lock_timeout = '5s'; SET statement_timeout = '10s';`,
    );

    // Limpiar datos previos de este suite
    await dataSource.query(`
      DELETE FROM evaluacion.asignacion_historial
        WHERE asignacion_anterior_id IN (${ASG_OUT_1}, ${ASG_OUT_2}, ${ASG_OTHER})
           OR asignacion_nueva_id IN (${ASG_NEW_1}, ${ASG_NEW_2}, ${ASG_OTHER});
      DELETE FROM evaluacion.asignaciones_evaluacion
        WHERE id IN (${ASG_OUT_1}, ${ASG_OUT_2}, ${ASG_NEW_1}, ${ASG_NEW_2}, ${ASG_OTHER});
      UPDATE public.protocolos SET version_actual_id = NULL
        WHERE id IN (${PROTO_WITH_HISTORY}, ${PROTO_NO_HISTORY}, ${PROTO_OTHER});
      DELETE FROM public.versiones_protocolo
        WHERE id IN (${VER_WITH_HISTORY}, ${VER_NO_HISTORY}, ${VER_OTHER});
      DELETE FROM public.protocolos
        WHERE id IN (${PROTO_WITH_HISTORY}, ${PROTO_NO_HISTORY}, ${PROTO_OTHER});
      DELETE FROM catalogos.usuarios
        WHERE id IN (${U_PREV_1}, ${U_NEW_1}, ${U_PREV_2}, ${U_NEW_2}, ${U_EXEC});
    `);

    // Sembrar usuarios
    await dataSource.query(`
      INSERT INTO catalogos.usuarios (id, email_institucional, nombres_completos, cedula)
      VALUES
        (${U_PREV_1}, 'rh-prev1@test.com', 'Dr. Evaluador Anterior Uno', '9300000001'),
        (${U_NEW_1},  'rh-new1@test.com',  'Dra. Evaluadora Nueva Uno',  '9310000001'),
        (${U_PREV_2}, 'rh-prev2@test.com', 'Dr. Evaluador Anterior Dos', '9320000001'),
        (${U_NEW_2},  'rh-new2@test.com',  'Dra. Evaluadora Nueva Dos',  '9330000001'),
        (${U_EXEC},   'rh-exec@test.com',  'Secretaria Ejecutora RH',    '9340000001')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Sembrar protocolos y versiones
    await dataSource.query(`
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_WITH_HISTORY}, 'Protocolo RH con historial', ${U_PREV_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_WITH_HISTORY});

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_NO_HISTORY}, 'Protocolo RH sin historial', ${U_PREV_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_NO_HISTORY});

      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT ${PROTO_OTHER}, 'Protocolo RH aislado (otro)', ${U_PREV_1},
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1), 10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = ${PROTO_OTHER});

      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES
        (${VER_WITH_HISTORY}, ${PROTO_WITH_HISTORY}, 1, 10),
        (${VER_NO_HISTORY},   ${PROTO_NO_HISTORY},   1, 10),
        (${VER_OTHER},        ${PROTO_OTHER},         1, 10)
      ON CONFLICT (id) DO NOTHING;

      UPDATE public.protocolos SET version_actual_id = ${VER_WITH_HISTORY}
        WHERE id = ${PROTO_WITH_HISTORY};
      UPDATE public.protocolos SET version_actual_id = ${VER_NO_HISTORY}
        WHERE id = ${PROTO_NO_HISTORY};
      UPDATE public.protocolos SET version_actual_id = ${VER_OTHER}
        WHERE id = ${PROTO_OTHER};
    `);

    // Sembrar asignaciones
    await dataSource.query(`
      INSERT INTO evaluacion.asignaciones_evaluacion
        (id, version_id, evaluador_id, estado_id)
      VALUES
        (${ASG_OUT_1}, ${VER_WITH_HISTORY}, ${U_PREV_1}, 26),
        (${ASG_NEW_1}, ${VER_WITH_HISTORY}, ${U_NEW_1},  6),
        (${ASG_OUT_2}, ${VER_WITH_HISTORY}, ${U_PREV_2}, 27),
        (${ASG_NEW_2}, ${VER_WITH_HISTORY}, ${U_NEW_2},  6),
        (${ASG_OTHER}, ${VER_OTHER},        ${U_PREV_1}, 26)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Obtener un perfil_id válido del catálogo
    const profileRows = await dataSource.query(
      `SELECT id FROM catalogos.perfiles_evaluador WHERE activo = true LIMIT 1`,
    );
    const profileId: number = profileRows[0]?.id ?? null;

    // Sembrar historial: 2 reasignaciones en PROTO_WITH_HISTORY, 1 en PROTO_OTHER
    await dataSource.query(`
      INSERT INTO evaluacion.asignacion_historial
        (asignacion_anterior_id, evaluador_anterior_id, perfil_id, motivo, justificacion,
         evaluador_nuevo_id, asignacion_nueva_id, ejecutado_por, creado_en)
      VALUES
        (${ASG_OUT_1}, ${U_PREV_1}, ${profileId ?? 'NULL'}, 'VENCIMIENTO',
         'Plazo vencido sin entrega', ${U_NEW_1}, ${ASG_NEW_1}, ${U_EXEC},
         NOW() - INTERVAL '2 hours'),
        (${ASG_OUT_2}, ${U_PREV_2}, ${profileId ?? 'NULL'}, 'CONFLICTO_INTERES',
         'Declaró conflicto de interés', ${U_NEW_2}, ${ASG_NEW_2}, ${U_EXEC},
         NOW() - INTERVAL '1 hour'),
        (${ASG_OTHER}, ${U_PREV_1}, ${profileId ?? 'NULL'}, 'VENCIMIENTO',
         'Del protocolo aislado', ${U_NEW_1}, NULL, ${U_EXEC},
         NOW() - INTERVAL '30 minutes')
      ON CONFLICT DO NOTHING;
    `);
  }, 60000);

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(`
          DELETE FROM evaluacion.asignacion_historial
            WHERE asignacion_anterior_id IN (${ASG_OUT_1}, ${ASG_OUT_2}, ${ASG_OTHER})
               OR asignacion_nueva_id IN (${ASG_NEW_1}, ${ASG_NEW_2}, ${ASG_OTHER});
          DELETE FROM evaluacion.asignaciones_evaluacion
            WHERE id IN (${ASG_OUT_1}, ${ASG_OUT_2}, ${ASG_NEW_1}, ${ASG_NEW_2}, ${ASG_OTHER});
          UPDATE public.protocolos SET version_actual_id = NULL
            WHERE id IN (${PROTO_WITH_HISTORY}, ${PROTO_NO_HISTORY}, ${PROTO_OTHER});
          DELETE FROM public.versiones_protocolo
            WHERE id IN (${VER_WITH_HISTORY}, ${VER_NO_HISTORY}, ${VER_OTHER});
          DELETE FROM public.protocolos
            WHERE id IN (${PROTO_WITH_HISTORY}, ${PROTO_NO_HISTORY}, ${PROTO_OTHER});
          DELETE FROM catalogos.usuarios
            WHERE id IN (${U_PREV_1}, ${U_NEW_1}, ${U_PREV_2}, ${U_NEW_2}, ${U_EXEC});
        `);
      }
    } finally {
      if (app) await app.close();
      if (dataSource?.isInitialized) await dataSource.destroy();
    }
  }, 60000);

  // ── TEST RH-01 ──────────────────────────────────────────────────────────────
  it('RH-01: protocolo con 2 reasignaciones devuelve 2 entradas ordenadas de más reciente a más antigua', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/evaluations/protocol/${PROTO_WITH_HISTORY}/reassignment-history`,
      )
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .expect(200);

    const body: any[] = res.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);

    // Orden: más reciente primero (COI tiene creado_en más reciente)
    expect(body[0].reassignmentReason).toBe('CONFLICTO_INTERES');
    expect(body[1].reassignmentReason).toBe('VENCIMIENTO');

    // Verificar campos requeridos en la entrada más reciente
    const entry = body[0];
    expect(typeof entry.id).toBe('number');
    expect(entry.assignmentId).toBe(ASG_OUT_2);
    expect(entry.previousEvaluatorId).toBe(U_PREV_2);
    expect(entry.previousEvaluatorName).toBe('Dr. Evaluador Anterior Dos');
    expect(entry.newEvaluatorId).toBe(U_NEW_2);
    expect(entry.newEvaluatorName).toBe('Dra. Evaluadora Nueva Dos');
    expect(['JURIDICO', 'SOCIEDAD_CIVIL', 'METODOLOGICO', 'SALUD']).toContain(
      entry.evaluatorProfile,
    );
    expect(entry.reassignmentReason).toBe('CONFLICTO_INTERES');
    expect(entry.reasonDescription).toBe('Declaró conflicto de interés');
    expect(entry.executedByUserId).toBe(U_EXEC);
    expect(entry.executedByUserName).toBe('Secretaria Ejecutora RH');
    expect(typeof entry.executedAt).toBe('string');
    // ISO-8601
    expect(() => new Date(entry.executedAt).toISOString()).not.toThrow();
  });

  // ── TEST RH-02 ──────────────────────────────────────────────────────────────
  it('RH-02: protocolo existente sin reasignaciones devuelve [] con 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/evaluations/protocol/${PROTO_NO_HISTORY}/reassignment-history`)
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .expect(200);

    expect(res.body).toEqual([]);
  });

  // ── TEST RH-03 ──────────────────────────────────────────────────────────────
  it('RH-03: protocolo inexistente → 404 con mensaje en español', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/evaluations/protocol/99999/reassignment-history')
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .expect(404);

    expect(res.body.message).toMatch(/protocolo/i);
  });

  // ── TEST RH-04 ──────────────────────────────────────────────────────────────
  it('RH-04: identificador inválido (no numérico) → 400', async () => {
    await request(app.getHttpServer())
      .get('/api/evaluations/protocol/abc/reassignment-history')
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .expect(400);
  });

  // ── TEST RH-05 ──────────────────────────────────────────────────────────────
  it('RH-05: el endpoint declara roles SECRETARIA y PRESIDENTE y permiso EVALUATORS_ASSIGN (metadata Reflector)', () => {
    const reflector = new Reflector();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const handler = EvaluationsController.prototype.getReassignmentHistory;

    const roles = reflector.get<string[]>(ROLES_KEY, handler);
    const permissions = reflector.get<Permission[]>(PERMISSIONS_KEY, handler);

    expect(roles).toContain('SECRETARIA');
    expect(roles).toContain('PRESIDENTE');
    expect(permissions).toContain(Permission.EVALUATORS_ASSIGN);
  });

  // ── TEST RH-06 ──────────────────────────────────────────────────────────────
  it('RH-06: rol sin permiso → 403', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/evaluations/protocol/${PROTO_WITH_HISTORY}/reassignment-history`,
      )
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .set('x-no-permission', '1')
      .expect(403);

    expect(res.body).toBeDefined();
  });

  // ── TEST RH-07 ──────────────────────────────────────────────────────────────
  it('RH-07: solo aparecen reasignaciones del protocolo pedido (aislamiento)', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/api/evaluations/protocol/${PROTO_WITH_HISTORY}/reassignment-history`,
      )
      .set('x-forwarded-for', TEST_RH_IP)
      .set('x-user-id', String(U_EXEC))
      .expect(200);

    const body: any[] = res.body;
    // El historial de PROTO_OTHER (ASG_OTHER) no debe aparecer
    const assignmentIds = body.map((e: any) => e.assignmentId);
    expect(assignmentIds).not.toContain(ASG_OTHER);
    expect(assignmentIds).toContain(ASG_OUT_1);
    expect(assignmentIds).toContain(ASG_OUT_2);
  });
});
