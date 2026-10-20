import { NotFoundException } from '@nestjs/common';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';

export interface ISubmitEvaluationRepository {
  findActiveAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
}

export class SubmitEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: ISubmitEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
  ) {}

  /**
   * Verifica si el protocolo cumple el 100% de completitud para emitir resolución [RF-12.4].
   * Condiciones: isRiskLevelDesignated = true Y las 4 asignaciones activas de versionActualId
   * están todas en COMPLETED. Asignaciones REASIGNADO_COI/REASIGNADO_VENCIMIENTO no cuentan.
   */
  public async isCompletion100PercentByProtocolId(
    protocolId: number,
  ): Promise<boolean> {
    const protocol = await this.protocolRepository.findById(protocolId);
    if (!protocol) {
      throw new NotFoundException(
        `Protocolo con ID ${protocolId} no encontrado.`,
      );
    }

    if (!protocol.isRiskLevelDesignated) {
      return false;
    }

    if (!protocol.versionActualId) {
      return false;
    }

    const assignments =
      await this.evaluationRepository.findActiveAssignmentsByVersionId(
        protocol.versionActualId,
      );

    if (assignments.length !== 4) {
      return false;
    }

    return assignments.every((a) => a.statusId === +AssignmentStatus.COMPLETED);
  }

  /**
   * Avanza el protocolo a EVALUADO (statusId=14) si cumple RF-12.4.
   * Idempotente: si ya está en 14 o las condiciones no se cumplen, no modifica nada.
   * Usado para reparar protocolos que ya tienen 4 dictámenes entregados pero cuyo
   * statusId no se actualizó por el bug TSK-002-N34.
   */
  public async finalizeIfComplete(
    protocolId: number,
  ): Promise<{ protocolId: number; advanced: boolean; message: string }> {
    const isComplete =
      await this.isCompletion100PercentByProtocolId(protocolId);
    if (!isComplete) {
      return {
        protocolId,
        advanced: false,
        message: 'El protocolo no cumple aún las condiciones para EVALUADO.',
      };
    }
    await this.protocolRepository.update(protocolId, { statusId: 14 });
    return {
      protocolId,
      advanced: true,
      message: 'Protocolo avanzado a EVALUADO (statusId=14).',
    };
  }
}
