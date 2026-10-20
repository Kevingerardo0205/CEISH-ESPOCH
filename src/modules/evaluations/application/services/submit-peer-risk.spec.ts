import { DataSource, In } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EvaluationsService } from './evaluations.service';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { PeerRiskAssignmentOrmEntity } from '../../infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../../auth/infrastructure/database/investigator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { RiskProposalOrmEntity } from '../../infrastructure/database/entities/risk-proposal.orm-entity';
import { ConvocatoriaProtocoloOrmEntity } from '../../infrastructure/database/entities/convocatoria-protocolo.orm-entity';
import { AuditLogOrmEntity } from '../../../audit/infrastructure/database/audit-log.entity.orm';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { ConflictOfInterestService } from './conflict-of-interest.service';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../../../../shared/utils/docx-generator.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import {
  SystemParamsService,
  SystemParamKey,
  SYSTEM_PARAM_FALLBACKS,
} from '../../../sistema/application/services/system-params.service';

describe('EvaluationsService - submitPeerRiskLevel', () => {
  let service: EvaluationsService;
  let mockEvalAssignmentRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let mockRiskProposalRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let mockPeerRiskRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let mockRiskLevelRepo: { findOne: jest.Mock };
  let mockProtocolOrmRepo: { findOne: jest.Mock; save: jest.Mock };
  let mockAuditLogRepo: { create: jest.Mock; save: jest.Mock };
  let mockQueryBuilder: {
    setLock: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };
  let mockDataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { id: 1, versionId: 100, isAssignedForAnnex10: true },
        { id: 2, versionId: 100, isAssignedForAnnex10: true },
      ]),
    };
    mockEvalAssignmentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    mockRiskProposalRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation((dto: Partial<RiskProposalOrmEntity>) => ({
          id: 101,
          ...dto,
        })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      count: jest.fn().mockResolvedValue(0),
    };
    mockPeerRiskRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    mockRiskLevelRepo = {
      findOne: jest.fn(),
    };
    mockProtocolOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };
    mockAuditLogRepo = {
      create: jest
        .fn()
        .mockImplementation((dto: Partial<AuditLogOrmEntity>) => dto),
      save: jest.fn().mockResolvedValue({}),
    };
    const mockManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EvaluationAssignmentOrmEntity)
          return mockEvalAssignmentRepo;
        if (entity === RiskProposalOrmEntity) return mockRiskProposalRepo;
        if (entity === PeerRiskAssignmentOrmEntity) return mockPeerRiskRepo;
        if (entity === RiskLevelOrmEntity) return mockRiskLevelRepo;
        if (entity === ProtocolOrmEntity) return mockProtocolOrmRepo;
        if (entity === AuditLogOrmEntity) return mockAuditLogRepo;
        return {};
      }),
    };
    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (manager: unknown) => Promise<unknown>) =>
          cb(mockManager),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: IEvaluationRepository,
          useValue: {
            findVersionByProtocolId: jest.fn(),
            findAssignmentsByVersionId: jest.fn(),
            saveAssignment: jest.fn(),
          },
        },
        { provide: IProtocolRepository, useValue: {} },
        { provide: ProtocolDeadlineService, useValue: {} },
        {
          provide: IEmailServicePort,
          useValue: {
            sendRiskLevelDesignated: jest.fn().mockResolvedValue(undefined),
            sendRiskDiscrepancyAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: ConflictOfInterestService, useValue: {} },
        {
          provide: getRepositoryToken(EvaluationAssignmentOrmEntity),
          useValue: mockEvalAssignmentRepo,
        },
        {
          provide: getRepositoryToken(RiskProposalOrmEntity),
          useValue: mockRiskProposalRepo,
        },
        {
          provide: getRepositoryToken(PeerRiskAssignmentOrmEntity),
          useValue: mockPeerRiskRepo,
        },
        {
          provide: getRepositoryToken(RiskLevelOrmEntity),
          useValue: mockRiskLevelRepo,
        },
        {
          provide: getRepositoryToken(ProtocolOrmEntity),
          useValue: mockProtocolOrmRepo,
        },
        {
          provide: getRepositoryToken(UserOrmEntity),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(InvestigatorProfileOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(EvaluatorProfileUserOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ConvocatoriaProtocoloOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        { provide: PdfGeneratorService, useValue: {} },
        { provide: DocxGeneratorService, useValue: {} },
        { provide: IStorageService, useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: SystemParamsService,
          useValue: {
            get: (clave: SystemParamKey) => SYSTEM_PARAM_FALLBACKS[clave],
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  it('debe registrar la primera propuesta en RiskProposalOrmEntity sin alterar campos de entrega de EvaluationAssignmentOrmEntity', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 1,
      evaluatorId: 10,
      versionId: 100,
      isAssignedForAnnex10: true,
      actualSubmissionDate: undefined,
      recommendation: undefined,
      evaluationReport: undefined,
      reportPath: undefined,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskProposalRepo.findOne.mockResolvedValue(null); // No previous proposal
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'Riesgo Mínimo',
      isActive: true,
    });
    mockEvalAssignmentRepo.find.mockResolvedValue([
      { id: 1, versionId: 100, isAssignedForAnnex10: true },
      { id: 2, versionId: 100, isAssignedForAnnex10: true },
    ]);

    const res = await service.submitPeerRiskLevel(1, 10, {
      riskLevelId: 2,
      observations: 'Observaciones técnicas preliminares',
      reportPath: 'path/to/report.pdf',
    });

    expect(res).toEqual({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    });
    expect(mockRiskProposalRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentId: 1,
        riskLevelId: 2,
        observations: 'Observaciones técnicas preliminares',
        round: 1,
        isCurrent: true,
      }),
    );
    expect(mockRiskProposalRepo.save).toHaveBeenCalled();
    // Verifica que EvaluationAssignmentOrmEntity no fue alterado destructivamente
    expect(canonicalAssignment.actualSubmissionDate).toBeUndefined();
    expect(canonicalAssignment.recommendation).toBeUndefined();
  });

  it('debe consolidar el riesgo y actualizar el protocolo cuando ambos evaluadores COINCIDEN', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'Riesgo Mínimo',
      reviewType: 'EXPEDITA',
      isActive: true,
    });

    mockEvalAssignmentRepo.find
      .mockResolvedValueOnce([
        { id: 1, versionId: 100, isAssignedForAnnex10: true },
        { id: 2, versionId: 100, isAssignedForAnnex10: true },
      ])
      .mockResolvedValueOnce([
        { id: 1, statusId: AssignmentStatus.ASSIGNED, deadline: null },
        { id: 2, statusId: AssignmentStatus.ASSIGNED, deadline: null },
      ]);

    // Ambos evaluadores tienen propuestas vigentes con riskLevelId = 2
    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null) // existingCurrent check for assignment 2
      .mockResolvedValueOnce({
        assignmentId: 1,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({
        assignmentId: 2,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({ id: 2, reviewType: 'EXPEDITA' });

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      riskLevelId: undefined,
      reviewType: undefined,
      isRiskLevelDesignated: false,
      statusId: 12,
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    const res = await service.submitPeerRiskLevel(2, 20, {
      riskLevelId: 2,
    });

    expect(res).toEqual({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    });
    expect(mockProtocol.riskLevelId).toBe(2);
    expect(mockProtocol.reviewType).toBe(ReviewType.EXPEDITA);
    expect(mockProtocol.isRiskLevelDesignated).toBe(true);
    expect(mockProtocol.statusId).toBe(13); // EN EVALUACIÓN
    expect(mockProtocolOrmRepo.save).toHaveBeenCalled();
  });

  it('debe marcar DISCREPANCIA_RIESGO (status 16) y archivar propuestas anteriores como es_vigente = false', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 3,
      name: 'Mayor que el mínimo',
      isActive: true,
    });

    mockEvalAssignmentRepo.find.mockResolvedValueOnce([
      { id: 1, versionId: 100, isAssignedForAnnex10: true },
      { id: 2, versionId: 100, isAssignedForAnnex10: true },
    ]);

    const p1Prop = { assignmentId: 1, riskLevelId: 2, isCurrent: true };
    const p2Prop = { assignmentId: 2, riskLevelId: 3, isCurrent: true };

    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null) // existingCurrent check
      .mockResolvedValueOnce(p1Prop)
      .mockResolvedValueOnce(p2Prop);

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      statusId: 13,
      isRiskLevelDesignated: true,
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    const res = await service.submitPeerRiskLevel(2, 20, {
      riskLevelId: 3,
    });

    expect(res.message).toContain('Se ha detectado una discrepancia');
    expect(mockProtocol.statusId).toBe(16); // DISCREPANCIA_RIESGO
    expect(mockProtocol.isRiskLevelDesignated).toBe(false);
    expect(p1Prop.isCurrent).toBe(false);
    expect(p2Prop.isCurrent).toBe(false);
    expect(mockRiskProposalRepo.save).toHaveBeenCalledWith([p1Prop, p2Prop]);
  });

  it('debe soportar fallback legacy cuando el ID pertenece a asignaciones_pares_riesgo', async () => {
    mockEvalAssignmentRepo.findOne.mockResolvedValue(null);

    const legacyAssignment = {
      id: 99,
      evaluatorId: 10,
      protocolId: 50,
      submittedAt: null,
      protocol: { id: 50 },
    };
    mockPeerRiskRepo.findOne.mockResolvedValue(legacyAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({ id: 2, isActive: true });
    mockPeerRiskRepo.find.mockResolvedValue([
      { id: 99, submittedAt: new Date() },
      { id: 100, submittedAt: null },
    ]);

    const res = await service.submitPeerRiskLevel(99, 10, {
      riskLevelId: 2,
    });

    expect(res).toEqual({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    });
    expect(mockPeerRiskRepo.save).toHaveBeenCalled();
  });

  it('debe procesar dos envíos simultáneos en paralelo (Promise.all) y consolidar el acuerdo exactamente una vez', async () => {
    const asg1: Partial<EvaluationAssignmentOrmEntity> = {
      id: 1,
      evaluatorId: 10,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };
    const asg2: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockImplementation(
      ({ where: { id } }: { where: { id: number } }) => {
        if (id === 1) return Promise.resolve(asg1);
        if (id === 2) return Promise.resolve(asg2);
        return Promise.resolve(null);
      },
    );

    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'Riesgo Mínimo',
      reviewType: 'EXPEDITA',
      isActive: true,
    });

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      statusId: 12,
      isRiskLevelDesignated: false,
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    const savedProposals: Record<number, Partial<RiskProposalOrmEntity>> = {};
    mockRiskProposalRepo.findOne.mockImplementation(
      ({
        where: { assignmentId, isCurrent },
      }: {
        where: { assignmentId: number; isCurrent?: boolean };
      }) => {
        if (isCurrent && savedProposals[assignmentId]) {
          return Promise.resolve(savedProposals[assignmentId]);
        }
        return Promise.resolve(null);
      },
    );

    mockRiskProposalRepo.save.mockImplementation(
      (entity: Partial<RiskProposalOrmEntity>) => {
        if (entity.assignmentId) {
          savedProposals[entity.assignmentId] = entity;
        }
        return Promise.resolve(entity);
      },
    );

    mockEvalAssignmentRepo.find.mockResolvedValue([
      {
        id: 1,
        versionId: 100,
        isAssignedForAnnex10: true,
        statusId: AssignmentStatus.ASSIGNED,
      },
      {
        id: 2,
        versionId: 100,
        isAssignedForAnnex10: true,
        statusId: AssignmentStatus.ASSIGNED,
      },
    ]);

    // Ejecutar ambos envíos en paralelo
    const [res1, res2] = await Promise.all([
      service.submitPeerRiskLevel(1, 10, { riskLevelId: 2 }),
      service.submitPeerRiskLevel(2, 20, { riskLevelId: 2 }),
    ]);

    expect(res1.message).toBe(
      'Propuesta de nivel de riesgo enviada exitosamente.',
    );
    expect(res2.message).toBe(
      'Propuesta de nivel de riesgo enviada exitosamente.',
    );
    expect(mockQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(mockProtocol.isRiskLevelDesignated).toBe(true);
    expect(mockProtocol.statusId).toBe(13);
  });

  // ─── RD-01: designación — auditoría RISK_PROPOSAL_SUBMITTED + RISK_LEVEL_AUTO_DESIGNATED ──────

  it('RD-01: designación automática — riskLevelId fijado, isRiskLevelDesignated=true, estado EN_EVALUACION, auditoría completa', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'Riesgo Mínimo',
      reviewType: 'EXPEDITA',
      isActive: true,
    });

    mockEvalAssignmentRepo.find
      .mockResolvedValueOnce([
        { id: 1, versionId: 100, isAssignedForAnnex10: true },
        { id: 2, versionId: 100, isAssignedForAnnex10: true },
      ])
      .mockResolvedValueOnce([
        { id: 1, statusId: AssignmentStatus.ASSIGNED, deadline: null },
        { id: 2, statusId: AssignmentStatus.ASSIGNED, deadline: null },
      ]);

    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        assignmentId: 1,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({
        assignmentId: 2,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({ id: 2, reviewType: 'EXPEDITA' });

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      riskLevelId: undefined,
      reviewType: undefined,
      isRiskLevelDesignated: false,
      statusId: 12,
      ceishCode: 'CEISH-2025-010',
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    const res = await service.submitPeerRiskLevel(2, 20, { riskLevelId: 2 });

    expect(mockProtocol.riskLevelId).toBe(2);
    expect(mockProtocol.isRiskLevelDesignated).toBe(true);
    expect(mockProtocol.statusId).toBe(13); // EN_EVALUACION
    expect(res.message).toBe(
      'Propuesta de nivel de riesgo enviada exitosamente.',
    );

    const auditCalls = mockAuditLogRepo.create.mock.calls.map(
      (c: [Partial<AuditLogOrmEntity>]) => c[0].action,
    );
    expect(auditCalls).toContain('RISK_PROPOSAL_SUBMITTED');
    expect(auditCalls).toContain('RISK_LEVEL_AUTO_DESIGNATED');
  });

  // ─── RD-02: discrepancia — auditoría RISK_LEVEL_DISCREPANCY + mensaje correcto ──────────────

  it('RD-02: discrepancia — estado DISCREPANCIA_RIESGO, propuestas archivadas, auditoría y mensaje correctos', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 7,
      code: 'RIESGO_MAYOR',
      name: 'Riesgo Mayor',
      isActive: true,
    });

    mockEvalAssignmentRepo.find.mockResolvedValueOnce([
      { id: 1, versionId: 100, isAssignedForAnnex10: true },
      { id: 2, versionId: 100, isAssignedForAnnex10: true },
    ]);

    const p1Prop = { assignmentId: 1, riskLevelId: 5, isCurrent: true };
    const p2Prop = { assignmentId: 2, riskLevelId: 7, isCurrent: true };

    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(p1Prop)
      .mockResolvedValueOnce(p2Prop);

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      statusId: 13,
      isRiskLevelDesignated: false,
      ceishCode: 'CEISH-2025-011',
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    const res = await service.submitPeerRiskLevel(2, 20, { riskLevelId: 7 });

    expect(mockProtocol.statusId).toBe(16); // DISCREPANCIA_RIESGO
    expect(mockProtocol.isRiskLevelDesignated).toBe(false);
    expect(p1Prop.isCurrent).toBe(false);
    expect(p2Prop.isCurrent).toBe(false);
    expect(res.message).toContain(
      'El nivel de riesgo será decidido en la sesión del pleno',
    );

    const auditActions = mockAuditLogRepo.create.mock.calls.map(
      (c: [Partial<AuditLogOrmEntity>]) => c[0].action,
    );
    expect(auditActions).toContain('RISK_PROPOSAL_SUBMITTED');
    expect(auditActions).toContain('RISK_LEVEL_DISCREPANCY');
  });

  // ─── RD-04: primera propuesta sola → sin cambios en protocolo ─────────────────────────────

  it('RD-04: primera propuesta (única) → protocolo sin modificar', async () => {
    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 1,
      evaluatorId: 10,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskProposalRepo.findOne.mockResolvedValue(null); // sin propuesta previa
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 5,
      name: 'Riesgo Mínimo',
      isActive: true,
    });
    // Solo 1 asignación ha enviado propuesta; la otra aún no
    mockEvalAssignmentRepo.find.mockResolvedValueOnce([
      { id: 1, versionId: 100, isAssignedForAnnex10: true },
      { id: 2, versionId: 100, isAssignedForAnnex10: true },
    ]);
    // Propuesta del evaluador 1 recién guardada; evaluador 2 sin propuesta
    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null) // existingCurrent check
      .mockResolvedValueOnce({
        assignmentId: 1,
        riskLevelId: 5,
        isCurrent: true,
      })
      .mockResolvedValueOnce(null); // p2 aún no ha enviado

    const res = await service.submitPeerRiskLevel(1, 10, { riskLevelId: 5 });

    expect(res.message).toBe(
      'Propuesta de nivel de riesgo enviada exitosamente.',
    );
    expect(mockProtocolOrmRepo.save).not.toHaveBeenCalled();

    const auditActions = mockAuditLogRepo.create.mock.calls.map(
      (c: [Partial<AuditLogOrmEntity>]) => c[0].action,
    );
    expect(auditActions).toContain('RISK_PROPOSAL_SUBMITTED');
    expect(auditActions).not.toContain('RISK_LEVEL_AUTO_DESIGNATED');
    expect(auditActions).not.toContain('RISK_LEVEL_DISCREPANCY');
  });

  // ─── RD-notify: verifica filtro por IDs de evaluadores en notificación post-designación ────

  it('RD-notify: notificación post-designación usa userRepository.find con los IDs de evaluadores de la versión', async () => {
    const flushPromises = (): Promise<void> =>
      new Promise((resolve) => setImmediate(resolve));

    const canonicalAssignment: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: {
        id: 100,
        protocolId: 50,
      } as unknown as ProtocolVersionOrmEntity,
    };

    mockEvalAssignmentRepo.findOne.mockResolvedValue(canonicalAssignment);
    mockRiskLevelRepo.findOne.mockResolvedValue({
      id: 2,
      name: 'Riesgo Mínimo',
      reviewType: 'EXPEDITA',
      isActive: true,
    });

    // La única llamada a evalAssignmentRepo.find en submitPeerRiskLevel es la post-commit
    // (para obtener los evaluatorIds y enviar correos de designación).
    // createQueryBuilder().getMany() maneja el lock dentro de la transacción.
    mockEvalAssignmentRepo.find.mockResolvedValueOnce([
      { evaluatorId: 10 },
      { evaluatorId: 20 },
      { evaluatorId: 30 },
      { evaluatorId: 40 },
    ]);

    mockRiskProposalRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        assignmentId: 1,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({
        assignmentId: 2,
        riskLevelId: 2,
        isCurrent: true,
      })
      .mockResolvedValueOnce({ id: 2, reviewType: 'EXPEDITA' });

    const mockProtocol: Partial<ProtocolOrmEntity> = {
      id: 50,
      riskLevelId: undefined,
      reviewType: undefined,
      isRiskLevelDesignated: false,
      statusId: 12,
      ceishCode: 'CEISH-2025-012',
    };
    mockProtocolOrmRepo.findOne.mockResolvedValue(mockProtocol);

    // Obtener referencia al userRepository mockeado a través del spy
    const userRepo = service[
      'userRepository' as keyof typeof service
    ] as unknown as { find: jest.Mock };
    const userRepoFindSpy = jest.spyOn(userRepo, 'find').mockResolvedValue([
      { id: 10, fullName: 'Eval Uno', institutionalEmail: 'e1@test.ec' },
      { id: 20, fullName: 'Eval Dos', institutionalEmail: 'e2@test.ec' },
      { id: 30, fullName: 'Eval Tres', institutionalEmail: 'e3@test.ec' },
      { id: 40, fullName: 'Eval Cuatro', institutionalEmail: 'e4@test.ec' },
    ] as UserOrmEntity[]);

    await service.submitPeerRiskLevel(2, 20, { riskLevelId: 2 });
    await flushPromises();

    expect(mockEvalAssignmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { versionId: 100 } }),
    );
    expect(userRepoFindSpy).toHaveBeenCalledTimes(1);
    const arg = userRepoFindSpy.mock.calls[0][0] as {
      where: { id: ReturnType<typeof In> };
    };
    expect(arg.where.id).toEqual(In([10, 20, 30, 40]));

    userRepoFindSpy.mockRestore();
  });
});

