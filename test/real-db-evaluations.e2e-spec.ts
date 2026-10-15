/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-call */
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
import { DataSource, EntityManager } from 'typeorm';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { Permission } from '../src/shared/enums/permission.enum';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';
import { EvaluatorProfile } from '../src/shared/enums/evaluator-enums';
import { RiskProposalOrmEntity } from '../src/modules/evaluations/infrastructure/database/entities/risk-proposal.orm-entity';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';
import {
  SystemParamsService,
  SP_PLAZO_SUBSANACION_DOCUMENTAL,
  SP_PLAZO_REVISION_OFICIO,
  SP_ENTREGA_EVALUACION_DIAS,
  SP_EVALUADOR_URGENTE_UMBRAL,
  SP_PLAZO_CONDICION,
} from '../src/modules/sistema/application/services/system-params.service';
import { ProtocolDeadlineService } from '../src/modules/protocols/application/services/protocol-deadline.service';
import type { IMeetingRepositoryPort } from '../src/modules/evaluations/domain/ports/meeting-repository.port';
import { IUserRepository } from '../src/modules/auth/domain/ports/user.repository.port';
import { RoleCode } from '../src/modules/auth/domain/enums/role.enum';

describe('Real Database Production E2E Tests (ceish_test_db on localhost:3100)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let expeditaRiskId: number;
  let plenoRiskId: number;
  let saludProfileId: number;
  let metodolProfileId: number;
  let juridicoProfileId: number;
  let sociedadCivilProfileId: number;

  beforeAll(async () => {
    // 1. Guard de seguridad de Base de Datos
    const dbName = process.env.TEST_DB_NAME || 'ceish_test_db';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(
        `ABORT: Seguridad de Base de Datos violada. Base recibida: '${dbName}'. ceish_db protegida.`,
      );
    }

    process.env.DB_NAME = dbName;
    process.env.DB_HOST =
      process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
    process.env.DB_PORT =
      process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
    if (process.env.TEST_DB_USER)
      process.env.DB_USERNAME = process.env.TEST_DB_USER;
    if (process.env.TEST_DB_PASSWORD)
      process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const userId = req.headers['x-user-id']
            ? Number(req.headers['x-user-id'])
            : 901;
          req.user = {
            id: userId,
            email: `user${userId}@test.com`,
            roles: ['SECRETARIA', 'PRESIDENTE', 'EVALUADOR', 'ADMIN_TI'],
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
        generateMeetingAnnouncementPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 meeting')),
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

    // Guard de seguridad de Base de Datos: verificar current_database()
    const testDbResult = await dataSource.query('SELECT current_database();');
    const nestDbName = testDbResult[0]?.current_database;
    if (
      !nestDbName ||
      (!nestDbName.endsWith('test') &&
        !nestDbName.endsWith('test_db') &&
        !nestDbName.endsWith('_test_db'))
    ) {
      throw new Error(
        `ABORT: DataSource conectado a base no autorizada: '${nestDbName}'. Solo se permiten bases *test.`,
      );
    }

    // Configurar timeouts en sesión PostgreSQL
    await dataSource.query(`
      SET lock_timeout = '5s';
      SET statement_timeout = '5s';
      SET idle_in_transaction_session_timeout = '5s';
    `);

    // Limpiar datos previos de prueba de forma acotada
    await dataSource.query(`
      UPDATE public.protocolos SET version_actual_id = NULL WHERE id IN (991, 992, 996, 997, 998, 999);
      -- convocatorias primero: la FK convocatoria_protocolos→convocatorias es ON DELETE CASCADE
      DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE 'TEST-E2E-%' OR lugar_id IN (SELECT id FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%') OR id IN (SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id IN (991, 992, 996, 997, 998, 999));
      DELETE FROM evaluacion.convocatoria_protocolos WHERE version_id IN (991, 992, 996, 997, 998, 999) OR protocolo_id IN (991, 992, 996, 997, 998, 999) OR convocatoria_id IN (SELECT id FROM evaluacion.convocatorias WHERE lugar_id IN (SELECT id FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%'));
      DELETE FROM evaluacion.evaluacion_criterio WHERE evaluacion_id IN (SELECT id FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999)));
      DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
      DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
      DELETE FROM evaluacion.asignacion_historial WHERE asignacion_anterior_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999)) OR asignacion_nueva_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
      DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999);
      DELETE FROM public.versiones_protocolo WHERE id IN (991, 992, 996, 997, 998, 999);
      DELETE FROM public.protocolos WHERE id IN (991, 992, 996, 997, 998, 999);
      DELETE FROM catalogos.evaluadores_perfil WHERE usuario_id IN (901, 902, 903, 904, 905);
      DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904, 905);
      DELETE FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%';
    `);

    // Resolver catálogos dinámicamente sin IDs fijos ni borrados
    await dataSource.query(`
      INSERT INTO catalogos.criterios_evaluacion (tipo, descripcion)
      VALUES 
        ('EVALUACION ETICA', 'Aspectos éticos y consentimiento informado'),
        ('EVALUACION METODOLOGICA', 'Aspectos metodológicos y validez científica'),
        ('EVALUACION JURIDICA', 'Aspectos jurídicos y viabilidad legal')
      ON CONFLICT (tipo, descripcion) DO NOTHING;
    `);

    const existingProfiles = await dataSource.query(`
      SELECT id, nombre FROM catalogos.perfiles_evaluador;
    `);
    const normalize = (str: string) =>
      str
        ? str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
        : '';

    const getOrInsertProfile = async (
      namePattern: string,
      defaultName: string,
      priority: number,
    ): Promise<number> => {
      const found = existingProfiles.find((p: any) =>
        normalize(p.nombre).includes(normalize(namePattern)),
      );
      if (found) return found.id;
      const res = await dataSource.query(
        `INSERT INTO catalogos.perfiles_evaluador (nombre, activo, orden_prioridad) VALUES ($1, true, $2) RETURNING id;`,
        [defaultName, priority],
      );
      return res[0].id;
    };

    saludProfileId = await getOrInsertProfile('salud', 'Salud', 1);
    metodolProfileId = await getOrInsertProfile('metodol', 'Metodológico', 2);
    juridicoProfileId = await getOrInsertProfile('jurid', 'Jurídico', 3);
    sociedadCivilProfileId = await getOrInsertProfile(
      'sociedad',
      'Sociedad Civil',
      4,
    );

    const existingRiskLevels = await dataSource.query(`
      SELECT id, codigo, tipo_revision FROM catalogos.niveles_riesgo;
    `);
    const getOrInsertRiskLevel = async (
      codes: string[],
      reviewType: string,
      defaultCode: string,
      defaultName: string,
    ): Promise<number> => {
      const found = existingRiskLevels.find(
        (r: any) => codes.includes(r.codigo) || r.tipo_revision === reviewType,
      );
      if (found) return found.id;
      const res = await dataSource.query(
        `INSERT INTO catalogos.niveles_riesgo (codigo, nombre, tipo_revision, activo) VALUES ($1, $2, $3, true) RETURNING id;`,
        [defaultCode, defaultName, reviewType],
      );
      return res[0].id;
    };

    expeditaRiskId = await getOrInsertRiskLevel(
      ['RIESGO_MINIMO', 'MINIMO', 'SIN_RIESG'],
      'EXPEDITA',
      'RIESGO_MINIMO',
      'Investigación con riesgo mínimo',
    );
    plenoRiskId = await getOrInsertRiskLevel(
      ['RIESGO_MAYOR', 'MAYOR_MINIMO', 'RIESGO_MODERADO'],
      'PLENO',
      'RIESGO_MAYOR',
      'Investigación con riesgo mayor',
    );

    // Sembrar usuarios de prueba y vincular con perfiles reales
    await dataSource.query(`
      INSERT INTO catalogos.usuarios (id, email_institucional, nombres_completos, cedula)
      VALUES 
        (901, 'salud@test.com', 'Dr. Salud', '1111111111'),
        (902, 'metodologo@test.com', 'Dra. Metodologa', '2222222222'),
        (903, 'juridico@test.com', 'Abg. Juridico', '3333333333'),
        (904, 'lego@test.com', 'Lic. Lego', '4444444444'),
        (905, 'reemplazo@test.com', 'Dr. Reemplazo', '5555555555')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      VALUES 
        (901, ${saludProfileId}, true),
        (902, ${metodolProfileId}, true),
        (903, ${juridicoProfileId}, true),
        (904, ${sociedadCivilProfileId}, true),
        (905, ${saludProfileId}, true)
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;

      -- Protocolo 991 EXPEDITA
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
      VALUES (991, 'Protocolo Expedita Test', 901, ${expeditaRiskId}, 10, 'EXPEDITA')
      ON CONFLICT (id) DO UPDATE SET tipo_revision = 'EXPEDITA', nivel_riesgo_id = ${expeditaRiskId};
      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (991, 991, 1, 10)
      ON CONFLICT (id) DO NOTHING;
      UPDATE public.protocolos SET version_actual_id = 991 WHERE id = 991;

      -- Protocolo 992 PLENO
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
      VALUES (992, 'Protocolo Pleno Test', 901, ${plenoRiskId}, 10, 'PLENO')
      ON CONFLICT (id) DO UPDATE SET tipo_revision = 'PLENO', nivel_riesgo_id = ${plenoRiskId};
      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (992, 992, 1, 10)
      ON CONFLICT (id) DO NOTHING;
      UPDATE public.protocolos SET version_actual_id = 992 WHERE id = 992;
    `);
  }, 60000);

  afterAll(async () => {
    try {
      if (dataSource && dataSource.isInitialized) {
        await dataSource.query(`
          UPDATE public.protocolos SET version_actual_id = NULL WHERE id IN (991, 992, 996, 997, 998, 999);
          -- convocatorias primero: la FK convocatoria_protocolos→convocatorias es ON DELETE CASCADE
          DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE 'TEST-E2E-%' OR lugar_id IN (SELECT id FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%') OR id IN (SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id IN (991, 992, 996, 997, 998, 999));
          DELETE FROM evaluacion.convocatoria_protocolos WHERE version_id IN (991, 992, 996, 997, 998, 999) OR protocolo_id IN (991, 992, 996, 997, 998, 999) OR convocatoria_id IN (SELECT id FROM evaluacion.convocatorias WHERE lugar_id IN (SELECT id FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%'));
          DELETE FROM evaluacion.evaluacion_criterio WHERE evaluacion_id IN (SELECT id FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999)));
          DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
          DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
          DELETE FROM evaluacion.asignacion_historial WHERE asignacion_anterior_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999)) OR asignacion_nueva_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999));
          DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 996, 997, 998, 999);
          DELETE FROM public.versiones_protocolo WHERE id IN (991, 992, 996, 997, 998, 999);
          DELETE FROM public.protocolos WHERE id IN (991, 992, 996, 997, 998, 999);
          DELETE FROM catalogos.evaluadores_perfil WHERE usuario_id IN (901, 902, 903, 904, 905);
          DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904, 905);
          DELETE FROM evaluacion.lugares WHERE nombre LIKE 'TEST-E2E-%' OR nombre LIKE '%Sala de Consejo%' OR nombre LIKE 'TEST-N08-%';
        `);
      }
    } finally {
      if (app) await app.close();
      // app.close() triggers NestJS shutdown which calls dataSource.destroy() internally,
      // but the pool keep-alive timers can still be active when Jest checks for open handles.
      // Calling destroy() explicitly here ensures the pool is fully closed before Jest exits.
      if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    }
  });

  describe('1. Asignación por Endpoint Real y Verificación SQL de Plazos', () => {
    it('1a. POST /api/evaluations/protocols/:id/assign-peer-evaluators calcula 2026-03-12 (EXPEDITA) y 2026-03-23 (PLENO)', async () => {
      jest.useFakeTimers({
        doNotFake: [
          'nextTick',
          'setImmediate',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
        ],
      });
      jest.setSystemTime(new Date('2026-03-02T10:00:00.000Z'));
      try {
        // Asignar EXPEDITA (Protocolo 991)
        const resExpedita = await request(app.getHttpServer())
          .post('/api/evaluations/protocols/991/assign-peer-evaluators')
          .set('x-user-id', '901')
          .send({ evaluatorIds: [901, 902, 903, 904] });
        expect(resExpedita.status).toBe(201);

        // Asignar PLENO (Protocolo 992)
        const resPleno = await request(app.getHttpServer())
          .post('/api/evaluations/protocols/992/assign-peer-evaluators')
          .set('x-user-id', '901')
          .send({ evaluatorIds: [901, 902, 903, 904] });
        expect(resPleno.status).toBe(201);

        // Verificación SQL directa contra PostgreSQL
        const expeditaRows = await dataSource.query(`
        SELECT id, fecha_limite::text AS fecha_limite_str, es_asignado_anexo_10 
        FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 991 
        ORDER BY id ASC;
      `);
        expect(expeditaRows.length).toBe(4);
        expect(expeditaRows[0].fecha_limite_str).toBeNull();

        const plenoRows = await dataSource.query(`
        SELECT id, fecha_limite::text AS fecha_limite_str 
        FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 992 
        ORDER BY id ASC;
      `);
        expect(plenoRows.length).toBe(4);
        expect(plenoRows[0].fecha_limite_str).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('2. Ciclo de Entregables Separados por Endpoint Real', () => {
    it('1b. submit-risk por endpoint real actualiza propuestas_riesgo y mantiene completion-status en false', async () => {
      // Obtener asignación de Anexo 10 para 991
      const annex10Rows = await dataSource.query(`
        SELECT id, evaluador_id FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 991 AND es_asignado_anexo_10 = true
        ORDER BY id ASC LIMIT 1;
      `);
      const targetAsg = annex10Rows[0];

      // Enviar propuesta de riesgo por el endpoint real
      const resRisk = await request(app.getHttpServer())
        .post(`/api/evaluations/peer-assignments/${targetAsg.id}/submit-risk`)
        .set('x-user-id', String(targetAsg.evaluador_id))
        .send({
          riskLevelId: expeditaRiskId,
          observations: 'Evaluación preliminar de riesgo mínimo',
        });
      expect(resRisk.status).toBe(201);

      // Verificar completion-status
      const resStatus = await request(app.getHttpServer())
        .get('/api/evaluations/completion-status/991')
        .set('x-user-id', '901');
      expect(resStatus.status).toBe(200);
      expect(resStatus.body.isCompletion100Percent).toBe(false);

      // Verificación SQL: fecha_entrega_real e informe_evaluacion deben ser nulos
      const asgBefore = await dataSource.query(`
        SELECT fecha_entrega_real, informe_evaluacion, estado_id 
        FROM evaluacion.asignaciones_evaluacion 
        WHERE id = ${targetAsg.id};
      `);
      expect(asgBefore[0].fecha_entrega_real).toBeNull();
      expect(asgBefore[0].informe_evaluacion).toBeNull();

      // Enviar informe ético completo por endpoint de producción
      const resSubmit = await request(app.getHttpServer())
        .post('/api/evaluations/submit')
        .set('x-user-id', String(targetAsg.evaluador_id))
        .send({
          assignmentId: targetAsg.id,
          result: 1, // EvaluatorDictamen.APROBADO
          observations: 'Informe ético completo aprobado',
          reportPath: '/storage/evaluaciones/informe.pdf',
          annex9: {
            etica: {
              resultado: 'APROBADO',
              items: [
                {
                  itemCodigo: 'ET-1',
                  estado: 'C',
                  observaciones: 'Cumple estándares éticos',
                },
              ],
            },
            metodologia: {
              resultado: 'APROBADO',
              items: [
                {
                  itemCodigo: 'MET-1',
                  estado: 'C',
                  observaciones: 'Metodología clara',
                },
              ],
            },
            juridica: {
              resultado: 'APROBADO',
              items: [
                {
                  itemCodigo: 'JUR-1',
                  estado: 'C',
                  observaciones: 'Marco legal conforme',
                },
              ],
            },
          },
        });
      expect(resSubmit.status).toBe(201);

      // Verificación SQL: informe completo guardado y propuesta de riesgo intacta
      const asgAfter = await dataSource.query(`
        SELECT fecha_entrega_real, informe_evaluacion, estado_id 
        FROM evaluacion.asignaciones_evaluacion 
        WHERE id = ${targetAsg.id};
      `);
      expect(asgAfter[0].informe_evaluacion).toBe(
        'Informe ético completo aprobado',
      );
      expect(asgAfter[0].fecha_entrega_real).not.toBeNull();

      const proposals = await dataSource.query(`
        SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = ${targetAsg.id} AND es_vigente = true;
      `);
      expect(proposals.length).toBe(1);
      expect(proposals[0].observaciones).toBe(
        'Evaluación preliminar de riesgo mínimo',
      );
    });
  });

  describe('3. Concurrencia por Endpoints Reales con Promise.all', () => {
    it('1c. Dos evaluadores envían propuesta de riesgo simultáneamente a través del endpoint real', async () => {
      // Protocolo 998 para concurrencia
      await dataSource.query(`
        INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id)
        VALUES (998, 'Protocolo Concurrencia E2E', 901, 10)
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
        VALUES (998, 998, 1, 10)
        ON CONFLICT (id) DO NOTHING;
        UPDATE public.protocolos SET version_actual_id = 998 WHERE id = 998;
        INSERT INTO evaluacion.asignaciones_evaluacion (
          id, version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_asignacion
        ) VALUES 
          (9911, 998, 901, ${AssignmentStatus.ASSIGNED}, true, NOW()),
          (9912, 998, 902, ${AssignmentStatus.ASSIGNED}, true, NOW())
        ON CONFLICT (id) DO NOTHING;
      `);

      const origManagerSave = EntityManager.prototype.save;
      const saveSpy = jest
        .spyOn(EntityManager.prototype, 'save')
        .mockImplementation(async function (
          this: any,
          targetOrEntity: any,
          maybeEntityOrOptions?: any,
          maybeOptions?: any,
        ) {
          const result = await origManagerSave.call(
            this,
            targetOrEntity,
            maybeEntityOrOptions,
            maybeOptions,
          );
          const entity = maybeEntityOrOptions
            ? maybeEntityOrOptions
            : targetOrEntity;
          const isRiskProposal =
            entity?.constructor?.name === 'RiskProposalOrmEntity' ||
            entity instanceof RiskProposalOrmEntity ||
            targetOrEntity === RiskProposalOrmEntity;
          if (isRiskProposal) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          return result;
        });

      try {
        // Ejecutar ambos envíos en paralelo real vía HTTP supertest
        const [res1, res2] = await Promise.all([
          request(app.getHttpServer())
            .post('/api/evaluations/peer-assignments/9911/submit-risk')
            .set('x-user-id', '901')
            .send({
              riskLevelId: expeditaRiskId,
              observations: 'Propuesta Par 1',
            }),
          request(app.getHttpServer())
            .post('/api/evaluations/peer-assignments/9912/submit-risk')
            .set('x-user-id', '902')
            .send({
              riskLevelId: expeditaRiskId,
              observations: 'Propuesta Par 2',
            }),
        ]);

        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);

        // Verificaciones SQL
        const proposals9911 = await dataSource.query(`
          SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9911 AND es_vigente = true;
        `);
        const proposals9912 = await dataSource.query(`
          SELECT * FROM evaluacion.propuestas_riesgo WHERE asignacion_id = 9912 AND es_vigente = true;
        `);
        expect(proposals9911.length).toBe(1);
        expect(proposals9912.length).toBe(1);

        // Consolidación de estado del protocolo a 13 (EN EVALUACION)
        const protocol = await dataSource.query(`
          SELECT id, estado_id, nivel_riesgo_id FROM public.protocolos WHERE id = 998;
        `);
        expect(protocol[0].estado_id).toBe(13);
        expect(protocol[0].nivel_riesgo_id).toBe(expeditaRiskId);
      } finally {
        saveSpy.mockRestore();
      }
    });
  });

  describe('4. Reasignación y Herencia por Endpoints Reales', () => {
    it('1d. POST /api/evaluations/reassign persiste fecha_limite e inmutabilidad en historial', async () => {
      jest.useFakeTimers({
        doNotFake: [
          'nextTick',
          'setImmediate',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
        ],
      });
      jest.setSystemTime(new Date('2026-03-02T10:00:00.000Z'));
      try {
        // Reasignar evaluador 901 de la versión 992 por conflicto de interés
        const asgToReassign = await dataSource.query(`
          SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 992 AND evaluador_id = 901 LIMIT 1;
        `);
        expect(asgToReassign.length).toBe(1);

        const resReassign = await request(app.getHttpServer())
          .post('/api/evaluations/reassign')
          .set('x-user-id', '901')
          .send({
            currentAssignmentId: asgToReassign[0].id,
            reason: 'CONFLICTO_INTERES',
            reasonDescription: 'Conflicto voluntario declarado en prueba e2e.',
            replacementEvaluatorId: 905,
            replacementEvaluatorProfile: EvaluatorProfile.SALUD,
          });

        expect(resReassign.status).toBe(201);

        // Verificar SQL: asignación previa pasa a estado 27 (REASIGNED_COI) y nueva asignación creada
        const oldAsg = await dataSource.query(`
          SELECT id, estado_id FROM evaluacion.asignaciones_evaluacion WHERE id = ${asgToReassign[0].id};
        `);
        expect(oldAsg[0].estado_id).toBe(AssignmentStatus.REASIGNED_COI);

        const newAsg = await dataSource.query(`
          SELECT id, evaluador_id, fecha_limite::text AS fecha_limite_str, estado_id 
          FROM evaluacion.asignaciones_evaluacion 
          WHERE version_id = 992 AND evaluador_id = 905;
        `);
        expect(newAsg.length).toBe(1);
        expect(newAsg[0].fecha_limite_str).toBeNull();

        // Verificar registro en historial
        const history = await dataSource.query(`
          SELECT * FROM evaluacion.asignacion_historial WHERE asignacion_anterior_id = ${asgToReassign[0].id};
        `);
        expect(history.length).toBe(1);
        expect(history[0].motivo).toBe('CONFLICTO_INTERES');
      } finally {
        jest.useRealTimers();
      }
    });

    it('1e. Reasignación falla con 400 cuando el evaluador de reemplazo ya está asignado al protocolo', async () => {
      // Intentar reasignar a 902 en protocolo 992 donde 902 ya está asignado
      const asgSalud = await dataSource.query(`
        SELECT id FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 992 AND evaluador_id = 905 AND estado_id = ${AssignmentStatus.ASSIGNED} 
        LIMIT 1;
      `);
      expect(asgSalud.length).toBe(1);

      const res = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('x-user-id', '901')
        .send({
          currentAssignmentId: asgSalud[0].id,
          reason: 'CONFLICTO_INTERES',
          reasonDescription: 'Test de evaluador duplicado',
          replacementEvaluatorId: 902,
          replacementEvaluatorProfile: EvaluatorProfile.METODOLOGICO,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'El evaluador de reemplazo ya se encuentra asignado a este protocolo.',
      );
    });

    it('1f. Reasignación falla con 400 cuando el evaluador de reemplazo no posee el perfil requerido activo', async () => {
      // Evaluador 903 tiene perfil JURÍDICO. Evaluador 901 solo tiene perfil SALUD y ya no está activo en 992.
      const asgJuridico = await dataSource.query(`
        SELECT id FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 992 AND evaluador_id = 903 
        LIMIT 1;
      `);
      expect(asgJuridico.length).toBe(1);

      const res = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('x-user-id', '901')
        .send({
          currentAssignmentId: asgJuridico[0].id,
          reason: 'CONFLICTO_INTERES',
          reasonDescription: 'Test de perfil incompatible',
          replacementEvaluatorId: 901,
          replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        'El evaluador de reemplazo no posee el perfil requerido activo.',
      );
    });

    it('1g. Escenario completo de reasignación con Anexo 10: transferencia de flag, exclusión de saliente y consolidación a 13', async () => {
      // 1. Sembrar Protocolo 999 con 4 evaluadores (2 de Anexo 10: 901 y 902)
      await dataSource.query(`
        INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id)
        VALUES (999, 'Protocolo Reasignacion Anexo 10 E2E', 901, 10)
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
        VALUES (999, 999, 1, 10)
        ON CONFLICT (id) DO NOTHING;
        UPDATE public.protocolos SET version_actual_id = 999 WHERE id = 999;
        INSERT INTO evaluacion.asignaciones_evaluacion (
          id, version_id, evaluador_id, perfil_id, estado_id, es_asignado_anexo_10, fecha_asignacion, fecha_limite
        ) VALUES 
          (9991, 999, 901, ${saludProfileId}, ${AssignmentStatus.ASSIGNED}, true, NOW(), '2026-03-23'),
          (9992, 999, 902, ${metodolProfileId}, ${AssignmentStatus.ASSIGNED}, true, NOW(), '2026-03-23'),
          (9993, 999, 903, ${juridicoProfileId}, ${AssignmentStatus.ASSIGNED}, false, NOW(), '2026-03-23'),
          (9994, 999, 904, ${sociedadCivilProfileId}, ${AssignmentStatus.ASSIGNED}, false, NOW(), '2026-03-23')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 2. Reasignar evaluador 901 (Anexo 10) a evaluador 905 (perfil Salud)
      const resReassign = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('x-user-id', '901')
        .send({
          currentAssignmentId: 9991,
          reason: 'CONFLICTO_INTERES',
          reasonDescription: 'Conflicto de interés evaluador Anexo 10',
          replacementEvaluatorId: 905,
          replacementEvaluatorProfile: EvaluatorProfile.SALUD,
        });
      expect(resReassign.status).toBe(201);

      // 3. Verificaciones SQL de estados y herencia de Anexo 10
      const oldAsgRows = await dataSource.query(`
        SELECT id, estado_id, es_asignado_anexo_10 FROM evaluacion.asignaciones_evaluacion WHERE id = 9991;
      `);
      expect(oldAsgRows[0].estado_id).toBe(AssignmentStatus.REASIGNED_COI);

      const newAsgRows = await dataSource.query(`
        SELECT id, evaluador_id, estado_id, es_asignado_anexo_10 
        FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 999 AND evaluador_id = 905 AND estado_id = ${AssignmentStatus.ASSIGNED};
      `);
      expect(newAsgRows.length).toBe(1);
      expect(newAsgRows[0].es_asignado_anexo_10).toBe(true);
      const newAsgId = newAsgRows[0].id;

      // 4. GET /api/evaluations/peer-assignments/my-pending para saliente (901) -> excluye asignación saliente
      const resPendingSaliente = await request(app.getHttpServer())
        .get('/api/evaluations/peer-assignments/my-pending')
        .set('x-user-id', '901');
      expect(resPendingSaliente.status).toBe(200);
      const pendingSaliente999 = (resPendingSaliente.body || []).filter(
        (a: any) => a.protocolId === 999 || a.id === 9991,
      );
      expect(pendingSaliente999.length).toBe(0);

      // 5. GET /api/evaluations/peer-assignments/my-pending para entrante (905) -> recibe la asignación
      const resPendingEntrante = await request(app.getHttpServer())
        .get('/api/evaluations/peer-assignments/my-pending')
        .set('x-user-id', '905');
      expect(resPendingEntrante.status).toBe(200);
      const pendingEntrante999 = (resPendingEntrante.body || []).filter(
        (a: any) => a.protocolId === 999 || a.id === newAsgId,
      );
      expect(pendingEntrante999.length).toBe(1);
      expect(pendingEntrante999[0].id).toBe(newAsgId);

      // 6. POST /api/evaluations/peer-assignments/9991/submit-risk para saliente -> 400 Bad Request
      const resSubmitSaliente = await request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/9991/submit-risk')
        .set('x-user-id', '901')
        .send({
          riskLevelId: expeditaRiskId,
          observations: 'Intento de envío sobre asignación reasignada',
        });
      expect(resSubmitSaliente.status).toBe(400);

      // 7. Enviar propuesta por evaluador entrante 905
      const resSubmitEntrante = await request(app.getHttpServer())
        .post(`/api/evaluations/peer-assignments/${newAsgId}/submit-risk`)
        .set('x-user-id', '905')
        .send({
          riskLevelId: expeditaRiskId,
          observations: 'Propuesta de riesgo por evaluador reemplazo 905',
        });
      expect(resSubmitEntrante.status).toBe(201);

      // Protocolo aún no debe consolidar a 13 (falta evaluador 902)
      const protoPartial = await dataSource.query(`
        SELECT estado_id FROM public.protocolos WHERE id = 999;
      `);
      expect(protoPartial[0].estado_id).toBe(10);

      // 8. Enviar propuesta por evaluador par 902
      const resSubmit902 = await request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/9992/submit-risk')
        .set('x-user-id', '902')
        .send({
          riskLevelId: expeditaRiskId,
          observations: 'Propuesta de riesgo por evaluador par 902',
        });
      expect(resSubmit902.status).toBe(201);

      // 9. Consolidación a estado 13 (EN EVALUACION) y verificación de conteo de asignaciones Anexo 10
      const protoFinal = await dataSource.query(`
        SELECT estado_id, nivel_riesgo_id FROM public.protocolos WHERE id = 999;
      `);
      expect(protoFinal[0].estado_id).toBe(13);
      expect(protoFinal[0].nivel_riesgo_id).toBe(expeditaRiskId);

      const activeAnnex10Rows = await dataSource.query(`
        SELECT id, evaluador_id, estado_id FROM evaluacion.asignaciones_evaluacion 
        WHERE version_id = 999 AND es_asignado_anexo_10 = true AND estado_id IN (${AssignmentStatus.ASSIGNED}, ${AssignmentStatus.SUGGESTED});
      `);
      expect(activeAnnex10Rows.length).toBe(2);
    });
  });

  describe('6. Propagación de fecha_limite a asignaciones ASIGNADO al crear convocatoria (TSK-009-N03/N05, TSK-002-N05)', () => {
    it('6a. POST /api/evaluations/meetings propaga evalSubmissionDeadline a asignaciones ASIGNADO de las versiones agendadas', async () => {
      // Insertar asignación ASIGNADO para versión 991, evaluador 905 (aún no asignado a 991)
      await dataSource.query(`
        INSERT INTO evaluacion.asignaciones_evaluacion (
          version_id, evaluador_id, estado_id, es_asignado_anexo_10, fecha_asignacion
        ) VALUES (991, 905, ${AssignmentStatus.ASSIGNED}, false, NOW());
      `);

      const meetingPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-10-08T09:00:00.000Z',
        evalSubmissionDeadline: '2026-10-14T17:00:00.000Z', // 12:00 ECT = 17:00 UTC → '2026-10-14'
        protocolVersionIds: [991],
      };

      let meetingId: string | undefined;
      try {
        const resCreate = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send(meetingPayload);

        expect([200, 201]).toContain(resCreate.status);
        meetingId = (resCreate.body.data?.id ?? resCreate.body.id) as string;

        // Verificar SQL: todas las asignaciones ASIGNADO de versión 991 tienen fecha_limite = '2026-10-14'
        const rows = await dataSource.query(`
          SELECT id, fecha_limite::text AS fecha_limite_str
          FROM evaluacion.asignaciones_evaluacion
          WHERE version_id = 991
            AND estado_id = ${AssignmentStatus.ASSIGNED}
          ORDER BY id ASC;
        `);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          expect(row.fecha_limite_str).toBe('2026-10-14');
        }
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [meetingId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
      }
    });

    it('6b. asignar via endpoint → fecha_limite NULL; POST /meetings → fecha_limite propagado (RF-12.7(a)+(b))', async () => {
      // Sembrar protocolo 997 limpio para este test
      await dataSource.query(`
        INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
        VALUES (997, 'Protocolo B2 Deadline Test', 901, 10, 'PLENO')
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
        VALUES (997, 997, 1, 10)
        ON CONFLICT (id) DO NOTHING;
        UPDATE public.protocolos SET version_actual_id = 997 WHERE id = 997;
        DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 997;
      `);

      // 1. Asignar evaluadores vía endpoint legacy
      let meetingId: string | undefined;
      try {
        const resAssign = await request(app.getHttpServer())
          .post('/api/evaluations/protocols/997/assign-peer-evaluators')
          .set('x-user-id', '901')
          .send({ evaluatorIds: [901, 902, 903, 904] });
        expect(resAssign.status).toBe(201);

        // 2. Verificar que fecha_limite es NULL en la BD (RF-12.7(a))
        const assignedRows = await dataSource.query(`
          SELECT id, fecha_limite::text AS fecha_limite_str
          FROM evaluacion.asignaciones_evaluacion
          WHERE version_id = 997 AND estado_id = ${AssignmentStatus.ASSIGNED}
          ORDER BY id ASC;
        `);
        expect(assignedRows.length).toBe(4);
        for (const row of assignedRows) {
          expect(row.fecha_limite_str).toBeNull();
        }

        // 3. Crear convocatoria que incluye versión 997
        const resMeeting = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2026-10-20T09:00:00.000Z',
            evalSubmissionDeadline: '2026-10-24T17:00:00.000Z',
            protocolVersionIds: [997],
          });
        expect([200, 201]).toContain(resMeeting.status);
        meetingId = (resMeeting.body.data?.id ?? resMeeting.body.id) as string;

        // 4. Verificar que fecha_limite se propagó a las asignaciones ASIGNADO (RF-12.7(b))
        const updatedRows = await dataSource.query(`
          SELECT id, fecha_limite::text AS fecha_limite_str
          FROM evaluacion.asignaciones_evaluacion
          WHERE version_id = 997 AND estado_id = ${AssignmentStatus.ASSIGNED}
          ORDER BY id ASC;
        `);
        expect(updatedRows.length).toBe(4);
        for (const row of updatedRows) {
          expect(row.fecha_limite_str).toBe('2026-10-24');
        }
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [meetingId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
      }
    });
  });

  describe('7. RF-12.7(a)+(e): estadoConvocatoria y herencia de deadline (TSK-002-N04, TSK-002-N02)', () => {
    let convocatoriaId996: string;

    beforeAll(async () => {
      await dataSource.query(`
        INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
        VALUES (996, 'Protocolo estadoConvocatoria Test', 901, 10, 'PLENO')
        ON CONFLICT (id) DO NOTHING;
        INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
        VALUES (996, 996, 1, 10)
        ON CONFLICT (id) DO NOTHING;
        UPDATE public.protocolos SET version_actual_id = 996 WHERE id = 996;
        DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 996;
      `);
      const resAssign = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/996/assign-peer-evaluators')
        .set('x-user-id', '901')
        .send({ evaluatorIds: [901, 902, 903, 904] });
      if (resAssign.status !== 201) {
        throw new Error(
          `Seed 996: asignación falló ${resAssign.status} ${JSON.stringify(resAssign.body)}`,
        );
      }
    }, 30000);

    afterAll(async () => {
      if (dataSource && dataSource.isInitialized) {
        if (convocatoriaId996) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId996],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId996],
          );
        }
        await dataSource.query(`
          UPDATE public.protocolos SET version_actual_id = NULL WHERE id = 996;
          DELETE FROM evaluacion.convocatoria_protocolos WHERE version_id = 996;
          DELETE FROM evaluacion.asignacion_historial
            WHERE asignacion_anterior_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 996)
               OR asignacion_nueva_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 996);
          DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id = 996;
          DELETE FROM public.versiones_protocolo WHERE id = 996;
          DELETE FROM public.protocolos WHERE id = 996;
        `);
      }
    });

    it('7a. GET /submit/protocol/996 sin convocatoria → estadoConvocatoria "Pendiente de convocatoria"', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/submit/protocol/996')
        .set('x-user-id', '901');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      for (const assignment of res.body as any[]) {
        expect(assignment.estadoConvocatoria).toBe('Pendiente de convocatoria');
        expect(assignment.assignedAt).toBeDefined();
      }
    });

    it('7b. POST /meetings con versión 996 → GET /submit/protocol/996 → estadoConvocatoria "Con plazo asignado"', async () => {
      const resMeeting = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .set('x-user-id', '901')
        .send({
          sessionType: 'ORDINARIA',
          meetingDate: '2026-11-03T09:00:00.000Z',
          evalSubmissionDeadline: '2026-11-10T17:00:00.000Z',
          protocolVersionIds: [996],
        });
      if (![200, 201].includes(resMeeting.status)) {
        throw new Error(
          `POST /meetings 996 falló: ${resMeeting.status} ${JSON.stringify(resMeeting.body)}`,
        );
      }
      convocatoriaId996 = resMeeting.body.id ?? resMeeting.body.data?.id;
      expect(convocatoriaId996).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/api/evaluations/submit/protocol/996')
        .set('x-user-id', '901');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as any[]).length).toBeGreaterThan(0);
      for (const assignment of res.body as any[]) {
        expect(assignment.estadoConvocatoria).toBe('Con plazo asignado');
      }
    });

    it('7c. Reasignar con convocatoria PROGRAMADA → nueva asignación hereda fecha_limite "2026-11-10" (RF-12.7(e))', async () => {
      const asgRows = await dataSource.query(`
        SELECT id FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = 996 AND evaluador_id = 901 AND estado_id = ${AssignmentStatus.ASSIGNED}
        LIMIT 1;
      `);
      if (!asgRows.length) {
        throw new Error(
          'No se encontró asignación ASSIGNED de 901 en versión 996 para 7c',
        );
      }

      const resReassign = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('x-user-id', '901')
        .send({
          currentAssignmentId: asgRows[0].id,
          reason: 'CONFLICTO_INTERES',
          reasonDescription:
            'Test 7c: herencia de deadline con convocatoria PROGRAMADA.',
          replacementEvaluatorId: 905,
          replacementEvaluatorProfile: EvaluatorProfile.SALUD,
        });
      expect(resReassign.status).toBe(201);

      const newAsg = await dataSource.query(`
        SELECT fecha_limite::text AS fecha_limite_str
        FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = 996 AND evaluador_id = 905 AND estado_id = ${AssignmentStatus.ASSIGNED}
        LIMIT 1;
      `);
      expect(newAsg.length).toBe(1);
      expect(newAsg[0].fecha_limite_str).toBe('2026-11-10');
    });

    it('7d. Convocatoria CANCELADA → reasignar → fecha_limite NULL (RF-12.7(e) caso negativo)', async () => {
      if (!convocatoriaId996) {
        throw new Error('convocatoriaId996 no disponible; test 7b falló.');
      }
      // Cancelar la convocatoria por SQL (excluye PROGRAMADA/EN_CURSO del filtro de herencia)
      await dataSource.query(
        `UPDATE evaluacion.convocatorias SET estado = 'CANCELADA' WHERE id = $1`,
        [convocatoriaId996],
      );

      // 905 quedó ASSIGNED en 7c; 901 quedó REASIGNED_COI (no activo), por lo que puede volver como reemplazo
      const asgRows = await dataSource.query(`
        SELECT id FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = 996 AND evaluador_id = 905 AND estado_id = ${AssignmentStatus.ASSIGNED}
        LIMIT 1;
      `);
      if (!asgRows.length) {
        throw new Error(
          'No se encontró asignación ASSIGNED de 905 en versión 996 para 7d',
        );
      }

      const resReassign = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('x-user-id', '901')
        .send({
          currentAssignmentId: asgRows[0].id,
          reason: 'CONFLICTO_INTERES',
          reasonDescription:
            'Test 7d: sin herencia cuando convocatoria CANCELADA.',
          replacementEvaluatorId: 901,
          replacementEvaluatorProfile: EvaluatorProfile.SALUD,
        });
      expect(resReassign.status).toBe(201);

      const newAsg = await dataSource.query(`
        SELECT fecha_limite::text AS fecha_limite_str
        FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = 996 AND evaluador_id = 901 AND estado_id = ${AssignmentStatus.ASSIGNED}
        LIMIT 1;
      `);
      expect(newAsg.length).toBe(1);
      expect(newAsg[0].fecha_limite_str).toBeNull();
    });
  });

  describe('5. Pruebas de Humo de Places y Calls por Supertest', () => {
    let createdPlaceId: string;

    it('5a. CRUD de /api/evaluations/meetings/places y GET /api/evaluations/calls/places', async () => {
      // Create place
      const resCreate = await request(app.getHttpServer())
        .post('/api/evaluations/meetings/places')
        .set('x-user-id', '901')
        .send({
          name: 'TEST-E2E-Sala de Consejo Politécnico',
          location: 'Edificio Central ESPOCH Piso 2',
          esVirtual: false,
          isActive: true,
        });
      expect(resCreate.status).toBe(201);
      createdPlaceId = resCreate.body.id;
      expect(createdPlaceId).toBeDefined();

      // List places via meetings/places
      const resList = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/places')
        .set('x-user-id', '901');
      expect(resList.status).toBe(200);
      expect(Array.isArray(resList.body)).toBe(true);

      // List places via calls/places (deprecated endpoint)
      const resCallsList = await request(app.getHttpServer())
        .get('/api/evaluations/calls/places')
        .set('x-user-id', '901');
      expect(resCallsList.status).toBe(200);

      // Get place by ID
      const resGet = await request(app.getHttpServer())
        .get(`/api/evaluations/meetings/places/${createdPlaceId}`)
        .set('x-user-id', '901');
      expect(resGet.status).toBe(200);

      // Update place
      const resPatch = await request(app.getHttpServer())
        .patch(`/api/evaluations/meetings/places/${createdPlaceId}`)
        .set('x-user-id', '901')
        .send({
          name: 'TEST-E2E-Sala de Consejo Actualizada',
        });
      expect(resPatch.status).toBe(200);

      // Delete place
      const resDel = await request(app.getHttpServer())
        .delete(`/api/evaluations/meetings/places/${createdPlaceId}`)
        .set('x-user-id', '901');
      expect(resDel.status).toBe(200);
    });

    it('5b. Smoke tests para Meetings: GET /meetings, GET /meetings/pending-protocols, POST /meetings, GET /meetings/:id', async () => {
      // Create a place to attach meeting to
      const resPlace = await request(app.getHttpServer())
        .post('/api/evaluations/meetings/places')
        .set('x-user-id', '901')
        .send({
          name: 'TEST-E2E-Sala para Reunion Test',
          location: 'Edificio Central ESPOCH Piso 2',
          esVirtual: false,
          isActive: true,
        });
      const placeId = resPlace.body.id;

      // 1. GET /api/evaluations/meetings
      const resMeetings = await request(app.getHttpServer())
        .get('/api/evaluations/meetings')
        .set('x-user-id', '901');
      expect(resMeetings.status).toBe(200);
      expect(
        Array.isArray(
          resMeetings.body.data || resMeetings.body.items || resMeetings.body,
        ),
      ).toBe(true);

      // 2. GET /api/evaluations/meetings/pending-protocols
      const resPending = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/pending-protocols')
        .set('x-user-id', '901');
      expect(resPending.status).toBe(200);
      expect(Array.isArray(resPending.body)).toBe(true);

      // 3. POST /api/evaluations/meetings
      const resCreateMeeting = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .set('x-user-id', '901')
        .send({
          sessionType: 'ORDINARIA',
          meetingDate: '2026-03-20T15:00:00.000Z',
          evalSubmissionDeadline: '2026-03-24T17:00:00.000Z', // +2 días hábiles a las 12:00 ECT
          locationId: placeId,
          protocolVersionIds: [991],
        });
      expect([200, 201]).toContain(resCreateMeeting.status);
      const createdMeetingId =
        resCreateMeeting.body.id || resCreateMeeting.body.data?.id;
      expect(createdMeetingId).toBeDefined();

      // Verificación SQL directa en PostgreSQL de la fila creada
      const meetingRows = await dataSource.query(`
        SELECT id, numero_convocatoria, tipo_session, estado 
        FROM evaluacion.convocatorias 
        WHERE id = '${createdMeetingId}';
      `);
      expect(meetingRows.length).toBe(1);
      expect(meetingRows[0].tipo_session).toBe('ORDINARIA');
      expect(meetingRows[0].estado).toBe('PROGRAMADA');

      // 4. GET /api/evaluations/meetings/:id
      const resGetMeeting = await request(app.getHttpServer())
        .get(`/api/evaluations/meetings/${createdMeetingId}`)
        .set('x-user-id', '901');
      expect(resGetMeeting.status).toBe(200);
      expect(resGetMeeting.body.id || resGetMeeting.body.data?.id).toBe(
        createdMeetingId,
      );

      // Cleanup
      if (placeId) {
        await request(app.getHttpServer())
          .delete(`/api/evaluations/meetings/places/${placeId}`)
          .set('x-user-id', '901');
      }
    });

    it('5c. Smoke tests para Calls (deprecated): GET /calls, GET /calls/protocols/pending, POST /calls, GET /calls/:id, GET /calls/:id/protocols, GET /calls/places', async () => {
      // Create a place to attach call to
      const resPlace = await request(app.getHttpServer())
        .post('/api/evaluations/calls/places')
        .set('x-user-id', '901')
        .send({
          name: 'TEST-E2E-Sala para Convocatoria Test',
          location: 'Edificio Central ESPOCH Sala 3',
          esVirtual: false,
          isActive: true,
        });
      expect(resPlace.status).toBe(201);
      const placeId = resPlace.body.id;

      // 1. GET /api/evaluations/calls
      const resCalls = await request(app.getHttpServer())
        .get('/api/evaluations/calls')
        .set('x-user-id', '901');
      expect(resCalls.status).toBe(200);
      expect(Array.isArray(resCalls.body)).toBe(true);

      // 2. GET /api/evaluations/calls/protocols/pending
      const resPendingCalls = await request(app.getHttpServer())
        .get('/api/evaluations/calls/protocols/pending')
        .set('x-user-id', '901');
      expect(resPendingCalls.status).toBe(200);
      expect(Array.isArray(resPendingCalls.body)).toBe(true);

      // 3. POST /api/evaluations/calls
      const resCreateCall = await request(app.getHttpServer())
        .post('/api/evaluations/calls')
        .set('x-user-id', '901')
        .send({
          date: '2026-04-15',
          time: '10:00',
          placeId,
          protocolVersionIds: [991],
          sessionType: 'ORDINARIA',
        });
      if (![200, 201].includes(resCreateCall.status)) {
        throw new Error(
          `POST /api/evaluations/calls → ${resCreateCall.status}: ${JSON.stringify(resCreateCall.body)}`,
        );
      }
      const createdCallId: string | undefined = resCreateCall.body?.id;
      if (!createdCallId) {
        throw new Error(
          `POST /api/evaluations/calls returned no id — status ${resCreateCall.status} body ${JSON.stringify(resCreateCall.body)}`,
        );
      }

      // 4. GET /api/evaluations/calls/:id
      const resGetCall = await request(app.getHttpServer())
        .get(`/api/evaluations/calls/${createdCallId}`)
        .set('x-user-id', '901');
      expect(resGetCall.status).toBe(200);
      expect(resGetCall.body.id).toBe(createdCallId);

      // 5. GET /api/evaluations/calls/:id/protocols
      const resGetCallProtocols = await request(app.getHttpServer())
        .get(`/api/evaluations/calls/${createdCallId}/protocols`)
        .set('x-user-id', '901');
      expect(resGetCallProtocols.status).toBe(200);
      expect(Array.isArray(resGetCallProtocols.body)).toBe(true);

      // 6. GET /api/evaluations/calls/places
      const resCallsPlaces = await request(app.getHttpServer())
        .get('/api/evaluations/calls/places')
        .set('x-user-id', '901');
      expect(resCallsPlaces.status).toBe(200);
      expect(Array.isArray(resCallsPlaces.body)).toBe(true);

      // Cleanup
      if (placeId) {
        await request(app.getHttpServer())
          .delete(`/api/evaluations/calls/places/${placeId}`)
          .set('x-user-id', '901');
      }
    });
  });

  describe('9. Convocatoria delivery params snapshot (TSK-009-N04)', () => {
    it('9a. Crear convocatoria persiste entregaDiasHabiles=2 y HoraCorte="12:00" con defaults', async () => {
      const systemParams = app.get(SystemParamsService);
      await systemParams.refresh();

      let meetingId: string | undefined;
      try {
        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2026-11-10T09:00:00.000Z',
            protocolVersionIds: [991],
          });
        expect([200, 201]).toContain(res.status);
        meetingId = (res.body.data?.id ?? res.body.id) as string;
        expect(meetingId).toBeTruthy();

        const rows: Array<{
          entrega_evaluacion_dias_habiles_tras_reunion: number;
          entrega_evaluacion_hora_corte: string;
        }> = await dataSource.query(
          `SELECT entrega_evaluacion_dias_habiles_tras_reunion,
                  entrega_evaluacion_hora_corte
           FROM evaluacion.convocatorias WHERE id = $1`,
          [meetingId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].entrega_evaluacion_dias_habiles_tras_reunion).toBe(2);
        expect(rows[0].entrega_evaluacion_hora_corte).toBe('12:00');
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [meetingId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
      }
    });

    it('9b. UPDATE entrega a 3, refresh(), crear convocatoria, snapshot=3 y fecha usa 3 días hábiles; restaura 2', async () => {
      const systemParams = app.get(SystemParamsService);
      let meetingId: string | undefined;
      try {
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='3' WHERE clave='entrega_evaluacion_dias_habiles_tras_reunion'`,
        );
        await systemParams.refresh();
        expect(systemParams.get(SP_ENTREGA_EVALUACION_DIAS)).toBe(3);

        // Lunes 2026-11-16 + 3 días hábiles = Jueves 2026-11-19 a las 12:00 ECT (17:00 UTC)
        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2026-11-16T09:00:00.000Z',
            protocolVersionIds: [991],
          });
        expect([200, 201]).toContain(res.status);
        meetingId = (res.body.data?.id ?? res.body.id) as string;
        expect(meetingId).toBeTruthy();

        const rows: Array<{
          entrega_evaluacion_dias_habiles_tras_reunion: number;
          entrega_evaluacion_hora_corte: string;
          fecha_entrega_evaluacion: string;
        }> = await dataSource.query(
          `SELECT entrega_evaluacion_dias_habiles_tras_reunion,
                  entrega_evaluacion_hora_corte,
                  fecha_entrega_evaluacion
           FROM evaluacion.convocatorias WHERE id = $1`,
          [meetingId],
        );
        expect(rows.length).toBe(1);
        expect(rows[0].entrega_evaluacion_dias_habiles_tras_reunion).toBe(3);
        expect(rows[0].entrega_evaluacion_hora_corte).toBe('12:00');

        // Verificar fecha: Lunes 2026-11-16 + 3 días hábiles = Jueves 2026-11-19 en ECT
        const fechaEntrega = new Date(rows[0].fecha_entrega_evaluacion);
        const fechaECT = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Guayaquil',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(fechaEntrega);
        expect(fechaECT).toBe('2026-11-19');
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [meetingId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='2' WHERE clave='entrega_evaluacion_dias_habiles_tras_reunion'`,
        );
        await systemParams.refresh();
        expect(systemParams.get(SP_ENTREGA_EVALUACION_DIAS)).toBe(2);
      }
    });
  });

  describe('8. SystemParamsService — parámetros desde BD (TSK-015-N03)', () => {
    it('8a. refresh() carga los 4 parámetros sembrados; get() devuelve valor de BD', async () => {
      const systemParams = app.get(SystemParamsService);
      await systemParams.refresh();

      expect(systemParams.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(30);
      expect(systemParams.get(SP_PLAZO_REVISION_OFICIO)).toBe(8);
      expect(systemParams.get(SP_ENTREGA_EVALUACION_DIAS)).toBe(2);
      expect(systemParams.get(SP_EVALUADOR_URGENTE_UMBRAL)).toBe(2);
    });

    it('8b. UPDATE plazo_subsanacion a 5, refresh(), calcula 5 días hábiles, restaura 30', async () => {
      const systemParams = app.get(SystemParamsService);
      const deadlineService = app.get(ProtocolDeadlineService);
      try {
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='5' WHERE clave='plazo_subsanacion_documental_dias'`,
        );
        await systemParams.refresh();

        // Lunes 2026-10-12 + 5 días hábiles = Lunes 2026-10-19
        const fixedDate = new Date('2026-10-12T12:00:00.000Z');
        const result = deadlineService.calculateSubmissionDeadline(fixedDate);
        expect(result.getUTCFullYear()).toBe(2026);
        expect(result.getUTCMonth()).toBe(9); // October (0-indexed)
        expect(result.getUTCDate()).toBe(19);
      } finally {
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='30' WHERE clave='plazo_subsanacion_documental_dias'`,
        );
        await systemParams.refresh();
      }
    });

    it('8c. UPDATE plazo_condicion_dias a 20, refresh(), calcula 20 días hábiles, restaura 30', async () => {
      const systemParams = app.get(SystemParamsService);
      const deadlineService = app.get(ProtocolDeadlineService);
      try {
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='20' WHERE clave='plazo_condicion_dias'`,
        );
        await systemParams.refresh();
        expect(systemParams.get(SP_PLAZO_CONDICION)).toBe(20);

        // Lunes 2026-03-02 + 20 días hábiles = Lunes 2026-03-30
        const fixedDate = new Date('2026-03-02T12:00:00.000Z');
        const result = deadlineService.calculateSubsanacionDeadline(fixedDate);
        expect(result.getUTCFullYear()).toBe(2026);
        expect(result.getUTCMonth()).toBe(2); // March (0-indexed)
        expect(result.getUTCDate()).toBe(30);
      } finally {
        await dataSource.query(
          `UPDATE sistema.parametros_sistema SET valor='30' WHERE clave='plazo_condicion_dias'`,
        );
        await systemParams.refresh();
      }
    });
  });

  describe('10. Advertencia de plazo normativo al crear convocatoria (TSK-009-N06)', () => {
    it('10a. Protocolo EXPEDITA con plazo normativo vencido genera ADVERTENCIA_PLAZO_NORMATIVO', async () => {
      // Protocolo 993: EXPEDITA, recepcion 2025-01-01 -> plazo norm. ~2025-03-05 (45 dias habiles)
      // Meeting 2026-12-07 -> evalDeadline 2026-12-09 >> plazo normativo -> ADVERTENCIA
      let meetingId: string | undefined;
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
          VALUES (993, 'Test Normativo Vencido', 901, ${expeditaRiskId}, 10, 'EXPEDITA')
          ON CONFLICT (id) DO UPDATE SET tipo_revision = 'EXPEDITA', nivel_riesgo_id = ${expeditaRiskId};
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (993, 993, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = 993 WHERE id = 993;
        `);
        await dataSource.query(
          `INSERT INTO recepcion.recepciones (version_id, fecha_recepcion, estado_id)
           VALUES (993, '2025-01-01 00:00:00', 10)
           ON CONFLICT (version_id) DO UPDATE SET fecha_recepcion = '2025-01-01 00:00:00'`,
        );

        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2026-12-07T14:00:00.000Z',
            protocolVersionIds: [993],
          });
        expect([200, 201]).toContain(res.status);
        meetingId = (res.body.data?.id ?? res.body.id) as string;
        expect(meetingId).toBeTruthy();

        const advertencias: string[] = res.body.advertencias ?? [];
        const normativaWarning = advertencias.find((w: string) =>
          w.includes('ADVERTENCIA_PLAZO_NORMATIVO'),
        );
        expect(normativaWarning).toBeDefined();
        expect(normativaWarning).toContain('993');
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
        await dataSource.query(`
          DELETE FROM recepcion.recepciones WHERE version_id = 993;
          UPDATE public.protocolos SET version_actual_id = NULL WHERE id = 993;
          DELETE FROM public.versiones_protocolo WHERE id = 993;
          DELETE FROM public.protocolos WHERE id = 993;
        `);
      }
    });

    it('10b. Protocolo EXPEDITA con plazo normativo vigente no genera advertencia normativa', async () => {
      // Protocolo 994: EXPEDITA, recepcion 2026-12-01 -> plazo norm. ~2027-02-02 (45 dias habiles)
      // Meeting 2026-12-14 -> evalDeadline 2026-12-16 << plazo normativo -> SIN advertencia
      let meetingId: string | undefined;
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
          VALUES (994, 'Test Normativo Vigente', 901, ${expeditaRiskId}, 10, 'EXPEDITA')
          ON CONFLICT (id) DO UPDATE SET tipo_revision = 'EXPEDITA', nivel_riesgo_id = ${expeditaRiskId};
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (994, 994, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = 994 WHERE id = 994;
        `);
        await dataSource.query(
          `INSERT INTO recepcion.recepciones (version_id, fecha_recepcion, estado_id)
           VALUES (994, '2026-12-01 00:00:00', 10)
           ON CONFLICT (version_id) DO UPDATE SET fecha_recepcion = '2026-12-01 00:00:00'`,
        );

        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .set('x-user-id', '901')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: '2026-12-14T14:00:00.000Z',
            protocolVersionIds: [994],
          });
        expect([200, 201]).toContain(res.status);
        meetingId = (res.body.data?.id ?? res.body.id) as string;
        expect(meetingId).toBeTruthy();

        const advertencias: string[] = res.body.advertencias ?? [];
        const normativaWarning = advertencias.find((w: string) =>
          w.includes('ADVERTENCIA_PLAZO_NORMATIVO'),
        );
        expect(normativaWarning).toBeUndefined();
      } finally {
        if (meetingId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [meetingId],
          );
        }
        await dataSource.query(`
          DELETE FROM recepcion.recepciones WHERE version_id = 994;
          UPDATE public.protocolos SET version_actual_id = NULL WHERE id = 994;
          DELETE FROM public.versiones_protocolo WHERE id = 994;
          DELETE FROM public.protocolos WHERE id = 994;
        `);
      }
    });
  });

  // TSK-002-N03: findAssignedVersionsWithoutScheduledMeeting
  // IDs únicos en el archivo: grep -n "9901\|9902\|9903" test/real-db-evaluations.e2e-spec.ts
  // confirma que solo aparecen dentro de este describe.
  describe('11. TSK-002-N03 findAssignedVersionsWithoutScheduledMeeting', () => {
    const P_SIN = 9901; // protocolo/versión sin convocatoria
    const P_CON = 9902; // protocolo/versión con convocatoria PROGRAMADA
    const P_REA = 9903; // protocolo/versión para verificar MIN de fecha de reasignación
    const P_CONC = 9904; // protocolo/versión en convocatoria CONCLUIDA (11e)
    const P_CXL = 9905; // protocolo/versión en convocatoria CANCELADA (11f)

    const fixtureCleanup = async () => {
      await dataSource.query(`
        UPDATE public.protocolos SET version_actual_id = NULL
          WHERE id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
        DELETE FROM evaluacion.convocatoria_protocolos
          WHERE version_id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
        DELETE FROM evaluacion.convocatorias
          WHERE numero_convocatoria IN ('TEST-N03-CON', 'TEST-N03-CONC', 'TEST-N03-CXL');
        DELETE FROM evaluacion.asignaciones_evaluacion
          WHERE version_id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
        DELETE FROM recepcion.recepciones
          WHERE version_id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
        DELETE FROM public.versiones_protocolo
          WHERE id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
        DELETE FROM public.protocolos
          WHERE id IN (${P_SIN}, ${P_CON}, ${P_REA}, ${P_CONC}, ${P_CXL});
      `);
    };

    beforeEach(fixtureCleanup);
    afterEach(fixtureCleanup);

    it('11a. versión asignada sin convocatoria aparece en el resultado', async () => {
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
          VALUES (${P_SIN}, 'Test TSK-N03 SIN', 901, 10, 'EXPEDITA')
          ON CONFLICT (id) DO NOTHING;
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (${P_SIN}, ${P_SIN}, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = ${P_SIN} WHERE id = ${P_SIN};
        `);
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 901, $2, NOW() - INTERVAL '10 days')`,
          [P_SIN, AssignmentStatus.ASSIGNED],
        );

        const repo = app.get<IMeetingRepositoryPort>('IMeetingRepositoryPort');
        const result = await repo.findAssignedVersionsWithoutScheduledMeeting();
        const found = result.find((r) => r.versionId === P_SIN);
        expect(found).toBeDefined();
        expect(found?.protocolCode).toBeTruthy();
      } finally {
        await fixtureCleanup();
      }
    });

    it('11b. versión en convocatoria PROGRAMADA no aparece en el resultado', async () => {
      let convocatoriaId: string | undefined;
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
          VALUES (${P_CON}, 'Test TSK-N03 CON', 901, 10, 'EXPEDITA')
          ON CONFLICT (id) DO NOTHING;
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (${P_CON}, ${P_CON}, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = ${P_CON} WHERE id = ${P_CON};
        `);
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 901, $2, NOW() - INTERVAL '10 days')`,
          [P_CON, AssignmentStatus.ASSIGNED],
        );
        const convRows = await dataSource.query(
          `INSERT INTO evaluacion.convocatorias (numero_convocatoria, estado)
           VALUES ('TEST-N03-CON', 'PROGRAMADA') RETURNING id`,
        );
        convocatoriaId = convRows[0].id as string;
        await dataSource.query(
          `INSERT INTO evaluacion.convocatoria_protocolos
             (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
           VALUES ($1, $2, $3, 1, NOW() + INTERVAL '30 days')`,
          [convocatoriaId, P_CON, P_CON],
        );

        const repo = app.get<IMeetingRepositoryPort>('IMeetingRepositoryPort');
        const result = await repo.findAssignedVersionsWithoutScheduledMeeting();
        const found = result.find((r) => r.versionId === P_CON);
        expect(found).toBeUndefined();
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
        await fixtureCleanup();
      }
    });

    it('11c. versión con reasignación devuelve la fecha de asignación más antigua', async () => {
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
          VALUES (${P_REA}, 'Test TSK-N03 REA', 901, 10, 'EXPEDITA')
          ON CONFLICT (id) DO NOTHING;
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (${P_REA}, ${P_REA}, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = ${P_REA} WHERE id = ${P_REA};
        `);
        // Asignación original (ahora reasignada) — fecha más antigua
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 902, $2, NOW() - INTERVAL '15 days')`,
          [P_REA, AssignmentStatus.REASIGNED_VENCIMIENTO],
        );
        // Reasignación actual (ASSIGNED) — fecha más reciente
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 901, $2, NOW() - INTERVAL '3 days')`,
          [P_REA, AssignmentStatus.ASSIGNED],
        );

        const repo = app.get<IMeetingRepositoryPort>('IMeetingRepositoryPort');
        const result = await repo.findAssignedVersionsWithoutScheduledMeeting();
        const found = result.find((r) => r.versionId === P_REA);
        expect(found).toBeDefined();
        // La fecha más antigua (≥ 14 días) debe ser la que se reporta, no los 3 días de la reasignación
        const daysSince = Math.floor(
          (Date.now() - new Date(found!.oldestAssignmentDate).getTime()) /
            86_400_000,
        );
        expect(daysSince).toBeGreaterThanOrEqual(14);
      } finally {
        await fixtureCleanup();
      }
    });

    it('11d. findByRoleCodes devuelve arreglo sin error (solo lectura)', async () => {
      const userRepo = app.get(IUserRepository);
      const result = await userRepo.findByRoleCodes([
        RoleCode.SECRETARIA,
        RoleCode.PRESIDENTE,
      ]);
      expect(Array.isArray(result)).toBe(true);
      for (const u of result) {
        expect(u).toHaveProperty('id');
        expect(u).toHaveProperty('fullName');
        expect(u).toHaveProperty('institutionalEmail');
      }
    });

    it('11e. versión en convocatoria CONCLUIDA no aparece en el resultado', async () => {
      let convocatoriaId: string | undefined;
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
          VALUES (${P_CONC}, 'Test TSK-N03 CONC', 901, 10, 'EXPEDITA')
          ON CONFLICT (id) DO NOTHING;
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (${P_CONC}, ${P_CONC}, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = ${P_CONC} WHERE id = ${P_CONC};
        `);
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 901, $2, NOW() - INTERVAL '10 days')`,
          [P_CONC, AssignmentStatus.ASSIGNED],
        );
        const convRows = await dataSource.query(
          `INSERT INTO evaluacion.convocatorias (numero_convocatoria, estado)
           VALUES ('TEST-N03-CONC', 'CONCLUIDA') RETURNING id`,
        );
        convocatoriaId = convRows[0].id as string;
        await dataSource.query(
          `INSERT INTO evaluacion.convocatoria_protocolos
             (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
           VALUES ($1, $2, $3, 1, NOW() + INTERVAL '30 days')`,
          [convocatoriaId, P_CONC, P_CONC],
        );

        const repo = app.get<IMeetingRepositoryPort>('IMeetingRepositoryPort');
        const result = await repo.findAssignedVersionsWithoutScheduledMeeting();
        const found = result.find((r) => r.versionId === P_CONC);
        expect(found).toBeUndefined();
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
        await fixtureCleanup();
      }
    });

    it('11f. versión cuya única convocatoria está CANCELADA sí aparece en el resultado', async () => {
      let convocatoriaId: string | undefined;
      try {
        await dataSource.query(`
          INSERT INTO public.protocolos (id, titulo, investigador_principal_id, estado_id, tipo_revision)
          VALUES (${P_CXL}, 'Test TSK-N03 CXL', 901, 10, 'EXPEDITA')
          ON CONFLICT (id) DO NOTHING;
          INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
          VALUES (${P_CXL}, ${P_CXL}, 1, 10) ON CONFLICT (id) DO NOTHING;
          UPDATE public.protocolos SET version_actual_id = ${P_CXL} WHERE id = ${P_CXL};
        `);
        await dataSource.query(
          `INSERT INTO evaluacion.asignaciones_evaluacion
             (version_id, evaluador_id, estado_id, fecha_asignacion)
           VALUES ($1, 901, $2, NOW() - INTERVAL '10 days')`,
          [P_CXL, AssignmentStatus.ASSIGNED],
        );
        const convRows = await dataSource.query(
          `INSERT INTO evaluacion.convocatorias (numero_convocatoria, estado)
           VALUES ('TEST-N03-CXL', 'CANCELADA') RETURNING id`,
        );
        convocatoriaId = convRows[0].id as string;
        await dataSource.query(
          `INSERT INTO evaluacion.convocatoria_protocolos
             (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
           VALUES ($1, $2, $3, 1, NOW() + INTERVAL '30 days')`,
          [convocatoriaId, P_CXL, P_CXL],
        );

        const repo = app.get<IMeetingRepositoryPort>('IMeetingRepositoryPort');
        const result = await repo.findAssignedVersionsWithoutScheduledMeeting();
        const found = result.find((r) => r.versionId === P_CXL);
        expect(found).toBeDefined();
        expect(found?.protocolCode).toBeTruthy();
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
        await fixtureCleanup();
      }
    });
  });

  describe('TSK-009-N09 (COUNT=65): guard SEGUIMIENTO_NO_DISPONIBLE — followUpReportIds rechazado con 400', () => {
    it('TEST-N09-01: POST con followUpReportIds no vacío y sin versiones → 400 SEGUIMIENTO_NO_DISPONIBLE; COUNT(*) no varía', async () => {
      const countBefore = await dataSource
        .query<{ count: string }[]>(
          `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
        )
        .then((r) => parseInt(r[0].count, 10));

      let convocatoriaId: string | undefined;
      try {
        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            evalSubmissionDeadline: new Date(
              Date.now() + 17 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            followUpReportIds: [1],
          });

        expect(res.status).toBe(400);
        const msg: string = Array.isArray(res.body.message)
          ? (res.body.message as string[]).join(' ')
          : (res.body.message as string);
        expect(msg).toContain('SEGUIMIENTO_NO_DISPONIBLE');

        const countAfter = await dataSource
          .query<{ count: string }[]>(
            `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
          )
          .then((r) => parseInt(r[0].count, 10));
        expect(countAfter).toBe(countBefore);
      } finally {
        // Defensa: si por algún motivo se insertó una fila, limpiarla
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
      }
    });

    it('TEST-N09-02: POST con protocolVersionIds + followUpReportIds mezclados → 400; COUNT(*) no varía', async () => {
      const countBefore = await dataSource
        .query<{ count: string }[]>(
          `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
        )
        .then((r) => parseInt(r[0].count, 10));

      let convocatoriaId: string | undefined;
      try {
        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            evalSubmissionDeadline: new Date(
              Date.now() + 17 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            protocolVersionIds: [991],
            followUpReportIds: [1],
          });

        expect(res.status).toBe(400);
        const msg: string = Array.isArray(res.body.message)
          ? (res.body.message as string[]).join(' ')
          : (res.body.message as string);
        expect(msg).toContain('SEGUIMIENTO_NO_DISPONIBLE');

        const countAfter = await dataSource
          .query<{ count: string }[]>(
            `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
          )
          .then((r) => parseInt(r[0].count, 10));
        expect(countAfter).toBe(countBefore);
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
      }
    });
  });

  describe('TSK-009-N10 (COUNT=65): guard VERSIONES_DUPLICADAS y UNIQUE de BD', () => {
    it('TEST-N10-01: POST con protocolVersionIds [991, 991] → 400 VERSIONES_DUPLICADAS; COUNT(*) no varía', async () => {
      const countBefore = await dataSource
        .query<{ count: string }[]>(
          `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
        )
        .then((r) => parseInt(r[0].count, 10));

      let convocatoriaId: string | undefined;
      try {
        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send({
            sessionType: 'ORDINARIA',
            meetingDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            evalSubmissionDeadline: new Date(
              Date.now() + 17 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            protocolVersionIds: [991, 991],
          });

        expect(res.status).toBe(400);
        const msg: string = Array.isArray(res.body.message)
          ? (res.body.message as string[]).join(' ')
          : (res.body.message as string);
        expect(msg).toContain('VERSIONES_DUPLICADAS');
        expect(msg).toContain('991');

        const countAfter = await dataSource
          .query<{ count: string }[]>(
            `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
          )
          .then((r) => parseInt(r[0].count, 10));
        expect(countAfter).toBe(countBefore);
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
      }
    });

    it('TEST-N10-02: inserción directa de dos filas con mismo (convocatoria_id, version_id) en evaluacion.convocatoria_protocolos → error 23505. REQUIERE migración 1851 aplicada en ceish_test_db', async () => {
      // PRECONDICIÓN: la migración 1851000000000-AddUniqueConvocatoriaProtocolosVersion.ts
      // debe estar aplicada en ceish_test_db antes de ejecutar este test.
      // Si la constraint no existe, la segunda inserción no lanzará error y el test fallará.

      const countBefore = await dataSource
        .query<{ count: string }[]>(
          `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
        )
        .then((r) => parseInt(r[0].count, 10));

      let convocatoriaId: string | undefined;
      try {
        // Resolver protocolo_id de la versión 991 (NOT NULL sin default en BD)
        const versionRow: { protocolo_id: number }[] = await dataSource.query(
          `SELECT protocolo_id FROM public.versiones_protocolo WHERE id = 991`,
        );
        const protocoloId = versionRow[0].protocolo_id;

        // Crear convocatoria de prueba — patrón de fixtures TEST-N03-*
        const convResult: { id: string }[] = await dataSource.query(
          `INSERT INTO evaluacion.convocatorias (numero_convocatoria, estado)
           VALUES ('TEST-N10-02', 'PROGRAMADA') RETURNING id`,
        );
        convocatoriaId = convResult[0].id;

        // Primera inserción — debe funcionar
        await dataSource.query(
          `INSERT INTO evaluacion.convocatoria_protocolos
             (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
           VALUES ($1, $2, 991, 1, NOW())`,
          [convocatoriaId, protocoloId],
        );

        // Segunda inserción con mismo (convocatoria_id, version_id) — debe fallar con 23505
        let pgErrorCode: string | undefined;
        try {
          await dataSource.query(
            `INSERT INTO evaluacion.convocatoria_protocolos
               (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
             VALUES ($1, $2, 991, 2, NOW())`,
            [convocatoriaId, protocoloId],
          );
          throw new Error(
            'TEST-N10-02: la segunda inserción debería haber fallado con 23505 (migración 1851 no aplicada)',
          );
        } catch (err: unknown) {
          const code = (err as { code?: string }).code;
          if (code !== '23505') throw err;
          pgErrorCode = code;
        }

        expect(pgErrorCode).toBe('23505');
      } finally {
        if (convocatoriaId) {
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        }
      }

      const countAfter = await dataSource
        .query<{ count: string }[]>(
          `SELECT COUNT(*) AS count FROM evaluacion.convocatorias`,
        )
        .then((r) => parseInt(r[0].count, 10));
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('TSK-009-N08 (COUNT=65): notificación por correo con PDF al crear convocatoria vía /meetings', () => {
    it('TEST-N08-01: POST /api/evaluations/meetings retorna HTTP 201 y sendCallNotification es invocado con buffer correcto', async () => {
      // Usa versión 991 (EXPEDITA) sembrada en beforeAll — nunca followUpReportIds
      // para evitar el desfase ORM/BD (protocolo_id y fecha_plazo_normativo NOT NULL en DB)

      const meetingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 días
      // evalDeadline = meetingDate + 3 días calendario (siempre posterior; no se calcul biz-days aquí)
      const evalDeadline = new Date(
        meetingDate.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      // Crear lugar de prueba (será limpiado en finally y en afterAll global)
      const lugarRows = await dataSource.query(
        `INSERT INTO evaluacion.lugares (nombre, es_virtual, activo)
         VALUES ('TEST-N08-Sala', false, true) RETURNING id`,
      );
      const locationId: string = lugarRows[0].id as string;

      // Controlar qué usuarios devuelve findByRoleCodes (sin depender del estado real de ceish_test_db)
      const userRepo = app.get(IUserRepository);
      const spyFindByRoles = jest
        .spyOn(userRepo, 'findByRoleCodes')
        .mockResolvedValue([
          {
            id: 9901,
            fullName: 'TEST-N08 Miembro',
            institutionalEmail: 'test-n08@example.invalid',
          },
        ]);

      // IEmailServicePort está mockeado en beforeAll con jest.fn()
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const emailPort = app.get(IEmailServicePort) as unknown as {
        sendCallNotification: jest.Mock;
      };
      emailPort.sendCallNotification.mockClear();

      let convocatoriaId: string | undefined;
      try {
        const payload = {
          sessionType: 'ORDINARIA',
          meetingDate: meetingDate.toISOString(),
          evalSubmissionDeadline: evalDeadline.toISOString(),
          locationId,
          protocolVersionIds: [991],
        };

        const res = await request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send(payload)
          .expect(201);

        const data = res.body.data || res.body;
        expect(data).toHaveProperty('id');
        convocatoriaId = data.id as string;

        // Sondeo hasta 3 s (cada 25 ms): esperar que notifyMembersAsync complete y llame sendCallNotification
        // (la función hace llamadas reales a BD: findPlaceById — un solo setImmediate no basta)
        const startMs = Date.now();
        while (emailPort.sendCallNotification.mock.calls.length === 0) {
          if (Date.now() - startMs > 3000) {
            throw new Error(
              'TEST-N08-01: sendCallNotification no fue invocado en 3 s — notifyMembersAsync falló silenciosamente',
            );
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 25));
        }

        // Verificar que se llamó exactamente una vez (un miembro mock)
        expect(emailPort.sendCallNotification).toHaveBeenCalledTimes(1);
        const args: unknown[] = emailPort.sendCallNotification.mock
          .calls[0] as unknown[];
        const [
          email,
          fullName,
          callCode,
          fechaReunion,
          callTime,
          placeName,
          pdfBuffer,
        ] = args;
        expect(email).toBe('test-n08@example.invalid');
        expect(fullName).toBe('TEST-N08 Miembro');
        expect(typeof callCode).toBe('string');
        expect(fechaReunion).toBeInstanceOf(Date);
        expect(typeof callTime).toBe('string');
        expect(placeName).toBe('TEST-N08-Sala');
        expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
        expect((pdfBuffer as Buffer).toString()).toContain('%PDF-1.4');
      } finally {
        spyFindByRoles.mockRestore();
        if (convocatoriaId) {
          // Hijos antes que padres (FK convocatoria_protocolos→convocatorias)
          await dataSource.query(
            `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id = $1`,
            [convocatoriaId],
          );
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE id = $1`,
            [convocatoriaId],
          );
        } else {
          // Si el POST falló antes de devolver id, limpia por lugar_id
          await dataSource.query(
            `DELETE FROM evaluacion.convocatorias WHERE lugar_id = $1`,
            [locationId],
          );
        }
        await dataSource.query(`DELETE FROM evaluacion.lugares WHERE id = $1`, [
          locationId,
        ]);
      }
    });
  });
});
