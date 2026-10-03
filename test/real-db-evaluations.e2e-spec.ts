/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '3100';
process.env.DB_USERNAME = process.env.TEST_DB_USER || 'ceish_user';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'ceish_password';

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
import { RiskProposalOrmEntity } from '../src/modules/evaluations/infrastructure/database/entities/risk-proposal.orm-entity';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';

describe('Real Database Production E2E Tests (ceish_test_db on localhost:3100)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
    process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.TEST_DB_PORT || '3100';
    process.env.DB_USERNAME = process.env.TEST_DB_USER || 'ceish_user';
    process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'ceish_password';

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
        generateAgendaPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 agenda')),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    // Configurar timeouts en sesión PostgreSQL
    await dataSource.query(`
      SET lock_timeout = '5s';
      SET statement_timeout = '5s';
      SET idle_in_transaction_session_timeout = '5s';
    `);

    // Limpiar y sembrar datos de prueba aislados en ceish_test_db
    await dataSource.query(`
      UPDATE public.protocolos SET version_actual_id = NULL WHERE id IN (991, 992, 998, 999);
      DELETE FROM evaluacion.convocatoria_protocolos;
      DELETE FROM evaluacion.convocatorias;
      DELETE FROM evaluacion.evaluacion_criterio WHERE evaluacion_id IN (SELECT id FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999)));
      DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
      DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
      DELETE FROM evaluacion.asignacion_historial WHERE asignacion_anterior_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
      DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999);
      DELETE FROM public.versiones_protocolo WHERE id IN (991, 992, 998, 999);
      DELETE FROM public.protocolos WHERE id IN (991, 992, 998, 999);
      DELETE FROM catalogos.evaluadores_perfil WHERE usuario_id IN (901, 902, 903, 904, 905);
      DELETE FROM catalogos.perfiles_evaluador WHERE id IN (1, 2, 3, 4);
      DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904, 905);
      DELETE FROM evaluacion.lugares WHERE nombre LIKE '%Sala de Consejo%';

      INSERT INTO catalogos.criterios_evaluacion (id, tipo, descripcion)
      VALUES 
        (1, 'EVALUACION ETICA', 'Aspectos éticos y consentimiento informado'),
        (2, 'EVALUACION METODOLOGICA', 'Aspectos metodológicos y validez científica'),
        (3, 'EVALUACION JURIDICA', 'Aspectos jurídicos y viabilidad legal')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO catalogos.usuarios (id, email_institucional, nombres_completos, cedula)
      VALUES 
        (901, 'salud@test.com', 'Dr. Salud', '1111111111'),
        (902, 'metodologo@test.com', 'Dra. Metodologa', '2222222222'),
        (903, 'juridico@test.com', 'Abg. Juridico', '3333333333'),
        (904, 'lego@test.com', 'Lic. Lego', '4444444444'),
        (905, 'reemplazo@test.com', 'Dr. Reemplazo', '5555555555')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO catalogos.perfiles_evaluador (id, nombre, activo, orden_prioridad)
      VALUES 
        (1, 'Salud', true, 1),
        (2, 'Metodología', true, 2),
        (3, 'Jurídico', true, 3),
        (4, 'Sociedad Civil', true, 4)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO catalogos.niveles_riesgo (id, codigo, nombre, tipo_revision, activo)
      VALUES 
        (1, 'MINIMO', 'Riesgo Minimo', 'EXPEDITA', true),
        (2, 'MAYOR_MINIMO', 'Riesgo Mayor que el Minimo', 'PLENO', true)
      ON CONFLICT (id) DO NOTHING;

      -- Vincular perfiles
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      VALUES 
        (901, 1, true),
        (902, 2, true),
        (903, 3, true),
        (904, 4, true),
        (905, 1, true)
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;

      -- Protocolo 991 EXPEDITA
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
      VALUES (991, 'Protocolo Expedita Test', 901, 1, 10, 'EXPEDITA')
      ON CONFLICT (id) DO UPDATE SET tipo_revision = 'EXPEDITA';
      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (991, 991, 1, 10)
      ON CONFLICT (id) DO NOTHING;
      UPDATE public.protocolos SET version_actual_id = 991 WHERE id = 991;

      -- Protocolo 992 PLENO
      INSERT INTO public.protocolos (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id, tipo_revision)
      VALUES (992, 'Protocolo Pleno Test', 901, 2, 10, 'PLENO')
      ON CONFLICT (id) DO UPDATE SET tipo_revision = 'PLENO';
      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (992, 992, 1, 10)
      ON CONFLICT (id) DO NOTHING;
      UPDATE public.protocolos SET version_actual_id = 992 WHERE id = 992;
    `);
  }, 60000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        UPDATE public.protocolos SET version_actual_id = NULL WHERE id IN (991, 992, 998, 999);
        DELETE FROM evaluacion.convocatoria_protocolos;
        DELETE FROM evaluacion.convocatorias;
        DELETE FROM evaluacion.evaluacion_criterio WHERE evaluacion_id IN (SELECT id FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999)));
        DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
        DELETE FROM evaluacion.propuestas_riesgo WHERE asignacion_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
        DELETE FROM evaluacion.asignacion_historial WHERE asignacion_anterior_id IN (SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999));
        DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN (991, 992, 998, 999);
        DELETE FROM public.versiones_protocolo WHERE id IN (991, 992, 998, 999);
        DELETE FROM public.protocolos WHERE id IN (991, 992, 998, 999);
        DELETE FROM catalogos.evaluadores_perfil WHERE usuario_id IN (901, 902, 903, 904, 905);
        DELETE FROM catalogos.perfiles_evaluador WHERE id IN (1, 2, 3, 4);
        DELETE FROM catalogos.usuarios WHERE id IN (901, 902, 903, 904, 905);
        DELETE FROM evaluacion.lugares WHERE nombre LIKE '%Sala de Consejo%';
      `);
    }
    if (app) {
      await app.close();
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
        expect(expeditaRows[0].fecha_limite_str).toBe('2026-03-12');

        const plenoRows = await dataSource.query(`
        SELECT id, fecha_limite::text AS fecha_limite_str
        FROM evaluacion.asignaciones_evaluacion
        WHERE version_id = 992
        ORDER BY id ASC;
      `);
        expect(plenoRows.length).toBe(4);
        expect(plenoRows[0].fecha_limite_str).toBe('2026-03-23');
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
          riskLevelId: 1,
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
              riskLevelId: 1,
              observations: 'Propuesta Par 1',
            }),
          request(app.getHttpServer())
            .post('/api/evaluations/peer-assignments/9912/submit-risk')
            .set('x-user-id', '902')
            .send({
              riskLevelId: 1,
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
        expect(protocol[0].nivel_riesgo_id).toBe(1);
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
        // Reasignar evaluador 904 de la versión 992 por conflicto de interés
        const asgToReassign = await dataSource.query(`
          SELECT id FROM evaluacion.asignaciones_evaluacion WHERE version_id = 992 AND evaluador_id = 904 LIMIT 1;
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
            replacementEvaluatorProfile: 'SALUD',
          });

        expect(resReassign.status).toBe(201);

        // Verificar SQL: asignación previa pasa a estado 27 (REASIGNED_COI) y nueva asignación creada con fecha_limite
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
        expect(newAsg[0].fecha_limite_str).toBe('2026-03-23');

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
  });

  describe('5. Pruebas de Humo de Places por Supertest', () => {
    let createdPlaceId: string;

    it('5a. CRUD de /api/evaluations/meetings/places y GET /api/evaluations/calls/places', async () => {
      // Create place
      const resCreate = await request(app.getHttpServer())
        .post('/api/evaluations/meetings/places')
        .set('x-user-id', '901')
        .send({
          name: 'Sala de Consejo Politécnico Test',
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
          name: 'Sala de Consejo Actualizada',
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
          name: 'Sala de Consejo para Reunion Test',
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
          evalSubmissionDeadline: '2026-03-19T23:59:59.999Z',
          locationId: placeId,
          protocolVersionIds: [991],
        });
      expect([200, 201]).toContain(resCreateMeeting.status);
      const createdMeetingId =
        resCreateMeeting.body.id || resCreateMeeting.body.data?.id;
      expect(createdMeetingId).toBeDefined();

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
  });
});
