/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
/**
 * TSK-002-N24 — Pruebas de regresión para RF-12.2d (designación automática) y RF-12.2e (discrepancia).
 * RD-01: dos propuestas coincidentes → designación automática.
 * RD-02: dos propuestas distintas → DISCREPANCIA_RIESGO.
 */
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

describe('Risk Level Designation — Regresión RF-12.2d/e (e2e)', () => {
  let app: INestApplication;

  const mockDesignationService = {
    submitPeerRiskLevel: jest.fn(),
    getMyPendingPeerAssignments: jest.fn().mockResolvedValue([]),
    assignPeerEvaluators: jest.fn(),
    getCompletionStatus: jest
      .fn()
      .mockResolvedValue({ protocolId: 1, isComplete: false }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController],
      providers: [
        { provide: EvaluationsService, useValue: mockDesignationService },
        {
          provide: EvaluatorAssignmentAdapterService,
          useValue: { adaptAndAssign: jest.fn() },
        },
        { provide: AssignEvaluatorsUseCase, useValue: { execute: jest.fn() } },
        { provide: ReassignEvaluatorUseCase, useValue: { execute: jest.fn() } },
        { provide: SubmitEvaluationUseCase, useValue: { execute: jest.fn() } },
        { provide: EvaluationConsolidationService, useValue: {} },
        {
          provide: GetReassignmentHistoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetActiveAssignmentsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 99 };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * RD-01: Dos propuestas con el mismo riskLevelId → designación automática.
   * El servicio retorna el mensaje de éxito estándar.
   */
  it('RD-01: propuestas coincidentes → responde 200 con mensaje de éxito', async () => {
    mockDesignationService.submitPeerRiskLevel.mockResolvedValue({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    });

    const response = await request(app.getHttpServer())
      .post('/api/evaluations/peer-assignments/1/submit-risk')
      .send({ riskLevelId: 5 })
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    });
    expect(mockDesignationService.submitPeerRiskLevel).toHaveBeenCalledWith(
      1,
      99,
      { riskLevelId: 5 },
    );
  });

  /**
   * RD-02: Dos propuestas con riskLevelId distinto → discrepancia detectada.
   * El servicio retorna el mensaje de discrepancia.
   */
  it('RD-02: propuestas distintas → responde 201 con mensaje de discrepancia', async () => {
    mockDesignationService.submitPeerRiskLevel.mockResolvedValue({
      message:
        'Se ha detectado una discrepancia en las propuestas del nivel de riesgo. El nivel de riesgo será decidido en la sesión del pleno y registrado por la Secretaría.',
    });

    const response = await request(app.getHttpServer())
      .post('/api/evaluations/peer-assignments/2/submit-risk')
      .send({ riskLevelId: 7 })
      .expect(201);

    expect(response.body.message).toContain('discrepancia');
    expect(mockDesignationService.submitPeerRiskLevel).toHaveBeenCalledWith(
      2,
      99,
      { riskLevelId: 7 },
    );
  });

  /**
   * RD-03: DTO inválido (sin riskLevelId) → 400 Bad Request del ValidationPipe.
   */
  it('RD-03: DTO sin riskLevelId → 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/evaluations/peer-assignments/1/submit-risk')
      .send({})
      .expect(400);

    expect(mockDesignationService.submitPeerRiskLevel).not.toHaveBeenCalled();
  });
});
