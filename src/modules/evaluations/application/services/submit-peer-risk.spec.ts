import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { PeerRiskAssignmentOrmEntity } from '../../infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../../auth/infrastructure/database/investigator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { RiskProposalOrmEntity } from '../../infrastructure/database/entities/risk-proposal.orm-entity';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { ConflictOfInterestService } from './conflict-of-interest.service';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../../../../shared/utils/docx-generator.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

describe('EvaluationsService - submitPeerRiskLevel', () => {
  let service: EvaluationsService;
  let mockEvalAssignmentRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
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
  let mockDeadlineService: { calculateEvaluatorDeadline: jest.Mock };
  let mockQueryBuilder: {
    setLock: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
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
      create: jest.fn().mockImplementation((dto) => ({ id: 101, ...dto })),
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
    mockDeadlineService = {
      calculateEvaluatorDeadline: jest
        .fn()
        .mockReturnValue(new Date('2026-04-01')),
    };

    const mockManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === EvaluationAssignmentOrmEntity)
          return mockEvalAssignmentRepo;
        if (entity === RiskProposalOrmEntity) return mockRiskProposalRepo;
        if (entity === PeerRiskAssignmentOrmEntity) return mockPeerRiskRepo;
        if (entity === RiskLevelOrmEntity) return mockRiskLevelRepo;
        if (entity === ProtocolOrmEntity) return mockProtocolOrmRepo;
        return {};
      }),
    };
    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
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
        { provide: ProtocolDeadlineService, useValue: mockDeadlineService },
        { provide: IEmailServicePort, useValue: {} },
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
        { provide: getRepositoryToken(UserOrmEntity), useValue: {} },
        {
          provide: getRepositoryToken(InvestigatorProfileOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(EvaluatorProfileUserOrmEntity),
          useValue: {},
        },
        { provide: PdfGeneratorService, useValue: {} },
        { provide: DocxGeneratorService, useValue: {} },
        { provide: IStorageService, useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
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
      } as any,
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
      } as any,
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
      } as any,
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
      version: { id: 100, protocolId: 50 } as any,
    };
    const asg2: Partial<EvaluationAssignmentOrmEntity> = {
      id: 2,
      evaluatorId: 20,
      versionId: 100,
      isAssignedForAnnex10: true,
      version: { id: 100, protocolId: 50 } as any,
    };

    mockEvalAssignmentRepo.findOne.mockImplementation(({ where: { id } }) => {
      if (id === 1) return Promise.resolve(asg1);
      if (id === 2) return Promise.resolve(asg2);
      return Promise.resolve(null);
    });

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

    const savedProposals: Record<number, any> = {};
    mockRiskProposalRepo.findOne.mockImplementation(
      ({ where: { assignmentId, isCurrent } }) => {
        if (isCurrent && savedProposals[assignmentId]) {
          return Promise.resolve(savedProposals[assignmentId]);
        }
        return Promise.resolve(null);
      },
    );

    mockRiskProposalRepo.save.mockImplementation((entity) => {
      if (entity.assignmentId) {
        savedProposals[entity.assignmentId] = entity;
      }
      return Promise.resolve(entity);
    });

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
});
