/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import 'reflect-metadata';
import { SubmitEvaluationUseCase } from './submit-evaluation.use-case';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

describe('SubmitEvaluationUseCase (TSK-002-11)', () => {
  let repositoryMock: any;
  let useCase: SubmitEvaluationUseCase;

  const mockAssignments: EvaluationAssignmentEntity[] = [
    new EvaluationAssignmentEntity({
      id: 1,
      protocolId: 101,
      evaluatorId: 11,
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: true,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 2,
      protocolId: 101,
      evaluatorId: 12,
      evaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
      isAssignedForAnnex10: false,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 3,
      protocolId: 101,
      evaluatorId: 13,
      evaluatorProfile: EvaluatorProfile.METODOLOGICO,
      isAssignedForAnnex10: true,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 4,
      protocolId: 101,
      evaluatorId: 14,
      evaluatorProfile: EvaluatorProfile.SALUD,
      isAssignedForAnnex10: false,
      deadlineDate: new Date(),
      status: AssignmentStatus.ASSIGNED, // Evaluador 4 aún no envía su dictamen
    }),
  ];

  beforeEach(() => {
    repositoryMock = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue([...mockAssignments]),
      findAssignmentsByProtocolId: jest
        .fn()
        .mockResolvedValue([...mockAssignments]),
      saveAssignmentStatus: jest.fn().mockImplementation(async (a) => a),
    };
    useCase = new SubmitEvaluationUseCase(repositoryMock);
  });

  it('should return isCompletion100Percent = false when at least 1 evaluator has not submitted', async () => {
    const isComplete = await useCase.isCompletion100Percent(101);
    expect(isComplete).toBe(false);
  });

  it('should return isCompletion100Percent = true when ALL 4 active evaluators have COMPLETED status', async () => {
    const allSubmittedMock = mockAssignments.map((a) => {
      if (a.id === 4) {
        return new EvaluationAssignmentEntity({
          id: a.id,
          protocolId: a.protocolId,
          evaluatorId: a.evaluatorId,
          evaluatorProfile: a.evaluatorProfile,
          isAssignedForAnnex10: a.isAssignedForAnnex10,
          deadlineDate: a.deadlineDate,
          status: AssignmentStatus.COMPLETED,
        });
      }
      return a;
    });

    repositoryMock.findActiveAssignmentsByVersionId.mockResolvedValue(
      allSubmittedMock,
    );

    const isComplete = await useCase.isCompletion100Percent(101);
    expect(isComplete).toBe(true);
  });

  it('should exclude reassigned assignments (status 26 or 27) from 100% calculation', async () => {
    const withReassigned = [
      ...mockAssignments.slice(0, 3).map(
        (a) =>
          new EvaluationAssignmentEntity({
            id: a.id,
            protocolId: a.protocolId,
            evaluatorId: a.evaluatorId,
            evaluatorProfile: a.evaluatorProfile,
            isAssignedForAnnex10: a.isAssignedForAnnex10,
            deadlineDate: a.deadlineDate,
            status: AssignmentStatus.COMPLETED,
          }),
      ),
      new EvaluationAssignmentEntity({
        id: 99,
        protocolId: 101,
        evaluatorId: 99,
        evaluatorProfile: EvaluatorProfile.SALUD,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.REASIGNED_VENCIMIENTO,
      }),
      new EvaluationAssignmentEntity({
        id: 4,
        protocolId: 101,
        evaluatorId: 14,
        evaluatorProfile: EvaluatorProfile.SALUD,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.COMPLETED,
      }),
    ];

    repositoryMock.findActiveAssignmentsByVersionId.mockResolvedValue(
      withReassigned,
    );

    const isComplete = await useCase.isCompletion100Percent(101);
    expect(isComplete).toBe(true);
  });
});
