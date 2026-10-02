import 'reflect-metadata';
import { EvaluationsController } from './evaluations.controller';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';

import { EvaluationsService } from '../../application/services/evaluations.service';
import { EvaluationConsolidationService } from '../../application/services/evaluation-consolidation.service';
import { AssignEvaluatorsUseCase } from '../../application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from '../../application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from '../../application/use-cases/submit-evaluation.use-case';
import { JwtPayload } from '../../../auth/infrastructure/strategies/jwt.strategy';

describe('EvaluationsController Assignment & Reassignment (TSK-002-13)', () => {
  let controller: EvaluationsController;
  let evaluationsServiceMock: Partial<EvaluationsService>;
  let consolidationServiceMock: Partial<EvaluationConsolidationService>;
  let assignUseCaseMock: { execute: jest.Mock };
  let reassignUseCaseMock: { execute: jest.Mock };
  let submitUseCaseMock: { isCompletion100Percent: jest.Mock };

  beforeEach(() => {
    evaluationsServiceMock = {
      assignPeerEvaluators: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    };
    consolidationServiceMock = {};
    assignUseCaseMock = {
      execute: jest
        .fn()
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]),
    };
    reassignUseCaseMock = {
      execute: jest.fn().mockResolvedValue({
        outgoingAssignment: { id: 1 },
        newAssignment: { id: 5 },
      }),
    };
    submitUseCaseMock = {
      isCompletion100Percent: jest.fn().mockResolvedValue(true),
    };

    controller = new EvaluationsController(
      evaluationsServiceMock as unknown as EvaluationsService,
      consolidationServiceMock as unknown as EvaluationConsolidationService,
      assignUseCaseMock as unknown as AssignEvaluatorsUseCase,
      reassignUseCaseMock as unknown as ReassignEvaluatorUseCase,
      submitUseCaseMock as unknown as SubmitEvaluationUseCase,
    );
  });

  it('should call assignEvaluators usecase on POST /evaluations/assign', async () => {
    const dto = {
      protocolId: 101,
      evaluators: [
        {
          evaluatorId: 1,
          profile: EvaluatorProfile.JURIDICO,
        },
        {
          evaluatorId: 2,
          profile: EvaluatorProfile.SOCIEDAD_CIVIL,
        },
        {
          evaluatorId: 3,
          profile: EvaluatorProfile.METODOLOGICO,
        },
        {
          evaluatorId: 4,
          profile: EvaluatorProfile.SALUD,
        },
      ],
    };

    const result = await controller.assignEvaluators(dto);
    expect(assignUseCaseMock.execute).toHaveBeenCalledWith(dto);
    expect(result).toHaveLength(4);
  });

  it('should call assignEvaluators usecase on POST /evaluations/protocols/:id/assign-peer-evaluators when evaluators array is provided', async () => {
    const dto = {
      protocolId: 101,
      evaluators: [
        {
          evaluatorId: 1,
          profile: EvaluatorProfile.JURIDICO,
        },
        {
          evaluatorId: 2,
          profile: EvaluatorProfile.SOCIEDAD_CIVIL,
        },
        {
          evaluatorId: 3,
          profile: EvaluatorProfile.METODOLOGICO,
        },
        {
          evaluatorId: 4,
          profile: EvaluatorProfile.SALUD,
        },
      ],
    };
    const req = {
      user: { id: 99, email: 'secr@ceish.com' } as unknown as JwtPayload,
    } as unknown as Request & { user: JwtPayload };

    const result = await controller.assignPeerEvaluators(101, dto, req);
    expect(assignUseCaseMock.execute).toHaveBeenCalledWith(dto);
    expect(result).toHaveLength(4);
  });

  it('should call reassignEvaluator usecase on POST /evaluations/reassign with user context', async () => {
    const dto = {
      currentAssignmentId: 1,
      replacementEvaluatorId: 5,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
    };
    const req = {
      user: { id: 99, email: 'admin@ceish.com' } as unknown as JwtPayload,
    } as unknown as Request & { user: JwtPayload };

    const result = await controller.reassignEvaluator(dto, req);
    expect(reassignUseCaseMock.execute).toHaveBeenCalledWith(dto, 99);
    expect((result as { newAssignment: { id: number } }).newAssignment.id).toBe(
      5,
    );
  });

  it('should check 100% completion status on GET /evaluations/completion-status/:protocolId', async () => {
    const result = await controller.getCompletionStatus('101');
    expect(submitUseCaseMock.isCompletion100Percent).toHaveBeenCalledWith(
      '101',
    );
    expect(result.isCompletion100Percent).toBe(true);
  });
});
