import { EvaluatorReassignmentService } from './evaluator-reassignment.service';
import { EvaluationAssignmentEntity } from '../entities/evaluation-assignment.entity';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../enums/assignment-status.enum';

describe('EvaluatorReassignmentService (TSK-002-07)', () => {
  const currentAssignment = new EvaluationAssignmentEntity({
    id: 101,
    protocolId: 202,
    evaluatorId: 303,
    evaluatorProfile: EvaluatorProfile.JURIDICO,
    isAssignedForAnnex10: true,
    deadlineDate: new Date('2026-10-01T23:59:59.999Z'),
  });

  it('should successfully execute reassignment with numeric IDs and numeric AssignmentStatus', () => {
    const result = EvaluatorReassignmentService.executeReassignment({
      currentAssignment,
      replacementEvaluatorId: 404,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
      adminUserId: 15,
      standardFullDays: 15,
      holidays: [],
      newAssignmentId: 102,
      historyId: 1,
    });

    // 1. Asignación saliente se marca con estado numérico inmutable correcto (27: REASIGNED_COI)
    expect(result.outgoingAssignment.status).toBe(
      AssignmentStatus.REASIGNED_COI,
    );
    expect(result.outgoingAssignment.status).toBe(27);

    // 2. Asignación entrante conserva el perfil y la bandera de Anexo 10
    expect(result.newAssignment.evaluatorId).toBe(404);
    expect(result.newAssignment.evaluatorProfile).toBe(
      EvaluatorProfile.JURIDICO,
    );
    expect(result.newAssignment.isAssignedForAnnex10).toBe(true);
    expect(result.newAssignment.status).toBe(AssignmentStatus.ASSIGNED);
    expect(result.newAssignment.status).toBe(6);

    // 3. Registro de historial inmutable
    expect(result.auditHistory.previousAssignmentId).toBe(101);
    expect(result.auditHistory.reassignmentReason).toBe(
      ReassignmentReason.CONFLICTO_INTERES,
    );
    expect(result.auditHistory.executedBy).toBe(15);
  });

  it('should THROW ERROR if replacement evaluator belongs to a DIFFERENT profile', () => {
    expect(() =>
      EvaluatorReassignmentService.executeReassignment({
        currentAssignment,
        replacementEvaluatorId: 505,
        replacementEvaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
        reason: ReassignmentReason.VENCIMIENTO,
        adminUserId: 15,
        standardFullDays: 15,
        holidays: [],
        newAssignmentId: 103,
        historyId: 2,
      }),
    ).toThrow(
      'El evaluador de reemplazo debe pertenecer exactamente al mismo perfil que el saliente (JURIDICO).',
    );
  });
});
