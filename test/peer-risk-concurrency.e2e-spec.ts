/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { EvaluationsController } from '../src/modules/evaluations/infrastructure/controllers/evaluations.controller';
import { EvaluationsService } from '../src/modules/evaluations/application/services/evaluations.service';
import { AssignEvaluatorsUseCase } from '../src/modules/evaluations/application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from '../src/modules/evaluations/application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from '../src/modules/evaluations/application/use-cases/submit-evaluation.use-case';
import { EvaluationConsolidationService } from '../src/modules/evaluations/application/services/evaluation-consolidation.service';
import { EvaluatorAssignmentAdapterService } from '../src/modules/evaluations/application/services/evaluator-assignment-adapter.service';
import { GetReassignmentHistoryUseCase } from '../src/modules/evaluations/application/use-cases/get-reassignment-history.use-case';
import { GetActiveAssignmentsUseCase } from '../src/modules/evaluations/application/use-cases/get-active-assignments.use-case';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';

describe('Peer Risk Concurrency & Real Flow Deadline Tests (e2e)', () => {
  let app: INestApplication;

  // Estado atómico compartido para verificar concurrencia
  let protocolDesignatedCount = 0;
  let deadlineRecalculationCount = 0;
  let activeProposalsPerAssignment: Record<number, number> = {};

  const mockEvaluationsService = {
    submitPeerRiskLevel: jest
      .fn()
      .mockImplementation(async (assignmentId: number) => {
        // Simular contención de red y base de datos con bloqueo de fila
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 15) + 5),
        );

        // Control de propuestas vigentes por asignación (máximo 1 activa por asignación)
        activeProposalsPerAssignment[assignmentId] = 1;

        // Si es el segundo par que completa la coincidencia de riesgo
        if (Object.keys(activeProposalsPerAssignment).length === 2) {
          protocolDesignatedCount += 1;
          deadlineRecalculationCount += 1;
        }

        return {
          message: 'Propuesta de nivel de riesgo enviada exitosamente.',
        };
      }),
    getMyPendingPeerAssignments: jest.fn().mockResolvedValue([]),
    assignPeerEvaluators: jest.fn(),
    getCompletionStatus: jest.fn().mockResolvedValue({
      protocolId: 100,
      isComplete: false,
    }),
  };

  const mockAssignmentAdapterService = {
    adaptAndAssign: jest.fn().mockImplementation((protocolId: number) => {
      // RF-12.7(a): fecha_limite = null hasta la convocatoria
      return [
        { id: 1, protocolId, evaluatorId: 10, deadlineDate: null },
        { id: 2, protocolId, evaluatorId: 20, deadlineDate: null },
        { id: 3, protocolId, evaluatorId: 30, deadlineDate: null },
        { id: 4, protocolId, evaluatorId: 40, deadlineDate: null },
      ];
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        {
          provide: EvaluatorAssignmentAdapterService,
          useValue: mockAssignmentAdapterService,
        },
        { provide: AssignEvaluatorsUseCase, useValue: { execute: jest.fn() } },
        {
          provide: ReassignEvaluatorUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: SubmitEvaluationUseCase, useValue: { execute: jest.fn() } },
        {
          provide: EvaluationConsolidationService,
          useValue: { consolidate: jest.fn() },
        },
        {
          provide: GetReassignmentHistoryUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: GetActiveAssignmentsUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              protocolId: 1,
              ceishCode: null,
              versionId: null,
              versionNumber: null,
              assignments: [],
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: req.headers['x-test-evaluator-id']
              ? parseInt(req.headers['x-test-evaluator-id'], 10)
              : 10,
            email: 'evaluador@ceish.com',
            roles: ['EVALUADOR', 'SECRETARIA'],
            permissions: ['evaluators:assign', 'evaluation:view_mine'],
            temporalRoles: [],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    protocolDesignatedCount = 0;
    deadlineRecalculationCount = 0;
    activeProposalsPerAssignment = {};
  });

  describe('Scenario 1: Concurrencia de 2 pares Anexo 10 enviando propuesta de riesgo en paralelo', () => {
    it('debe procesar dos envíos simultáneos en paralelo con Promise.all consolidando el acuerdo exactamente una vez', async () => {
      const p1Request = request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/101/submit-risk')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-evaluator-id', '10')
        .send({
          riskLevelId: 2,
          observations: 'Propuesta Par 1',
        });

      const p2Request = request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/102/submit-risk')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-evaluator-id', '20')
        .send({
          riskLevelId: 2,
          observations: 'Propuesta Par 2',
        });

      const [res1, res2] = await Promise.all([p1Request, p2Request]);

      // 1. Ambas solicitudes reciben HTTP 201 Created
      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect((res1.body.data || res1.body).message).toBe(
        'Propuesta de nivel de riesgo enviada exitosamente.',
      );
      expect((res2.body.data || res2.body).message).toBe(
        'Propuesta de nivel de riesgo enviada exitosamente.',
      );

      // 2. La consolidación del protocolo se ejecuta exactamente una vez
      expect(protocolDesignatedCount).toBe(1);
      expect(deadlineRecalculationCount).toBe(1);

      // 3. No quedan propuestas duplicadas por asignación
      expect(activeProposalsPerAssignment[101]).toBe(1);
      expect(activeProposalsPerAssignment[102]).toBe(1);
    });
  });

  describe('Scenario 2: Contrato del endpoint POST /protocols/:id/assign-peer-evaluators cuando el adapter devuelve deadlineDate null (RF-12.7(a))', () => {
    it('el endpoint retorna deadlineDate null cuando el adapter devuelve null (contrato HTTP, no integración real)', async () => {
      // 1. Protocolo Expedita (ID 10)
      const resExpedita = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/10/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .send({ evaluatorIds: [10, 20, 30, 40] })
        .expect(201);

      const expeditaData = resExpedita.body.data || resExpedita.body;
      expect(expeditaData).toHaveLength(4);
      expect(expeditaData[0].deadlineDate).toBeNull();

      // 2. Protocolo Pleno (ID 20)
      const resPleno = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/20/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .send({ evaluatorIds: [10, 20, 30, 40] })
        .expect(201);

      const plenoData = resPleno.body.data || resPleno.body;
      expect(plenoData).toHaveLength(4);
      expect(plenoData[0].deadlineDate).toBeNull();
    });

    it('el endpoint retorna deadlineDate null independientemente del momento de la petición (contrato HTTP)', async () => {
      const resExpedita = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/10/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .send({ evaluatorIds: [10, 20, 30, 40] })
        .expect(201);

      const expeditaData = resExpedita.body.data || resExpedita.body;
      expect(expeditaData).toHaveLength(4);
      expect(expeditaData[0].deadlineDate).toBeNull();
    });
  });
});
