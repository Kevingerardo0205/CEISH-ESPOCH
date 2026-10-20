import 'reflect-metadata';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../src/shared/enums/evaluator-enums';
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';
import { EvaluationAssignmentEntity } from '../src/modules/evaluations/domain/entities/evaluation-assignment.entity';
import { AssignmentHistoryEntity } from '../src/modules/evaluations/domain/entities/assignment-history.entity';
import { AssignEvaluatorsUseCase } from '../src/modules/evaluations/application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from '../src/modules/evaluations/application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from '../src/modules/evaluations/application/use-cases/submit-evaluation.use-case';
import { AssignEvaluatorsDto } from '../src/modules/evaluations/application/dtos/evaluator-dtos';
import { IProtocolRepository } from '../src/modules/protocols/domain/ports/protocol.repository.port';

describe('Evaluations Assignment Workflow (e2e integration)', () => {
  let inMemoryAssignments: EvaluationAssignmentEntity[] = [];
  let inMemoryHistory: AssignmentHistoryEntity[] = [];
  let emittedEvents: Array<{ event: string; payload: unknown }> = [];

  let repositoryMock: {
    saveAssignments: jest.Mock;
    findAssignmentById: jest.Mock;
    findAssignmentsByProtocolId: jest.Mock;
    findActiveAssignmentsByVersionId: jest.Mock;
    executeReassignmentTransaction: jest.Mock;
  };
  let protocolRepositoryMock: { findById: jest.Mock };
  let eventEmitterMock: { emit: jest.Mock };
  let assignUseCase: AssignEvaluatorsUseCase;
  let reassignUseCase: ReassignEvaluatorUseCase;
  let submitUseCase: SubmitEvaluationUseCase;

  beforeEach(() => {
    inMemoryAssignments = [];
    inMemoryHistory = [];
    emittedEvents = [];

    repositoryMock = {
      saveAssignments: jest
        .fn()
        .mockImplementation((entities: EvaluationAssignmentEntity[]) => {
          const persisted = entities.map((entity, index) => {
            return new EvaluationAssignmentEntity({
              id: entity.id ?? index + 1,
              protocolId: entity.protocolId,
              evaluatorId: entity.evaluatorId,
              evaluatorProfile: entity.evaluatorProfile,
              isAssignedForAnnex10: entity.isAssignedForAnnex10,
              deadlineDate: entity.deadlineDate,
              status: entity.status,
            });
          });
          inMemoryAssignments.push(...persisted);
          return Promise.resolve(persisted);
        }),
      findAssignmentById: jest
        .fn()
        .mockImplementation((id: number | string) => {
          const domainEntity =
            inMemoryAssignments.find((a) => a.id === Number(id)) ?? null;
          if (!domainEntity) return Promise.resolve(null);
          // Return ORM-like plain object so the use-case takes the ORM branch.
          // The instanceof check only triggers for actual EvaluationAssignmentEntity
          // instances; a plain object goes to the else branch where rawOrmProfileId
          // is set from profileId, which the reassignment transaction requires.
          const PROFILE_META: Record<string, { id: number; name: string }> = {
            [EvaluatorProfile.JURIDICO]: { id: 8, name: 'Jurídico' },
            [EvaluatorProfile.SOCIEDAD_CIVIL]: {
              id: 10,
              name: 'Sociedad Civil',
            },
            [EvaluatorProfile.METODOLOGICO]: { id: 6, name: 'Metodológico' },
            [EvaluatorProfile.SALUD]: { id: 9, name: 'Salud' },
          };
          const meta = PROFILE_META[
            domainEntity.evaluatorProfile as string
          ] ?? { id: 9, name: 'Salud' };
          return Promise.resolve({
            id: domainEntity.id,
            evaluatorId:
              typeof domainEntity.evaluatorId === 'number'
                ? domainEntity.evaluatorId
                : 1,
            profileId: meta.id,
            profile: { id: meta.id, name: meta.name },
            versionId:
              typeof domainEntity.protocolId === 'number'
                ? domainEntity.protocolId
                : 1,
            statusId: domainEntity.status,
            isAssignedForAnnex10: domainEntity.isAssignedForAnnex10 ?? false,
            deadline: domainEntity.deadlineDate ?? new Date(),
          });
        }),
      findAssignmentsByProtocolId: jest
        .fn()
        .mockImplementation((protocolId: number | string) => {
          return Promise.resolve(
            inMemoryAssignments.filter(
              (a) => a.protocolId === Number(protocolId),
            ),
          );
        }),
      // In this mock, protocolId === versionId (both = 100 or 200)
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockImplementation((versionId: number) => {
          const ACTIVE = new Set([
            AssignmentStatus.SUGGESTED,
            AssignmentStatus.ASSIGNED,
            AssignmentStatus.COMPLETED,
          ]);
          return Promise.resolve(
            inMemoryAssignments
              .filter((a) => a.protocolId === versionId && ACTIVE.has(a.status))
              .map((a) => ({ id: a.id, statusId: a.status, versionId })),
          );
        }),
      executeReassignmentTransaction: jest.fn().mockImplementation(
        (params: {
          outgoingAssignmentId: number;
          outgoingStatusId: number;
          newAssignment: Partial<{
            versionId: number;
            evaluatorId: number;
            profileId: number;
            statusId: number;
            isAssignedForAnnex10: boolean;
            deadline: Date;
          }>;
          auditHistory: Partial<{
            previousAssignmentId: number;
            previousEvaluatorId: number;
            profileId: number;
            reason: ReassignmentReason;
            justification?: string;
            newEvaluatorId: number;
            executedBy: number;
          }>;
        }) => {
          const outgoing = inMemoryAssignments.find(
            (a) => a.id === params.outgoingAssignmentId,
          );
          if (outgoing) {
            outgoing.markAsReassigned(params.outgoingStatusId);
          }

          const newEntity = new EvaluationAssignmentEntity({
            id: 999,
            protocolId: params.newAssignment.versionId ?? 100,
            evaluatorId: params.newAssignment.evaluatorId ?? 5,
            evaluatorProfile: EvaluatorProfile.JURIDICO,
            isAssignedForAnnex10:
              params.newAssignment.isAssignedForAnnex10 ?? false,
            deadlineDate: params.newAssignment.deadline ?? new Date(),
            status: params.newAssignment.statusId ?? AssignmentStatus.ASSIGNED,
          });
          inMemoryAssignments.push(newEntity);

          const historyEntity = new AssignmentHistoryEntity({
            id: 888,
            previousAssignmentId: params.auditHistory.previousAssignmentId ?? 1,
            previousEvaluatorId: params.auditHistory.previousEvaluatorId ?? 1,
            evaluatorProfile: EvaluatorProfile.JURIDICO,
            reassignmentReason:
              params.auditHistory.reason ??
              ReassignmentReason.CONFLICTO_INTERES,
            newEvaluatorId: params.auditHistory.newEvaluatorId ?? 5,
            newAssignmentId: 999,
            executedBy: params.auditHistory.executedBy ?? 99,
            executedAt: new Date(),
            justification: params.auditHistory.justification,
          });
          inMemoryHistory.push(historyEntity);

          return Promise.resolve({
            outgoingAssignment: {
              id: params.outgoingAssignmentId,
              statusId: params.outgoingStatusId,
              evaluatorId: outgoing?.evaluatorId ?? 1,
              isAssignedForAnnex10: outgoing?.isAssignedForAnnex10 ?? false,
              deadline: outgoing?.deadlineDate ?? new Date(),
            },
            newAssignment: {
              id: 999,
              statusId:
                params.newAssignment.statusId ?? AssignmentStatus.ASSIGNED,
              evaluatorId: params.newAssignment.evaluatorId ?? 5,
              isAssignedForAnnex10:
                params.newAssignment.isAssignedForAnnex10 ?? false,
              deadline: params.newAssignment.deadline ?? new Date(),
            },
            auditHistory: {
              id: 888,
              previousAssignmentId:
                params.auditHistory.previousAssignmentId ?? 1,
              previousEvaluatorId: params.auditHistory.previousEvaluatorId ?? 1,
              profileId: params.auditHistory.profileId ?? 1,
              reason:
                params.auditHistory.reason ??
                ReassignmentReason.CONFLICTO_INTERES,
              justification: params.auditHistory.justification,
              newEvaluatorId: params.auditHistory.newEvaluatorId ?? 5,
              newAssignmentId: 999,
              executedBy: params.auditHistory.executedBy ?? 99,
              executedAt: new Date(),
            },
          });
        },
      ),
    };

    eventEmitterMock = {
      emit: jest.fn().mockImplementation((event: string, payload: unknown) => {
        emittedEvents.push({ event, payload });
      }),
    };

    // In-memory protocol store: protocolId maps to { versionActualId: protocolId, isRiskLevelDesignated: true }
    protocolRepositoryMock = {
      findById: jest.fn().mockImplementation((id: number) =>
        Promise.resolve({
          id,
          versionActualId: id,
          isRiskLevelDesignated: true,
        }),
      ),
    };

    assignUseCase = new AssignEvaluatorsUseCase(
      repositoryMock,
      eventEmitterMock,
    );
    reassignUseCase = new ReassignEvaluatorUseCase(
      repositoryMock,
      eventEmitterMock,
    );
    submitUseCase = new SubmitEvaluationUseCase(
      repositoryMock,
      protocolRepositoryMock as unknown as IProtocolRepository,
    );
  });

  it('should run full end-to-end evaluation workflow: assign 4 -> pick 2 Annex 10 -> reassign by COI -> check completion status', async () => {
    const protocolId = 100;

    // 1. Asignar la cuota exacta de 4 evaluadores (1 Jurídico, 1 Sociedad Civil, 1 Metodológico, 1 Salud)
    const assignDto = {
      protocolId,
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

    const initialAssignments = await assignUseCase.execute(assignDto);
    expect(initialAssignments).toHaveLength(4);
    expect(inMemoryAssignments).toHaveLength(4);

    // 2. Verificar que exactamente 2 evaluadores reciben la marca de Anexo 10 y que SOCIEDAD_CIVIL está excluido
    const annex10Entities = initialAssignments.filter(
      (a) => a.isAssignedForAnnex10,
    );
    expect(annex10Entities).toHaveLength(2);
    const sociedadCivilEntity = initialAssignments.find(
      (a) => a.evaluatorProfile === EvaluatorProfile.SOCIEDAD_CIVIL,
    );
    expect(sociedadCivilEntity?.isAssignedForAnnex10).toBe(false);

    // 3. Verificar la emisión de eventos de notificación con Deep-Linking
    expect(emittedEvents).toHaveLength(4);

    // 4. Verificar que el estado de completitud es false cuando faltan dictámenes
    let isComplete =
      await submitUseCase.isCompletion100PercentByProtocolId(protocolId);
    expect(isComplete).toBe(false);

    // 5. Reasignar a uno de los evaluadores por Conflicto de Interés (mismo perfil JURIDICO)
    const outgoingJuridico = initialAssignments.find(
      (a) => a.evaluatorProfile === EvaluatorProfile.JURIDICO,
    )!;

    const reassignDto = {
      currentAssignmentId: outgoingJuridico.id!,
      replacementEvaluatorId: 5,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
      reasonDescription: 'Conflicto por parentesco con coinvestigador',
    };

    const reassignResult = await reassignUseCase.execute(reassignDto, 99);

    // 6. Comprobar que la asignación saliente se marcó REASIGNED_COI sin borrarse
    expect(reassignResult.outgoingAssignment.status).toBe(
      AssignmentStatus.REASIGNED_COI,
    );
    expect(inMemoryHistory).toHaveLength(1);
    expect(inMemoryHistory[0].reassignmentReason).toBe(
      ReassignmentReason.CONFLICTO_INTERES,
    );

    // 7. Simular el envío de las 4 evaluaciones activas (COMPLETED / estado 7)
    const activeAssignments = inMemoryAssignments.filter(
      (a) =>
        a.status === AssignmentStatus.ASSIGNED ||
        a.status === AssignmentStatus.COMPLETED,
    );
    expect(activeAssignments).toHaveLength(4);

    for (const a of activeAssignments) {
      a.markAsCompleted();
    }

    // 8. Verificar que el estado de completitud cambie a true (100% completado)
    isComplete =
      await submitUseCase.isCompletion100PercentByProtocolId(protocolId);
    expect(isComplete).toBe(true);
  });

  it('should NOT mark ethical evaluation as completed when Annex 10 evaluator sends preliminary risk proposal, and preserves risk proposal after full evaluation', async () => {
    const protocolId = 200;

    const assignDto: AssignEvaluatorsDto = {
      protocolId,
      evaluators: [
        { evaluatorId: 10, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 20, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 30, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 40, profile: EvaluatorProfile.SALUD },
      ],
    };

    const assignments = await assignUseCase.execute(assignDto);
    expect(assignments).toHaveLength(4);

    const annex10Evaluator = assignments.find((a) => a.isAssignedForAnnex10)!;
    expect(annex10Evaluator).toBeDefined();

    // 1. El evaluador de Anexo 10 envía su propuesta de riesgo preliminar (7 días)
    // Se guarda en entidad separada de propuestas de riesgo
    const inMemoryRiskProposals: Array<{
      assignmentId: number;
      riskLevelId: number;
      isCurrent: boolean;
      observations: string;
    }> = [];

    inMemoryRiskProposals.push({
      assignmentId: Number(annex10Evaluator.id),
      riskLevelId: 2,
      isCurrent: true,
      observations: 'Dictamen de riesgo preliminar',
    });

    // 2. Verificar que completion-status del protocolo SIGUE SIENDO FALSE (la evaluación ética no está entregada)
    const isCompleteAfterRisk =
      await submitUseCase.isCompletion100PercentByProtocolId(protocolId);
    expect(isCompleteAfterRisk).toBe(false);

    // 3. Verificar que el evaluador sigue con estado ASSIGNED (evaluación ética pendiente)
    expect(annex10Evaluator.status).toBe(AssignmentStatus.ASSIGNED);

    // 4. Posteriormente, los 4 evaluadores entregan su informe ético completo
    for (const a of inMemoryAssignments.filter(
      (asg) => asg.protocolId === protocolId,
    )) {
      a.markAsCompleted();
    }

    // 5. Ahora completion-status es TRUE
    const isCompleteAfterEthical =
      await submitUseCase.isCompletion100PercentByProtocolId(protocolId);
    expect(isCompleteAfterEthical).toBe(true);

    // 6. La propuesta de riesgo preliminar sigue intacta en su entidad separada
    expect(inMemoryRiskProposals).toHaveLength(1);
    expect(inMemoryRiskProposals[0].isCurrent).toBe(true);
    expect(inMemoryRiskProposals[0].observations).toBe(
      'Dictamen de riesgo preliminar',
    );
  });

  it('N34: 4 activas COMPLETED + 1 REASIGNED_COI → findActiveAssignmentsByVersionId excluye COI → pending vacío → protocolo avanzaría a EVALUADO=14', async () => {
    // Simula el escenario del protocolo 169: Jaime en REASIGNED_COI (no activo),
    // 4 reemplazantes en COMPLETED. La lógica corregida de submitEvaluation
    // usa findActiveAssignmentsByVersionId que solo devuelve statusId ∈ {5,6,7}.
    const protocolId = 400;
    inMemoryAssignments = [
      new EvaluationAssignmentEntity({
        id: 10,
        protocolId,
        evaluatorId: 1,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.REASIGNED_COI, // Jaime — excluido por findActive
      }),
      new EvaluationAssignmentEntity({
        id: 11,
        protocolId,
        evaluatorId: 5,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.COMPLETED,
      }),
      new EvaluationAssignmentEntity({
        id: 12,
        protocolId,
        evaluatorId: 2,
        evaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.COMPLETED,
      }),
      new EvaluationAssignmentEntity({
        id: 13,
        protocolId,
        evaluatorId: 3,
        evaluatorProfile: EvaluatorProfile.METODOLOGICO,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.COMPLETED,
      }),
      new EvaluationAssignmentEntity({
        id: 14,
        protocolId,
        evaluatorId: 4,
        evaluatorProfile: EvaluatorProfile.SALUD,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
        status: AssignmentStatus.COMPLETED,
      }),
    ];

    const activeAssignments =
      (await repositoryMock.findActiveAssignmentsByVersionId(
        protocolId,
      )) as Array<{ id: number; statusId: number; versionId: number }>;

    // findActiveAssignmentsByVersionId excluye REASIGNED_COI → 4 activas
    expect(activeAssignments).toHaveLength(4);

    const pending = activeAssignments.filter(
      (a) => a.statusId !== +AssignmentStatus.COMPLETED,
    );
    // Ninguna activa está pendiente → el servicio corregido avanza a EVALUADO=14
    expect(pending).toHaveLength(0);

    // completion-status también devuelve true (usa la misma lógica)
    const isComplete =
      await submitUseCase.isCompletion100PercentByProtocolId(protocolId);
    expect(isComplete).toBe(true);
  });
});
