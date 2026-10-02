import { EvaluationAssignmentEntity } from '../entities/evaluation-assignment.entity';
import { AssignmentHistoryEntity } from '../entities/assignment-history.entity';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../enums/assignment-status.enum';
import { BusinessDayCalculator } from '../../../../shared/services/deadline-calculator.service';

export interface ExecuteReassignmentParams {
  currentAssignment: EvaluationAssignmentEntity;
  replacementEvaluatorId: number | string;
  replacementEvaluatorProfile: EvaluatorProfile;
  reason: ReassignmentReason;
  adminUserId: number | string;
  standardFullDays: number;
  holidays: string[];
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
   * Exige estricta homogeneidad de perfil y reinicia el plazo operativo completo a 15 días hábiles. [RF-12.3]
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

    const newDeadline = BusinessDayCalculator.calculateDeadline({
      startDate: new Date(),
      businessDaysToAdd: params.standardFullDays,
      holidays: params.holidays,
    });

    const newAssignment = new EvaluationAssignmentEntity({
      id: params.newAssignmentId,
      protocolId: currentAssignment.protocolId,
      evaluatorId: params.replacementEvaluatorId,
      evaluatorProfile: params.replacementEvaluatorProfile,
      isAssignedForAnnex10: currentAssignment.isAssignedForAnnex10,
      deadlineDate: newDeadline,
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