// ─── TSK-002-N25: RF-12.2f — designatePlenumRiskLevel (servicio) ─────────────

describe('EvaluationsService - designatePlenumRiskLevel', () => {
  let service: EvaluationsService;
  let mockProtocolOrmRepo: { findOne: jest.Mock; save: jest.Mock };
  let mockRiskLevelRepo: { findOne: jest.Mock };
  let mockConvocatoriaProtoRepo: { findOne: jest.Mock };
  let mockAuditLogRepo: { create: jest.Mock; save: jest.Mock };
  let mockEvalAssignmentRepo: { find: jest.Mock };
  let mockUserRepo: { find: jest.Mock };
  let mockEmailService: { sendRiskLevelDesignated: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };

  const PROTOCOL_ID = 169;
  const MEETING_ID = '123e4567-e89b-42d3-a456-426614174000';
  const USER_ID = 99;

  const flushPromises = (): Promise<void> =>
    new Promise((resolve) => setImmediate(resolve));

  beforeEach(async () => {
    mockProtocolOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    mockRiskLevelRepo = { findOne: jest.fn() };
    mockConvocatoriaProtoRepo = { findOne: jest.fn() };
    mockAuditLogRepo = {
      create: jest
        .fn()
        .mockImplementation((dto: Partial<AuditLogOrmEntity>) => dto),
      save: jest.fn().mockResolvedValue({}),
    };
    mockEvalAssignmentRepo = { find: jest.fn().mockResolvedValue([]) };
    mockUserRepo = { find: jest.fn().mockResolvedValue([]) };
    mockEmailService = {
      sendRiskLevelDesignated: jest.fn().mockResolvedValue(undefined),
    };

    const mockManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === ProtocolOrmEntity) return mockProtocolOrmRepo;
        if (entity === AuditLogOrmEntity) return mockAuditLogRepo;
        return {};
      }),
    };
    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (manager: unknown) => Promise<unknown>) =>
          cb(mockManager),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: IEvaluationRepository,
          useValue: {
            findVersionByProtocolId: jest.fn(),
            findAssignmentsByVersionId: jest.fn(),
            saveAssignment: jest.fn(),
          },
        },
        { provide: IProtocolRepository, useValue: {} },
        { provide: ProtocolDeadlineService, useValue: {} },
        { provide: IEmailServicePort, useValue: mockEmailService },
        { provide: ConflictOfInterestService, useValue: {} },
        {
          provide: getRepositoryToken(EvaluationAssignmentOrmEntity),
          useValue: mockEvalAssignmentRepo,
        },
        { provide: getRepositoryToken(RiskProposalOrmEntity), useValue: {} },
        {
          provide: getRepositoryToken(PeerRiskAssignmentOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(RiskLevelOrmEntity),
          useValue: mockRiskLevelRepo,
        },
        {
          provide: getRepositoryToken(ProtocolOrmEntity),
          useValue: mockProtocolOrmRepo,
        },
        { provide: getRepositoryToken(UserOrmEntity), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(InvestigatorProfileOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(EvaluatorProfileUserOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ConvocatoriaProtocoloOrmEntity),
          useValue: mockConvocatoriaProtoRepo,
        },
        { provide: PdfGeneratorService, useValue: {} },
        { provide: DocxGeneratorService, useValue: {} },
        { provide: IStorageService, useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: SystemParamsService,
          useValue: {
            get: (clave: SystemParamKey) => SYSTEM_PARAM_FALLBACKS[clave],
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  const baseProtocol = (): Partial<ProtocolOrmEntity> => ({
    id: PROTOCOL_ID,
    versionActualId: 141,
    statusId: ProtocolStatus.DISCREPANCIA_RIESGO,
    ceishCode: 'CEISH-2025-169',
    riskLevelId: undefined,
    isRiskLevelDesignated: false,
    reviewType: undefined,
  });

  const baseRiskLevel = () => ({
    id: 5,
    isActive: true,
    reviewType: 'EXPEDITA',
  });

  it('PL-U-01: riskLevelId fijado, isRiskLevelDesignated=true, EN_EVALUACION, auditoría con userId y meetingId', async () => {
    mockProtocolOrmRepo.findOne.mockResolvedValue(baseProtocol());
    mockRiskLevelRepo.findOne.mockResolvedValue(baseRiskLevel());
    mockConvocatoriaProtoRepo.findOne.mockResolvedValue({ id: 'conv-item' });

    const result = await service.designatePlenumRiskLevel(
      PROTOCOL_ID,
      { riskLevelId: 5, meetingId: MEETING_ID },
      USER_ID,
    );

    expect(result).toMatchObject({
      message: 'Nivel de riesgo designado en pleno exitosamente.',
      riskLevelId: 5,
      reviewType: ReviewType.EXPEDITA,
      statusId: ProtocolStatus.EN_EVALUACION,
    });
    expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
        action: 'RISK_LEVEL_PLENO_DESIGNATED',
      }),
    );
    const createArg = (
      mockAuditLogRepo.create.mock.calls as [
        [{ newData: { riskLevelId: number; meetingId: string } }],
      ]
    )[0][0];
    expect(createArg.newData).toMatchObject({
      riskLevelId: 5,
      meetingId: MEETING_ID,
    });
    expect(mockAuditLogRepo.save).toHaveBeenCalledTimes(1);
  });

  it('PL-U-02: notificación usa versionActualId (141), no protocol.id (169)', async () => {
    mockProtocolOrmRepo.findOne.mockResolvedValue(baseProtocol());
    mockRiskLevelRepo.findOne.mockResolvedValue(baseRiskLevel());
    mockConvocatoriaProtoRepo.findOne.mockResolvedValue({ id: 'conv-item' });
    mockEvalAssignmentRepo.find.mockResolvedValue([]);

    await service.designatePlenumRiskLevel(
      PROTOCOL_ID,
      { riskLevelId: 5, meetingId: MEETING_ID },
      USER_ID,
    );
    await flushPromises();

    expect(mockEvalAssignmentRepo.find).toHaveBeenCalledTimes(1);
    const findCalls = mockEvalAssignmentRepo.find.mock.calls as [
      [{ where: { versionId: number } }],
    ];
    expect(findCalls[0][0]).toEqual(
      expect.objectContaining({ where: { versionId: 141 } }),
    );
  });

  it('PL-U-03: estado distinto de DISCREPANCIA_RIESGO → 409 ConflictException', async () => {
    mockProtocolOrmRepo.findOne.mockResolvedValue({
      ...baseProtocol(),
      statusId: ProtocolStatus.EN_EVALUACION,
    });

    await expect(
      service.designatePlenumRiskLevel(
        PROTOCOL_ID,
        { riskLevelId: 5, meetingId: MEETING_ID },
        USER_ID,
      ),
    ).rejects.toThrow('discrepancia de riesgo');
  });

  it('PL-U-04: convocatoria sin esta versión → 409 ConflictException', async () => {
    mockProtocolOrmRepo.findOne.mockResolvedValue(baseProtocol());
    mockRiskLevelRepo.findOne.mockResolvedValue(baseRiskLevel());
    mockConvocatoriaProtoRepo.findOne.mockResolvedValue(null);

    await expect(
      service.designatePlenumRiskLevel(
        PROTOCOL_ID,
        { riskLevelId: 5, meetingId: MEETING_ID },
        USER_ID,
      ),
    ).rejects.toThrow('convocatoria');
  });

  it('PL-U-05: nivel inactivo → 404 NotFoundException', async () => {
    mockProtocolOrmRepo.findOne.mockResolvedValue(baseProtocol());
    mockRiskLevelRepo.findOne.mockResolvedValue(null);

    await expect(
      service.designatePlenumRiskLevel(
        PROTOCOL_ID,
        { riskLevelId: 5, meetingId: MEETING_ID },
        USER_ID,
      ),
    ).rejects.toThrow('no encontrado o inactivo');
  });
});
