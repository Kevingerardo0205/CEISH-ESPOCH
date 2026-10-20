/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { SubmitEvaluationUseCase } from './submit-evaluation.use-case';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';

const PROTOCOL_ID = 169;
const VERSION_ID = 141;

function makeAssignment(
  id: number,
  statusId: AssignmentStatus,
): EvaluationAssignmentOrmEntity {
  return {
    id,
    statusId,
    versionId: VERSION_ID,
  } as EvaluationAssignmentOrmEntity;
}

const COMPLETED_4 = [
  makeAssignment(81, AssignmentStatus.COMPLETED),
  makeAssignment(83, AssignmentStatus.COMPLETED),
  makeAssignment(84, AssignmentStatus.COMPLETED),
  makeAssignment(85, AssignmentStatus.COMPLETED),
];

describe('SubmitEvaluationUseCase (TSK-002-N33)', () => {
  let evalRepoMock: { findActiveAssignmentsByVersionId: jest.Mock };
  let protocolRepoMock: { findById: jest.Mock; update?: jest.Mock };
  let useCase: SubmitEvaluationUseCase;

  beforeEach(() => {
    evalRepoMock = {
      findActiveAssignmentsByVersionId: jest
        .fn()
        .mockResolvedValue([...COMPLETED_4]),
    };
    protocolRepoMock = {
      findById: jest.fn().mockResolvedValue({
        id: PROTOCOL_ID,
        versionActualId: VERSION_ID,
        isRiskLevelDesignated: true,
      }),
    };
    useCase = new SubmitEvaluationUseCase(
      evalRepoMock,
      protocolRepoMock as any,
    );
  });

  it('CS-U-01: protocolo 169 (versión 141; 4 asignaciones COMPLETED; 1 REASIGNADO_COI fuera del repo activo; nivel designado en pleno) → true', async () => {
    // findActiveAssignmentsByVersionId ya excluye REASIGNADO_COI=27; devuelve 4.
    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(true);
    expect(protocolRepoMock.findById).toHaveBeenCalledWith(PROTOCOL_ID);
    expect(evalRepoMock.findActiveAssignmentsByVersionId).toHaveBeenCalledWith(
      VERSION_ID,
    );
  });

  it('CS-U-02: 4 asignaciones COMPLETED pero isRiskLevelDesignated = false → false', async () => {
    protocolRepoMock.findById.mockResolvedValue({
      id: PROTOCOL_ID,
      versionActualId: VERSION_ID,
      isRiskLevelDesignated: false,
    });

    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(false);
    expect(
      evalRepoMock.findActiveAssignmentsByVersionId,
    ).not.toHaveBeenCalled();
  });

  it('CS-U-03: solo 3 asignaciones activas COMPLETED → false', async () => {
    evalRepoMock.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment(81, AssignmentStatus.COMPLETED),
      makeAssignment(83, AssignmentStatus.COMPLETED),
      makeAssignment(84, AssignmentStatus.COMPLETED),
    ]);

    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(false);
  });

  it('CS-U-04: más de 4 asignaciones activas → false', async () => {
    evalRepoMock.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment(81, AssignmentStatus.COMPLETED),
      makeAssignment(83, AssignmentStatus.COMPLETED),
      makeAssignment(84, AssignmentStatus.COMPLETED),
      makeAssignment(85, AssignmentStatus.COMPLETED),
      makeAssignment(86, AssignmentStatus.ASSIGNED),
    ]);

    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(false);
  });

  it('CS-U-05: protocolo no encontrado → NotFoundException', async () => {
    protocolRepoMock.findById.mockResolvedValue(null);

    await expect(
      useCase.isCompletion100PercentByProtocolId(999),
    ).rejects.toThrow(NotFoundException);
  });

  it('CS-U-06: versionActualId undefined → false sin consultar asignaciones', async () => {
    protocolRepoMock.findById.mockResolvedValue({
      id: PROTOCOL_ID,
      versionActualId: undefined,
      isRiskLevelDesignated: true,
    });

    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(false);
    expect(
      evalRepoMock.findActiveAssignmentsByVersionId,
    ).not.toHaveBeenCalled();
  });

  it('CS-U-07: 4 activas pero una en ASSIGNED → false', async () => {
    evalRepoMock.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment(81, AssignmentStatus.COMPLETED),
      makeAssignment(83, AssignmentStatus.COMPLETED),
      makeAssignment(84, AssignmentStatus.COMPLETED),
      makeAssignment(85, AssignmentStatus.ASSIGNED),
    ]);

    const result =
      await useCase.isCompletion100PercentByProtocolId(PROTOCOL_ID);

    expect(result).toBe(false);
  });

  describe('finalizeIfComplete (TSK-002-N34)', () => {
    it('CS-F-01: protocolo 169 completo (4 COMPLETED + isRiskLevelDesignated) → advanced: true y llama protocolRepository.update con statusId=14', async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);
      protocolRepoMock = {
        findById: jest.fn().mockResolvedValue({
          id: PROTOCOL_ID,
          versionActualId: VERSION_ID,
          isRiskLevelDesignated: true,
        }),
        update: updateMock,
      };
      useCase = new SubmitEvaluationUseCase(
        evalRepoMock,
        protocolRepoMock as any,
      );

      const result = await useCase.finalizeIfComplete(PROTOCOL_ID);

      expect(result.advanced).toBe(true);
      expect(result.protocolId).toBe(PROTOCOL_ID);
      expect(updateMock).toHaveBeenCalledWith(PROTOCOL_ID, { statusId: 14 });
    });

    it('CS-F-02: protocolo sin isRiskLevelDesignated → advanced: false; no llama update', async () => {
      const updateMock = jest.fn();
      protocolRepoMock = {
        findById: jest.fn().mockResolvedValue({
          id: PROTOCOL_ID,
          versionActualId: VERSION_ID,
          isRiskLevelDesignated: false,
        }),
        update: updateMock,
      };
      useCase = new SubmitEvaluationUseCase(
        evalRepoMock,
        protocolRepoMock as any,
      );

      const result = await useCase.finalizeIfComplete(PROTOCOL_ID);

      expect(result.advanced).toBe(false);
      expect(updateMock).not.toHaveBeenCalled();
    });
  });
});
