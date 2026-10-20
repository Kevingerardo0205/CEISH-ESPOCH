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
          useValue: { findAssignmentsByEvaluatorId: mockFindAssignments },
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
          useValue: { findAssignmentsByEvaluatorId: mockFindAssignments5 },
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
