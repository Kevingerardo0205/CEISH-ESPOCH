/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
/**
 * TSK-002-N24 — Regresión RF-12.2d/e (designación automática y discrepancia).
 * TSK-002-N25 — Regresión RF-12.2f (designación en pleno por Secretaría).
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
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';

describe('Risk Level Designation — Regresión RF-12.2d/e (e2e)', () => {
  let app: INestApplication;

  const mockDesignationService = {
    submitPeerRiskLevel: jest.fn(),
    designatePlenumRiskLevel: jest.fn(),
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

  // ─── TSK-002-N25: RF-12.2f — designación en pleno ────────────────────────────────────────

  /**
   * PL-01: protocolo en DISCREPANCIA_RIESGO + convocatoria válida → 200 con riskLevelId y reviewType.
   */
  it('PL-01: protocolo en discrepancia + convocatoria válida → 200 con designación', async () => {
    mockDesignationService.designatePlenumRiskLevel.mockResolvedValue({
      message: 'Nivel de riesgo designado en pleno exitosamente.',
      riskLevelId: 5,
      reviewType: 'EXPEDITA',
      statusId: 13,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/evaluations/protocols/169/risk-level')
      .send({
        riskLevelId: 5,
        meetingId: '123e4567-e89b-42d3-a456-426614174000',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      message: 'Nivel de riesgo designado en pleno exitosamente.',
      riskLevelId: 5,
      reviewType: 'EXPEDITA',
    });
    expect(
      mockDesignationService.designatePlenumRiskLevel,
    ).toHaveBeenCalledWith(
      169,
      { riskLevelId: 5, meetingId: '123e4567-e89b-42d3-a456-426614174000' },
      99,
    );
  });

  /**
   * PL-02: protocolo no está en DISCREPANCIA_RIESGO → 409.
   */
  it('PL-02: protocolo sin discrepancia → 409 Conflict propagado por el servicio', async () => {
    // ConflictException importado al inicio
    mockDesignationService.designatePlenumRiskLevel.mockRejectedValue(
      new ConflictException(
        'El protocolo no está en estado de discrepancia de riesgo.',
      ),
    );

    const response = await request(app.getHttpServer())
      .patch('/api/evaluations/protocols/50/risk-level')
      .send({
        riskLevelId: 5,
        meetingId: '123e4567-e89b-42d3-a456-426614174000',
      })
      .expect(409);

    expect(response.body.message).toContain('discrepancia de riesgo');
  });

  /**
   * PL-03: convocatoria no incluye el protocolo → 409.
   */
  it('PL-03: convocatoria incorrecta → 409 Conflict propagado por el servicio', async () => {
    // ConflictException importado al inicio
    mockDesignationService.designatePlenumRiskLevel.mockRejectedValue(
      new ConflictException(
        'La convocatoria indicada no incluye este protocolo.',
      ),
    );

    const response = await request(app.getHttpServer())
      .patch('/api/evaluations/protocols/169/risk-level')
      .send({
        riskLevelId: 5,
        meetingId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(409);

    expect(response.body.message).toContain('convocatoria');
  });

  /**
   * PL-04: protocolId no es entero → 400 del ParseIntPipe.
   */
  it('PL-04: protocolId no entero → 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .patch('/api/evaluations/protocols/abc/risk-level')
      .send({
        riskLevelId: 5,
        meetingId: '123e4567-e89b-42d3-a456-426614174000',
      })
      .expect(400);

    expect(
      mockDesignationService.designatePlenumRiskLevel,
    ).not.toHaveBeenCalled();
  });

  /**
   * PL-05: protocolo inexistente → 404 propagado por el servicio.
   */
  it('PL-05: protocolo inexistente → 404 Not Found propagado por el servicio', async () => {
    // NotFoundException importado al inicio
    mockDesignationService.designatePlenumRiskLevel.mockRejectedValue(
      new NotFoundException('Protocolo con ID 9999 no encontrado.'),
    );

    const response = await request(app.getHttpServer())
      .patch('/api/evaluations/protocols/9999/risk-level')
      .send({
        riskLevelId: 5,
        meetingId: '123e4567-e89b-42d3-a456-426614174000',
      })
      .expect(404);

    expect(response.body.message).toContain('9999');
  });
});
