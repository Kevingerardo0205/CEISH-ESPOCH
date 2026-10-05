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

  // ORM-like plain object (not instanceof EvaluationAssignmentEntity).
  // Uses non-dev ids: versionId=99, profileId=8 (JURIDICO in production catalog).
  const ormEntityMock = {
    id: 101,
    versionId: 99,
    evaluatorId: 15,
    profileId: 8,
    profile: { id: 8, name: 'JURIDICO' },
    version: { protocolId: 10 },
    statusId: AssignmentStatus.ASSIGNED,
    isAssignedForAnnex10: true,
    deadline: '2026-12-01',
  };

  beforeEach(() => {
    repositoryMock = {
      findAssignmentById: jest.fn().mockResolvedValue(ormEntityMock),
      findActiveAssignmentsByVersionId: jest.fn().mockResolvedValue([]),
      hasActiveProfile: jest.fn().mockResolvedValue(true),
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

  it('should successfully execute reassignment transaction with ORM entity (non-dev profileId=8) and emit notification event', async () => {
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

    // 2. Ejecuta la transacción atómica con profileId derivado de la entidad ORM
    expect(repositoryMock.executeReassignmentTransaction).toHaveBeenCalledTimes(1);
    expect(
      repositoryMock.executeReassignmentTransaction,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        newAssignment: expect.objectContaining({ profileId: 8 }),
        auditHistory: expect.objectContaining({ profileId: 8 }),
      }),
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
    // Domain entity path: profile mismatch validated by domain service
    repositoryMock.findAssignmentById.mockResolvedValue(
      new EvaluationAssignmentEntity({
        id: 101,
        protocolId: 10,
        evaluatorId: 15,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: true,
        deadlineDate: new Date(),
      }),
    );
    // Remove executeReassignmentTransaction so domain entities don't hit the ORM path
    delete repositoryMock.executeReassignmentTransaction;

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
      reason: ReassignmentReason.VENCIMIENTO,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'El evaluador de reemplazo debe pertenecer exactamente al mismo perfil que el saliente',
    );
  });

  it('should throw BadRequestException if replacement evaluator is already assigned to the protocol', async () => {
    repositoryMock.findActiveAssignmentsByVersionId.mockResolvedValue([
      { id: 102, evaluatorId: 25, statusId: AssignmentStatus.ASSIGNED },
    ]);

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'El evaluador de reemplazo ya se encuentra asignado a este protocolo.',
    );
  });

  it('should throw BadRequestException if replacement evaluator does not have the required active profile', async () => {
    repositoryMock.hasActiveProfile.mockResolvedValue(false);

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'El evaluador de reemplazo no posee el perfil requerido activo.',
    );
  });

  it('should throw BadRequestException when outgoing evaluator has Ético profile (id=7)', async () => {
    repositoryMock.findAssignmentById.mockResolvedValue({
      id: 101,
      versionId: 99,
      evaluatorId: 15,
      profileId: 7,
      profile: { id: 7, name: 'ÉTICO' },
      version: { protocolId: 10 },
      statusId: AssignmentStatus.ASSIGNED,
      isAssignedForAnnex10: false,
      deadline: '2026-12-01',
    });

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'El evaluador tiene perfil Ético (id=7), que no está soportado en el flujo de reasignación. Gestione la sustitución manualmente.',
    );
  });

  it('should throw BadRequestException when ORM entity is missing profileId and profile relation', async () => {
    repositoryMock.findAssignmentById.mockResolvedValue({
      id: 101,
      versionId: 99,
      evaluatorId: 15,
      profileId: undefined,
      profile: undefined,
      version: { protocolId: 10 },
      statusId: AssignmentStatus.ASSIGNED,
      isAssignedForAnnex10: false,
      deadline: '2026-12-01',
    });

    const dto: ReassignEvaluatorDto = {
      currentAssignmentId: 101,
      replacementEvaluatorId: 25,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
    };

    await expect(useCase.execute(dto, 1)).rejects.toThrow(
      'No se pudo determinar el perfil del evaluador saliente',
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
