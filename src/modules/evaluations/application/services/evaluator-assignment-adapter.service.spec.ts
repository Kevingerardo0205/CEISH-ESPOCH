import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { EvaluatorAssignmentAdapterService } from './evaluator-assignment-adapter.service';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { AssignEvaluatorsUseCase } from '../use-cases/assign-evaluators.use-case';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

import { AssignEvaluatorsDto, EvaluatorItemDto } from '../dtos/evaluator-dtos';

describe('EvaluatorAssignmentAdapterService', () => {
  let service: EvaluatorAssignmentAdapterService;
  let mockEvaluatorProfileUserRepo: { find: jest.Mock };
  let mockProfileRepo: { findOne: jest.Mock };
  let mockAssignEvaluatorsUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    mockEvaluatorProfileUserRepo = {
      find: jest.fn(),
    };
    mockProfileRepo = {
      findOne: jest.fn(),
    };
    mockAssignEvaluatorsUseCase = {
      execute: jest.fn().mockImplementation((dto: AssignEvaluatorsDto) =>
        Promise.resolve(
          dto.evaluators.map((e: EvaluatorItemDto, idx: number) => ({
            id: idx + 1,
            protocolId: dto.protocolId,
            evaluatorId: e.evaluatorId,
            evaluatorProfile: e.profile,
            isAssignedForAnnex10: idx < 2,
            status: AssignmentStatus.ASSIGNED,
          })),
        ),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluatorAssignmentAdapterService,
        {
          provide: getRepositoryToken(EvaluatorProfileUserOrmEntity),
          useValue: mockEvaluatorProfileUserRepo,
        },
        {
          provide: getRepositoryToken(EvaluatorProfileOrmEntity),
          useValue: mockProfileRepo,
        },
        {
          provide: AssignEvaluatorsUseCase,
          useValue: mockAssignEvaluatorsUseCase,
        },
      ],
    }).compile();

    service = module.get<EvaluatorAssignmentAdapterService>(
      EvaluatorAssignmentAdapterService,
    );
  });

  it('should pass through canonical DTO with evaluators array directly to use case', async () => {
    const canonicalDto = {
      protocolId: 100,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await service.adaptAndAssign(100, canonicalDto);
    expect(result).toHaveLength(4);
    expect(mockAssignEvaluatorsUseCase.execute).toHaveBeenCalledWith(
      canonicalDto,
    );
  });

  it('should translate legacy DTO { evaluatorIds } resolving profiles from DB', async () => {
    const legacyDto = {
      evaluatorIds: [10, 20, 30, 40],
    };

    mockEvaluatorProfileUserRepo.find
      .mockResolvedValueOnce([{ profile: { name: 'Perfil Jurídico' } }])
      .mockResolvedValueOnce([{ profile: { name: 'Sociedad Civil' } }])
      .mockResolvedValueOnce([
        { profile: { name: 'Metodología de la Investigación' } },
      ])
      .mockResolvedValueOnce([{ profile: { name: 'Salud y Medicina' } }]);

    const result = await service.adaptAndAssign(100, legacyDto);

    expect(result).toHaveLength(4);
    expect(mockAssignEvaluatorsUseCase.execute).toHaveBeenCalledWith({
      protocolId: 100,
      evaluators: [
        { evaluatorId: 10, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 20, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 30, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 40, profile: EvaluatorProfile.SALUD },
      ],
    });
  });

  it('should throw BadRequestException if an evaluator has no active profile in DB', async () => {
    const legacyDto = {
      evaluatorIds: [10, 20, 30, 40],
    };

    mockEvaluatorProfileUserRepo.find.mockResolvedValueOnce([]);

    await expect(service.adaptAndAssign(100, legacyDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if the 4 evaluators do not cover all 4 mandatory profiles', async () => {
    const legacyDto = {
      evaluatorIds: [10, 20, 30, 40],
    };

    // All are JURIDICO
    mockEvaluatorProfileUserRepo.find
      .mockResolvedValueOnce([{ profile: { name: 'Jurídico' } }])
      .mockResolvedValueOnce([{ profile: { name: 'Jurídico' } }])
      .mockResolvedValueOnce([{ profile: { name: 'Jurídico' } }])
      .mockResolvedValueOnce([{ profile: { name: 'Jurídico' } }]);

    await expect(service.adaptAndAssign(100, legacyDto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
