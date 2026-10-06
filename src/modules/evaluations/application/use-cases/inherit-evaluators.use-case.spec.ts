/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import 'reflect-metadata';
import { InheritEvaluatorsUseCase } from './inherit-evaluators.use-case';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

describe('InheritEvaluatorsUseCase (TSK-002-11)', () => {
  let repositoryMock: any;
  let useCase: InheritEvaluatorsUseCase;

  // Domain entities: used for saveAssignments path (evaluatorProfile present, no profileId).
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

  // ORM-like plain objects: used for saveAssignmentsTransaction path.
  // Uses non-dev profileIds (8=JURIDICO, 10=SOCIEDAD_CIVIL, 6=METODOLOGICO, 9=SALUD).
  const ormAssignmentsMock = [
    {
      id: 1,
      versionId: 99,
      evaluatorId: 201,
      profileId: 8,
      profile: { id: 8, name: 'JURIDICO' },
      isAssignedForAnnex10: true,
      deadline: '2026-12-01',
      statusId: AssignmentStatus.COMPLETED,
    },
    {
      id: 2,
      versionId: 99,
      evaluatorId: 202,
      profileId: 10,
      profile: { id: 10, name: 'SOCIEDAD_CIVIL' },
      isAssignedForAnnex10: false,
      deadline: '2026-12-01',
      statusId: AssignmentStatus.COMPLETED,
    },
    {
      id: 3,
      versionId: 99,
      evaluatorId: 203,
      profileId: 6,
      profile: { id: 6, name: 'METODOLOGICO' },
      isAssignedForAnnex10: true,
      deadline: '2026-12-01',
      statusId: AssignmentStatus.COMPLETED,
    },
    {
      id: 4,
      versionId: 99,
      evaluatorId: 204,
      profileId: 9,
      profile: { id: 9, name: 'SALUD' },
      isAssignedForAnnex10: false,
      deadline: '2026-12-01',
      statusId: AssignmentStatus.COMPLETED,
    },
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

  it('should support saveAssignmentsTransaction using original ORM profileIds (non-dev: 8,10,6,9)', async () => {
    const transactionRepo = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue([...ormAssignmentsMock]),
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
    const inherited = await transactionalUseCase.execute(99, 100, 15, []);

    expect(transactionRepo.saveAssignmentsTransaction).toHaveBeenCalledTimes(1);

    const payloads =
      transactionRepo.saveAssignmentsTransaction.mock.calls[0][0];
    // profileIds must come from original ORM entities, not from a hardcoded enum map
    expect(payloads[0].profileId).toBe(8);
    expect(payloads[1].profileId).toBe(10);
    expect(payloads[2].profileId).toBe(6);
    expect(payloads[3].profileId).toBe(9);

    expect(inherited).toHaveLength(4);
    expect(inherited[0].id).toBe(50);
    expect(inherited[0].status).toBe(AssignmentStatus.ASSIGNED);
    expect(inherited[0].evaluatorProfile).toBe(EvaluatorProfile.JURIDICO);
    expect(inherited[1].evaluatorProfile).toBe(EvaluatorProfile.SOCIEDAD_CIVIL);
    expect(inherited[2].evaluatorProfile).toBe(EvaluatorProfile.METODOLOGICO);
    expect(inherited[3].evaluatorProfile).toBe(EvaluatorProfile.SALUD);
  });

  it('should throw an error when previous version does not have exactly 4 active evaluators', async () => {
    repositoryMock.findActiveAssignmentsByVersionId.mockResolvedValue(
      previousAssignments.slice(0, 3),
    );

    await expect(useCase.execute(10, 20)).rejects.toThrow(
      'El protocolo de origen debe contar exactamente con 4 evaluadores pares activos para continuar.',
    );
  });

  it('should throw an error when one of the active evaluators has Ético profile (id=7)', async () => {
    const assignmentsWithEtico = [
      ...ormAssignmentsMock.slice(0, 3),
      {
        id: 5,
        versionId: 99,
        evaluatorId: 205,
        profileId: 7,
        profile: { id: 7, name: 'ÉTICO' },
        isAssignedForAnnex10: false,
        deadline: '2026-12-01',
        statusId: AssignmentStatus.COMPLETED,
      },
    ];

    const transactionRepo = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue(assignmentsWithEtico),
      saveAssignmentsTransaction: jest.fn(),
    };

    const transactionalUseCase = new InheritEvaluatorsUseCase(transactionRepo);

    await expect(transactionalUseCase.execute(99, 100)).rejects.toThrow(
      'El evaluador 4 tiene perfil Ético (id=7), que no es compatible con el flujo de herencia de evaluadores par.',
    );
    expect(transactionRepo.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });
});
