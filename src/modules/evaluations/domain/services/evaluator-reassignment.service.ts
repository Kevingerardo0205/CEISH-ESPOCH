import { EvaluationAssignmentEntity } from '../entities/evaluation-assignment.entity';
import { AssignmentHistoryEntity } from '../entities/assignment-history.entity';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../enums/assignment-status.enum';
export interface ExecuteReassignmentParams {
  currentAssignment: EvaluationAssignmentEntity;
  replacementEvaluatorId: number | string;
  replacementEvaluatorProfile: EvaluatorProfile;
  reason: ReassignmentReason;
  adminUserId: number | string;
  deadline?: string | null;
  newAssignmentId?: number | string;
  historyId?: number | string;
  justification?: string;
}

export interface ReassignmentResult {
  outgoingAssignment: EvaluationAssignmentEntity;
  newAssignment: EvaluationAssignmentEntity;
  auditHistory: AssignmentHistoryEntity;
}

export class EvaluatorReassignmentService {
  /**
   * Ejecuta la reasignación inmutable de un evaluador sustituido por VENCIMIENTO o CONFLICTO_INTERES.
   * Exige estricta homogeneidad de perfil. El reemplazante hereda la fecha_entrega_evaluacion
   * de la convocatoria activa (RF-12.7(e)); si el protocolo no está agendado, queda null. [RF-12.3]
   */
  public static executeReassignment(
    params: ExecuteReassignmentParams,
  ): ReassignmentResult {
    const { currentAssignment, replacementEvaluatorProfile } = params;

    if (replacementEvaluatorProfile !== currentAssignment.evaluatorProfile) {
      throw new Error(
        `El evaluador de reemplazo debe pertenecer exactamente al mismo perfil que el saliente (${currentAssignment.evaluatorProfile}).`,
      );
    }

    const outgoingStatus =
      params.reason === ReassignmentReason.CONFLICTO_INTERES
        ? AssignmentStatus.REASIGNED_COI
        : AssignmentStatus.REASIGNED_VENCIMIENTO;

    currentAssignment.markAsReassigned(outgoingStatus);

    const newAssignment = new EvaluationAssignmentEntity({
      id: params.newAssignmentId,
      protocolId: currentAssignment.protocolId,
      evaluatorId: params.replacementEvaluatorId,
      evaluatorProfile: params.replacementEvaluatorProfile,
      isAssignedForAnnex10: currentAssignment.isAssignedForAnnex10,
      deadlineDate: params.deadline ?? null,
      status: AssignmentStatus.ASSIGNED,
    });

    const auditHistory = new AssignmentHistoryEntity({
      id: params.historyId,
      previousAssignmentId: currentAssignment.id ?? 0,
      previousEvaluatorId: currentAssignment.evaluatorId,
      evaluatorProfile: currentAssignment.evaluatorProfile,
      reassignmentReason: params.reason,
      newEvaluatorId: params.replacementEvaluatorId,
      newAssignmentId: params.newAssignmentId,
      executedBy: params.adminUserId,
      executedAt: new Date(),
      justification: params.justification,
    });

    return {
      outgoingAssignment: currentAssignment,
      newAssignment,
      auditHistory,
    };
  }
}
