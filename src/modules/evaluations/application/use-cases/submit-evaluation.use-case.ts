import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';

export interface ISubmitEvaluationRepository {
  findAssignmentsByProtocolId?(
    protocolId: number | string,
  ): Promise<(EvaluationAssignmentEntity | EvaluationAssignmentOrmEntity)[]>;
  findAssignmentsByVersionId?(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  findActiveAssignmentsByVersionId?(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  saveAssignmentStatus?(
    assignment: EvaluationAssignmentEntity,
  ): Promise<EvaluationAssignmentEntity>;
}

export class SubmitEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: ISubmitEvaluationRepository,
  ) {}

  /**
   * Verifica si el protocolo o versión cumple el 100% de la cuota de evaluaciones entregadas [RF-12.4]
   */
  public async isCompletion100Percent(
    protocolOrVersionId: number | string,
  ): Promise<boolean> {
    let assignments: (
      EvaluationAssignmentEntity | EvaluationAssignmentOrmEntity
    )[] = [];

    if (
      typeof protocolOrVersionId === 'number' &&
      this.evaluationRepository.findActiveAssignmentsByVersionId
    ) {
      assignments =
        await this.evaluationRepository.findActiveAssignmentsByVersionId(
          protocolOrVersionId,
        );
    } else if (
      typeof protocolOrVersionId === 'number' &&
      this.evaluationRepository.findAssignmentsByVersionId
    ) {
      assignments =
        await this.evaluationRepository.findAssignmentsByVersionId(
          protocolOrVersionId,
        );
    } else if (this.evaluationRepository.findAssignmentsByProtocolId) {
      assignments =
        await this.evaluationRepository.findAssignmentsByProtocolId(
          protocolOrVersionId,
        );
    }

    // Filtrar asignaciones activas (excluir desasignadas por vencimiento/COI)
    const activeAssignments = assignments.filter((a) => {
      const status =
        (a as EvaluationAssignmentEntity).status ??
        (a as EvaluationAssignmentOrmEntity).statusId;
      return (
        status === AssignmentStatus.SUGGESTED ||
        status === AssignmentStatus.ASSIGNED ||
        status === AssignmentStatus.COMPLETED
      );
    });

    if (activeAssignments.length !== 4) {
      return false;
    }

    const allCompleted = activeAssignments.every((a) => {
      const status =
        (a as EvaluationAssignmentEntity).status ??
        (a as EvaluationAssignmentOrmEntity).statusId;
      return (
        status === AssignmentStatus.COMPLETED ||
        (a as EvaluationAssignmentOrmEntity).actualSubmissionDate != null
      );
    });

    return allCompleted;
  }
}
