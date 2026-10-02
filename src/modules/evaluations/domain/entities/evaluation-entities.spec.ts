import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../enums/assignment-status.enum';
import { EvaluationAssignmentEntity } from './evaluation-assignment.entity';
import { AssignmentHistoryEntity } from './assignment-history.entity';

describe('Evaluation Domain Entities (TSK-002-07)', () => {
  describe('EvaluationAssignmentEntity', () => {
    it('should create a valid assignment entity with numeric IDs and Annex 10 flag', () => {
      const deadline = new Date('2026-10-15T23:59:59.999Z');
      const assignment = new EvaluationAssignmentEntity({
        id: 101,
        protocolId: 202,
        evaluatorId: 303,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: true,
        deadlineDate: deadline,
      });

      expect(assignment.id).toBe(101);
      expect(assignment.protocolId).toBe(202);
      expect(assignment.evaluatorId).toBe(303);
      expect(assignment.evaluatorProfile).toBe(EvaluatorProfile.JURIDICO);
      expect(assignment.isAssignedForAnnex10).toBe(true);
      expect(assignment.status).toBe(AssignmentStatus.ASSIGNED);
      expect(assignment.status).toBe(6);
    });

    it('should throw error if mandatory fields are missing', () => {
      expect(
        () =>
          new EvaluationAssignmentEntity({
            id: '',
            protocolId: 202,
            evaluatorId: 303,
            evaluatorProfile: EvaluatorProfile.JURIDICO,
            isAssignedForAnnex10: false,
            deadlineDate: new Date(),
          }),
      ).toThrow('El ID de asignación es obligatorio.');
    });

    it('should mark assignment as reassigned with correct numeric status', () => {
      const assignment = new EvaluationAssignmentEntity({
        id: 101,
        protocolId: 202,
        evaluatorId: 303,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        isAssignedForAnnex10: false,
        deadlineDate: new Date(),
      });

      assignment.markAsReassigned(AssignmentStatus.REASIGNED_COI);
      expect(assignment.status).toBe(AssignmentStatus.REASIGNED_COI);
      expect(assignment.status).toBe(27);
    });
  });

  describe('AssignmentHistoryEntity', () => {
    it('should create a valid immutable audit history record with numeric IDs', () => {
      const now = new Date();
      const history = new AssignmentHistoryEntity({
        id: 1,
        previousAssignmentId: 101,
        previousEvaluatorId: 303,
        evaluatorProfile: EvaluatorProfile.JURIDICO,
        reassignmentReason: ReassignmentReason.CONFLICTO_INTERES,
        newEvaluatorId: 404,
        executedBy: 15,
        executedAt: now,
      });

      expect(history.id).toBe(1);
      expect(history.previousAssignmentId).toBe(101);
      expect(history.previousEvaluatorId).toBe(303);
      expect(history.reassignmentReason).toBe(
        ReassignmentReason.CONFLICTO_INTERES,
      );
      expect(history.executedBy).toBe(15);
    });

    it('should throw error if history missing executor or previous IDs', () => {
      expect(
        () =>
          new AssignmentHistoryEntity({
            id: 1,
            previousAssignmentId: 101,
            previousEvaluatorId: 303,
            evaluatorProfile: EvaluatorProfile.JURIDICO,
            reassignmentReason: ReassignmentReason.CONFLICTO_INTERES,
            newEvaluatorId: 404,
            executedBy: '',
            executedAt: new Date(),
          }),
      ).toThrow('El usuario administrativo ejecutor es obligatorio.');
    });
  });
});
