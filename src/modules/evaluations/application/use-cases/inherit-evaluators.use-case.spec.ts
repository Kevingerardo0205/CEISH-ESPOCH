/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import 'reflect-metadata';
import { InheritEvaluatorsUseCase } from './inherit-evaluators.use-case';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

describe('InheritEvaluatorsUseCase (TSK-002-11)', () => {
  let repositoryMock: any;
  let useCase: InheritEvaluatorsUseCase;

  const previousAssignments: EvaluationAssignmentEntity[] = [
    new EvaluationAssignmentEntity({
      id: 1,
      protocolId: 10,
      evaluatorId: 101,
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: true,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 2,
      protocolId: 10,
      evaluatorId: 102,
      evaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
      isAssignedForAnnex10: false,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 3,
      protocolId: 10,
      evaluatorId: 103,
      evaluatorProfile: EvaluatorProfile.METODOLOGICO,
      isAssignedForAnnex10: true,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
    new EvaluationAssignmentEntity({
      id: 4,
      protocolId: 10,
      evaluatorId: 104,
      evaluatorProfile: EvaluatorProfile.SALUD,
      isAssignedForAnnex10: false,
      deadlineDate: new Date(),
      status: AssignmentStatus.COMPLETED,
    }),
  ];

  beforeEach(() => {
    repositoryMock = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue([...previousAssignments]),
      findActiveAssignmentsByProtocolId: jest
        .fn()
        .mockResolvedValue([...previousAssignments]),
      saveAssignments: jest
        .fn()
        .mockImplementation(async (entities) => entities),
    };
    useCase = new InheritEvaluatorsUseCase(repositoryMock);
  });

  it('should inherit the 4 active evaluators from v1.0 to v2.0 preserving profiles and Annex 10 flags, resetting status to ASSIGNED (numeric IDs)', async () => {
    const inheritedEntities = await useCase.execute(10, 20, 15, []);

    expect(
      repositoryMock.findActiveAssignmentsByVersionId,
    ).toHaveBeenCalledWith(10);
    expect(repositoryMock.saveAssignments).toHaveBeenCalledTimes(1);

    expect(inheritedEntities).toHaveLength(4);

    // Mantiene los mismos IDs de evaluador y perfiles
    expect(inheritedEntities[0].evaluatorId).toBe(101);
    expect(inheritedEntities[0].evaluatorProfile).toBe(
      EvaluatorProfile.JURIDICO,
    );
    expect(inheritedEntities[0].isAssignedForAnnex10).toBe(true);
    expect(inheritedEntities[0].status).toBe(AssignmentStatus.ASSIGNED);

    expect(inheritedEntities[1].evaluatorId).toBe(102);
    expect(inheritedEntities[1].evaluatorProfile).toBe(
      EvaluatorProfile.SOCIEDAD_CIVIL,
    );
    expect(inheritedEntities[1].isAssignedForAnnex10).toBe(false);
    expect(inheritedEntities[1].status).toBe(AssignmentStatus.ASSIGNED);
  });

  it('should support saveAssignmentsTransaction when repository supports it', async () => {
    const transactionRepo = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue([...previousAssignments]),
      saveAssignmentsTransaction: jest
        .fn()
        .mockImplementation(async (payloads) =>
          payloads.map((p: any, idx: number) => ({
            id: idx + 50,
            versionId: p.versionId,
            evaluatorId: p.evaluatorId,
            isAssignedForAnnex10: p.isAssignedForAnnex10,
            deadline: p.deadline,
            statusId: p.statusId,
          })),
        ),
    };

    const transactionalUseCase = new InheritEvaluatorsUseCase(transactionRepo);

    const inherited = await transactionalUseCase.execute(10, 20, 15, []);

    expect(transactionRepo.saveAssignmentsTransaction).toHaveBeenCalledTimes(1);
    expect(inherited).toHaveLength(4);
    expect(inherited[0].id).toBe(50);
    expect(inherited[0].status).toBe(AssignmentStatus.ASSIGNED);
  });

  it('should throw an error when previous version does not have exactly 4 active evaluators', async () => {
    repositoryMock.findActiveAssignmentsByVersionId.mockResolvedValue(
      previousAssignments.slice(0, 3),
    );

    await expect(useCase.execute(10, 20)).rejects.toThrow(
      'El protocolo de origen debe contar exactamente con 4 evaluadores pares activos para continuar.',
    );
  });
});
