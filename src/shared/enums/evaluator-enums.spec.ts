import {
  EvaluatorProfile,
  AssignmentStatus,
  ReassignmentReason,
} from './evaluator-enums';

describe('Evaluator Domain Enums (TSK-002-01)', () => {
  it('should define all 4 mandatory evaluator profiles', () => {
    expect(EvaluatorProfile.JURIDICO).toBe('JURIDICO');
    expect(EvaluatorProfile.SOCIEDAD_CIVIL).toBe('SOCIEDAD_CIVIL');
    expect(EvaluatorProfile.METODOLOGICO).toBe('METODOLOGICO');
    expect(EvaluatorProfile.SALUD).toBe('SALUD');
  });

  it('should define all mandatory assignment statuses', () => {
    expect(AssignmentStatus.ASSIGNED).toBe('ASSIGNED');
    expect(AssignmentStatus.SUBMITTED).toBe('SUBMITTED');
    expect(AssignmentStatus.REASIGNED_VENCIMIENTO).toBe(
      'REASIGNED_VENCIMIENTO',
    );
    expect(AssignmentStatus.REASIGNED_COI).toBe('REASIGNED_COI');
  });

  it('should define all mandatory reassignment reasons', () => {
    expect(ReassignmentReason.VENCIMIENTO).toBe('VENCIMIENTO');
    expect(ReassignmentReason.CONFLICTO_INTERES).toBe('CONFLICTO_INTERES');
  });
});
