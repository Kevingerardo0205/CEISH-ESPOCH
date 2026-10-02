/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call */
import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { ReassignEvaluatorUseCase } from './reassign-evaluator.use-case';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { ReassignEvaluatorDto } from '../dtos/evaluator-dtos';

describe('ReassignEvaluatorUseCase (TSK-002-10)', () => {
  let repositoryMock: any;
  let eventEmitterMock: any;
  let useCase: ReassignEvaluatorUseCase;

  const existingAssignment = new EvaluationAssignmentEntity({
    id: 101,
    protocolId: 10,
    evaluatorId: 15,
    evaluatorProfile: EvaluatorProfile.JURIDICO,
    isAssignedForAnnex10: true,
    deadlineDate: new Date(),
  });

  beforeEach(() => {
    repositoryMock = {
      findAssignmentById: jest.fn().mockResolvedValue(existingAssignment),
      executeReassignmentTransaction: jest
        .fn()
        .mockImplementation(async (params) => {
          return {
            outgoingAssignment: {
              id: params.outgoingAssignmentId,
              statusId: params.outgoingStatusId,
              evaluatorId: 15,
            },
            newAssignment: {
              id: 202,
              evaluatorId: params.newAssignment.evaluatorId,
              statusId: params.newAssignment.statusId,
              isAssignedForAnnex10: params.newAssignment.isAssignedForAnnex10,
              deadline: params.newAssignment.deadline,
            },
            auditHistory: {
              id: 1,
              previousAssignmentId: params.auditHistory.previousAssignmentId,
              previousEvaluatorId: params.auditHistory.previousEvaluatorId,
              newEvaluatorId: params.auditHistory.newEvaluatorId,
              newAssignmentId: 202,
              executedBy: params.auditHistory.executedBy,
              reassignmentReason: params.auditHistory.reason,
            },
          };
        }),
    };
    eventEmitterMock = {
      emit: jest.fn(),
    };
    useCase = new ReassignEvaluatorUseCase(repositoryMock, eventEmitterMock);
  });

  it('should successfully execute reassignment transaction with numeric IDs and emit notification event', async () => {
    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
      reasonDescription: 'El evaluador es familiar del investigador principal.',
    };

    const result = await useCase.execute(dto, 1, 15, []);

    // 1. Busca la asignación saliente
    expect(repositoryMock.findAssignmentById).toHaveBeenCalledWith(101);

    // 2. Ejecuta la transacción atómica
    expect(repositoryMock.executeReassignmentTransaction).toHaveBeenCalledTimes(
      1,
    );
    expect(result.outgoingAssignment.status).toBe(
      AssignmentStatus.REASIGNED_COI,
    );
    expect(result.newAssignment.evaluatorId).toBe(25);
    expect(result.newAssignment.isAssignedForAnnex10).toBe(true);

    // 3. Dispara el evento de notificación para el evaluador entrante
    expect(eventEmitterMock.emit).toHaveBeenCalledWith(
      'evaluator.assigned',
      expect.objectContaining({
        evaluatorId: 25,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: true,
        isReassignment: true,
      }),
    );
  });

  it('should throw error when trying to replace with a heterogeneous profile', async () => {
    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL, // Perfil heterogéneo
      reason: ReassignmentReason.VENCIMIENTO,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'El evaluador de reemplazo debe pertenecer exactamente al mismo perfil que el saliente',
    );
  });

  it('should throw NotFoundException if assignment not found', async () => {
    repositoryMock.findAssignmentById.mockResolvedValue(null);

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 999,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.VENCIMIENTO,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(NotFoundException);
  });
});
