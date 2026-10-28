/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
/**
 * Pruebas unitarias TSK-002-N06: isUrgent solo cuando existe fecha_limite (RF-09.1).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EvaluationsService } from './evaluations.service';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { ConflictOfInterestService } from './conflict-of-interest.service';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../../../../shared/utils/docx-generator.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { RiskProposalOrmEntity } from '../../infrastructure/database/entities/risk-proposal.orm-entity';
import { PeerRiskAssignmentOrmEntity } from '../../infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../../auth/infrastructure/database/investigator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { ConvocatoriaProtocoloOrmEntity } from '../../infrastructure/database/entities/convocatoria-protocolo.orm-entity';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import {
  SystemParamsService,
  SystemParamKey,
  SYSTEM_PARAM_FALLBACKS,
} from '../../../sistema/application/services/system-params.service';

describe('EvaluationsService.getMyAssignments — isUrgent (TSK-002-N06, RF-09.1)', () => {
  let service: EvaluationsService;
  let mockFindAssignments: jest.Mock;

  // NOW: 2026-10-15 12:00 ECT (17:00 UTC)
  const NOW = new Date('2026-10-15T17:00:00.000Z');

  beforeAll(async () => {
    mockFindAssignments = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: IEvaluationRepository,
          useValue: {
            findAssignmentsByEvaluatorId: mockFindAssignments,
            // N42: todas las versiones son activas por defecto en estos tests de urgencia
            filterVersionIdsInActiveConvocatoria: jest
              .fn()
              .mockResolvedValue([1]),
          },
        },
        { provide: IProtocolRepository, useValue: {} },
        { provide: ProtocolDeadlineService, useValue: {} },
        { provide: IEmailServicePort, useValue: {} },
        { provide: ConflictOfInterestService, useValue: {} },
        {
          provide: getRepositoryToken(EvaluationAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskProposalOrmEntity), useValue: {} },
        {
          provide: getRepositoryToken(PeerRiskAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskLevelOrmEntity), useValue: {} },
        { provide: getRepositoryToken(ProtocolOrmEntity), useValue: {} },
        { provide: getRepositoryToken(UserOrmEntity), useValue: {} },
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
        { provide: DataSource, useValue: {} },
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

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockFindAssignments.mockReset();
  });

  const baseAssignment = {
    statusId: AssignmentStatus.ASSIGNED,
    versionId: 1,
    version: null,
    deadline: null,
  };

  it('(a) deadline null → isUrgent false (RF-09.1)', async () => {
    mockFindAssignments.mockResolvedValue([{ ...baseAssignment }]);
    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(1);
    expect(result[0].isUrgent).toBe(false);
    expect(result[0].isExpired).toBe(false);
    expect(result[0].daysRemaining).toBeNull();
  });

  it('(b) vence mañana (2026-10-16) → isUrgent true (diffDays=1 ≤ umbral=2)', async () => {
    // endOfDayGuayaquil('2026-10-16') = 2026-10-17T04:59:59.999Z
    // diffTime ≈ 1.5 days → diffDays = 1 → isUrgent = true
    mockFindAssignments.mockResolvedValue([
      { ...baseAssignment, deadline: '2026-10-16' },
    ]);
    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(1);
    expect(result[0].isUrgent).toBe(true);
    expect(result[0].isExpired).toBe(false);
  });

  it('(c) vence en 5 días (2026-10-20) → isUrgent false (diffDays=5 > umbral=2)', async () => {
    // endOfDayGuayaquil('2026-10-20') = 2026-10-21T04:59:59.999Z
    // diffTime ≈ 5.5 days → diffDays = 5 → isUrgent = false
    mockFindAssignments.mockResolvedValue([
      { ...baseAssignment, deadline: '2026-10-20' },
    ]);
    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(1);
    expect(result[0].isUrgent).toBe(false);
    expect(result[0].isExpired).toBe(false);
  });

  it('filtra asignaciones con estado distinto de ASSIGNED', async () => {
    mockFindAssignments.mockResolvedValue([
      {
        ...baseAssignment,
        statusId: AssignmentStatus.COMPLETED,
        deadline: '2026-10-16',
      },
    ]);
    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(0);
  });
});

describe('EvaluationsService.getMyAssignments — isUrgent con umbral=5 (TSK-015-N05)', () => {
  let serviceWith5: EvaluationsService;
  let mockFindAssignments5: jest.Mock;

  // NOW: 2026-10-15 12:00 ECT (17:00 UTC)
  const NOW = new Date('2026-10-15T17:00:00.000Z');

  beforeAll(async () => {
    mockFindAssignments5 = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: IEvaluationRepository,
          useValue: {
            findAssignmentsByEvaluatorId: mockFindAssignments5,
            // N42: todas las versiones son activas por defecto en este test de umbral
            filterVersionIdsInActiveConvocatoria: jest
              .fn()
              .mockResolvedValue([1]),
          },
        },
        { provide: IProtocolRepository, useValue: {} },
        { provide: ProtocolDeadlineService, useValue: {} },
        { provide: IEmailServicePort, useValue: {} },
        { provide: ConflictOfInterestService, useValue: {} },
        {
          provide: getRepositoryToken(EvaluationAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskProposalOrmEntity), useValue: {} },
        {
          provide: getRepositoryToken(PeerRiskAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskLevelOrmEntity), useValue: {} },
        { provide: getRepositoryToken(ProtocolOrmEntity), useValue: {} },
        { provide: getRepositoryToken(UserOrmEntity), useValue: {} },
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
        { provide: DataSource, useValue: {} },
        {
          provide: SystemParamsService,
          useValue: {
            get: (clave: SystemParamKey) =>
              clave === 'evaluador_urgente_umbral_dias'
                ? 5
                : SYSTEM_PARAM_FALLBACKS[clave],
          },
        },
      ],
    }).compile();
    serviceWith5 = module.get<EvaluationsService>(EvaluationsService);
  });

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockFindAssignments5.mockReset();
  });

  it('vence en 5 días (2026-10-20) → isUrgent TRUE con umbral=5 (diffDays=5 ≤ 5)', async () => {
    // Con umbral=2 (test c del bloque anterior) este mismo deadline da isUrgent=false
    mockFindAssignments5.mockResolvedValue([
      {
        statusId: AssignmentStatus.ASSIGNED,
        versionId: 1,
        version: null,
        deadline: '2026-10-20',
      },
    ]);
    const result = await serviceWith5.getMyAssignments(1);
    expect(result).toHaveLength(1);
    expect(result[0].isUrgent).toBe(true);
    expect(result[0].isExpired).toBe(false);
  });
});

// ── TSK-002-N42 ────────────────────────────────────────────────────────────
describe('EvaluationsService — N42: filtrar asignaciones por convocatoria vigente', () => {
  let service: EvaluationsService;
  let mockFindAsg: jest.Mock;
  let mockFilterVersionIds: jest.Mock;
  let mockFilterProtocolIds: jest.Mock;
  let mockEvalAssignmentRepo: { find: jest.Mock };
  let mockRiskProposalRepo: { findOne: jest.Mock };
  let mockPeerRiskRepo: { find: jest.Mock };

  const NOW = new Date('2026-10-15T17:00:00.000Z');

  beforeAll(async () => {
    mockFindAsg = jest.fn();
    mockFilterVersionIds = jest.fn();
    mockFilterProtocolIds = jest.fn();
    mockEvalAssignmentRepo = { find: jest.fn() };
    mockRiskProposalRepo = { findOne: jest.fn() };
    mockPeerRiskRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: IEvaluationRepository,
          useValue: {
            findAssignmentsByEvaluatorId: mockFindAsg,
            filterVersionIdsInActiveConvocatoria: mockFilterVersionIds,
            filterProtocolIdsInActiveConvocatoria: mockFilterProtocolIds,
          },
        },
        { provide: IProtocolRepository, useValue: {} },
        { provide: ProtocolDeadlineService, useValue: {} },
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
        { provide: getRepositoryToken(RiskLevelOrmEntity), useValue: {} },
        { provide: getRepositoryToken(ProtocolOrmEntity), useValue: {} },
        { provide: getRepositoryToken(UserOrmEntity), useValue: {} },
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
        { provide: DataSource, useValue: {} },
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

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(NOW);
    mockFindAsg.mockReset();
    mockFilterVersionIds.mockReset();
    mockFilterProtocolIds.mockReset().mockResolvedValue([]);
    mockEvalAssignmentRepo.find.mockReset();
    mockRiskProposalRepo.findOne.mockReset();
    mockPeerRiskRepo.find.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('N42-U-01: my-assignments excluye asignación cuya versión NO está en convocatoria vigente', async () => {
    mockFindAsg.mockResolvedValue([
      {
        statusId: AssignmentStatus.ASSIGNED,
        versionId: 10,
        version: null,
        deadline: null,
      },
    ]);
    mockFilterVersionIds.mockResolvedValue([]); // versión 10 NO activa

    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(0);
    expect(mockFilterVersionIds).toHaveBeenCalledWith([10]);
  });

  it('N42-U-02: my-assignments incluye asignación cuya versión SÍ está en convocatoria vigente', async () => {
    mockFindAsg.mockResolvedValue([
      {
        statusId: AssignmentStatus.ASSIGNED,
        versionId: 10,
        version: null,
        deadline: null,
      },
    ]);
    mockFilterVersionIds.mockResolvedValue([10]); // versión 10 activa

    const result = await service.getMyAssignments(1);
    expect(result).toHaveLength(1);
    expect(mockFilterVersionIds).toHaveBeenCalledWith([10]);
  });

  it('N42-U-03: peer-pending excluye asignación cuya versión NO está en convocatoria vigente', async () => {
    mockEvalAssignmentRepo.find.mockResolvedValue([
      {
        id: 55,
        versionId: 20,
        evaluatorId: 1,
        isAssignedForAnnex10: true,
        statusId: AssignmentStatus.ASSIGNED,
        assignedAt: new Date(),
        version: { protocolId: 5, protocol: { id: 5 } },
      },
    ]);
    mockFilterVersionIds.mockResolvedValue([]); // versión 20 NO activa

    const result = await service.getMyPendingPeerAssignments(1);
    expect(result).toHaveLength(0);
    expect(mockFilterVersionIds).toHaveBeenCalledWith([20]);
  });

  it('N42-U-04: peer-pending incluye asignación cuya versión SÍ está en convocatoria vigente', async () => {
    mockEvalAssignmentRepo.find.mockResolvedValue([
      {
        id: 55,
        versionId: 20,
        evaluatorId: 1,
        isAssignedForAnnex10: true,
        statusId: AssignmentStatus.ASSIGNED,
        assignedAt: new Date(),
        version: { protocolId: 5, protocol: { id: 5 } },
      },
    ]);
    mockFilterVersionIds.mockResolvedValue([20]); // versión 20 activa
    mockRiskProposalRepo.findOne.mockResolvedValue(null); // sin propuesta activa → aparece

    const result = await service.getMyPendingPeerAssignments(1);
    expect(result).toHaveLength(1);
    expect(mockFilterVersionIds).toHaveBeenCalledWith([20]);
  });

  it('N42-U-05: peer-pending excluye asignación legacy cuyo protocolo NO está en convocatoria vigente', async () => {
    mockEvalAssignmentRepo.find.mockResolvedValue([]); // sin canónicas
    mockPeerRiskRepo.find.mockResolvedValue([
      { id: 77, protocolId: 9, evaluatorId: 1, assignedAt: new Date() },
    ]);
    // mockFilterProtocolIds devuelve [] por defecto (beforeEach)

    const result = await service.getMyPendingPeerAssignments(1);
    expect(result).toHaveLength(0);
    expect(mockFilterProtocolIds).toHaveBeenCalledWith([9]);
  });

  it('N42-U-06: peer-pending incluye asignación legacy cuyo protocolo SÍ está en convocatoria vigente', async () => {
    mockEvalAssignmentRepo.find.mockResolvedValue([]); // sin canónicas
    mockPeerRiskRepo.find.mockResolvedValue([
      { id: 77, protocolId: 9, evaluatorId: 1, assignedAt: new Date() },
    ]);
    mockFilterProtocolIds.mockResolvedValue([9]); // protocolo 9 activo

    const result = await service.getMyPendingPeerAssignments(1);
    expect(result).toHaveLength(1);
    expect(mockFilterProtocolIds).toHaveBeenCalledWith([9]);
  });
});

describe('TSK-002-N43: Guard de convocatoria activa en acciones de evaluador', () => {
  let service: EvaluationsService;
  let mockEvalRepo: any;
  let mockStorageService: any;

  beforeEach(async () => {
    mockEvalRepo = {
      findAssignmentById: jest.fn(),
      findEvaluationById: jest.fn(),
      findEvaluationByAssignmentId: jest.fn(),
      findEvaluationDetailsByEvaluationId: jest.fn(),
      filterVersionIdsInActiveConvocatoria: jest.fn(),
    };
    mockStorageService = {
      getDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://storage.example.com/signed-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: IEvaluationRepository, useValue: mockEvalRepo },
        { provide: IProtocolRepository, useValue: { findById: jest.fn() } },
        { provide: ProtocolDeadlineService, useValue: {} },
        { provide: IEmailServicePort, useValue: {} },
        { provide: ConflictOfInterestService, useValue: {} },
        {
          provide: getRepositoryToken(EvaluationAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskProposalOrmEntity), useValue: {} },
        {
          provide: getRepositoryToken(PeerRiskAssignmentOrmEntity),
          useValue: {},
        },
        { provide: getRepositoryToken(RiskLevelOrmEntity), useValue: {} },
        { provide: getRepositoryToken(ProtocolOrmEntity), useValue: {} },
        { provide: getRepositoryToken(UserOrmEntity), useValue: {} },
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
        { provide: IStorageService, useValue: mockStorageService },
        { provide: DataSource, useValue: {} },
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

  const sampleAssignment = {
    id: 1001,
    versionId: 50,
    evaluatorId: 901,
    statusId: AssignmentStatus.ASSIGNED,
    version: { protocolId: 10, protocol: { reviewType: 'PLENO' } },
  };

  describe('submitEvaluation (POST /evaluations/submit)', () => {
    const validDto: any = {
      assignmentId: 1001,
      result: 1,
      observations: 'Dictamen de prueba',
    };

    it('N43-U-01: sin convocatoria activa -> lanza ForbiddenException con mensaje exacto', async () => {
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([]); // sin convocatoria activa

      await expect(service.submitEvaluation(validDto, 901)).rejects.toThrow(
        new ForbiddenException('el protocolo aún no está en una convocatoria'),
      );
      expect(
        mockEvalRepo.filterVersionIdsInActiveConvocatoria,
      ).toHaveBeenCalledWith([50]);
    });

    it('N43-U-02: con convocatoria activa -> pasa el guard de convocatoria', async () => {
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
        statusId: AssignmentStatus.COMPLETED, // ya completada para detener el flujo inmediatamente tras el guard
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([50]); // activa

      // Pasa el guard de convocatoria y falla en validación de estado COMPLETED (400)
      await expect(service.submitEvaluation(validDto, 901)).rejects.toThrow(
        new BadRequestException(
          'Esta evaluación ya ha sido enviada anteriormente.',
        ),
      );
    });

    it('N43-U-03: no-dueño -> lanza BadRequestException de propiedad antes del guard de convocatoria', async () => {
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      }); // dueño = 901
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([]); // sin convocatoria

      // Evaluador 999 intenta evaluar -> falla en propiedad (400), no en convocatoria (403)
      await expect(service.submitEvaluation(validDto, 999)).rejects.toThrow(
        new BadRequestException(
          'No tiene permisos para evaluar esta asignación.',
        ),
      );
      expect(
        mockEvalRepo.filterVersionIdsInActiveConvocatoria,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getEvaluationChecklistDetails (GET /evaluations/:id/checklist-details)', () => {
    it('N43-U-04: sin convocatoria activa -> lanza ForbiddenException con mensaje exacto', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([]); // sin convocatoria activa

      await expect(service.getEvaluationChecklistDetails(1001)).rejects.toThrow(
        new ForbiddenException('el protocolo aún no está en una convocatoria'),
      );
      expect(
        mockEvalRepo.filterVersionIdsInActiveConvocatoria,
      ).toHaveBeenCalledWith([50]);
    });

    it('N43-U-05: con convocatoria activa -> pasa el guard y retorna estructura con hasDraft: false si no hay evaluación', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([50]); // activa

      const result = await service.getEvaluationChecklistDetails(1001);
      expect(result).toEqual({
        hasDraft: false,
        evaluacionId: null,
        items: [],
        stats: {},
      });
    });
  });

  describe('getEvaluationDocumentUrl (GET /evaluations/:id/document)', () => {
    it('N43-U-06: sin convocatoria activa -> lanza ForbiddenException con mensaje exacto', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([]); // sin convocatoria activa

      await expect(service.getEvaluationDocumentUrl(1001)).rejects.toThrow(
        new ForbiddenException('el protocolo aún no está en una convocatoria'),
      );
      expect(
        mockEvalRepo.filterVersionIdsInActiveConvocatoria,
      ).toHaveBeenCalledWith([50]);
    });

    it('N43-U-07: con convocatoria activa -> pasa el guard (lanza NotFoundException si no existe evaluación o pdf)', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([50]); // activa

      // Pasa el guard de convocatoria y luego no encuentra evaluación (404)
      await expect(service.getEvaluationDocumentUrl(1001)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEvaluationDocxUrl (GET /evaluations/:id/document/docx)', () => {
    it('N43-U-08: sin convocatoria activa -> lanza ForbiddenException con mensaje exacto', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([]); // sin convocatoria activa

      await expect(service.getEvaluationDocxUrl(1001)).rejects.toThrow(
        new ForbiddenException('el protocolo aún no está en una convocatoria'),
      );
      expect(
        mockEvalRepo.filterVersionIdsInActiveConvocatoria,
      ).toHaveBeenCalledWith([50]);
    });

    it('N43-U-09: con convocatoria activa -> pasa el guard (lanza NotFoundException si no existe evaluación o docx)', async () => {
      mockEvalRepo.findEvaluationById.mockResolvedValue(null);
      mockEvalRepo.findEvaluationByAssignmentId.mockResolvedValue(null);
      mockEvalRepo.findAssignmentById.mockResolvedValue({
        ...sampleAssignment,
      });
      mockEvalRepo.filterVersionIdsInActiveConvocatoria.mockResolvedValue([50]); // activa

      // Pasa el guard de convocatoria y luego no encuentra evaluación (404)
      await expect(service.getEvaluationDocxUrl(1001)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
