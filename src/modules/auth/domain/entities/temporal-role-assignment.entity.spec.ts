import { TemporalRoleAssignment } from './temporal-role-assignment.entity';

describe('TemporalRoleAssignment Domain Entity', () => {
  const now = new Date('2026-09-07T10:00:00Z');
  const future = new Date('2026-09-14T10:00:00Z');
  const past = new Date('2026-09-01T10:00:00Z');

  it('should create a valid permanent role assignment', () => {
    const assignment = new TemporalRoleAssignment(
      'SECRETARIA',
      now,
      null,
      null,
      1,
    );
    expect(assignment.roleCode).toBe('SECRETARIA');
    expect(assignment.isExpired(now)).toBe(false);
    expect(assignment.isActive(now)).toBe(true);
  });

  it('should create a valid active temporal role assignment', () => {
    const assignment = new TemporalRoleAssignment(
      'PRESIDENTE',
      past,
      future,
      'Suplencia por vacaciones',
      2,
    );
    expect(assignment.isExpired(now)).toBe(false);
    expect(assignment.isActive(now)).toBe(true);
  });

  it('should detect an expired temporal role assignment', () => {
    const assignment = new TemporalRoleAssignment(
      'EVALUADOR',
      past,
      now,
      'Evaluación temporal',
      2,
    );
    const later = new Date('2026-09-07T10:00:01Z');
    expect(assignment.isExpired(later)).toBe(true);
    expect(assignment.isActive(later)).toBe(false);
  });

  it('should throw error if roleCode is empty', () => {
    expect(() => new TemporalRoleAssignment('', now)).toThrow(
      'El código de rol es obligatorio.',
    );
  });

  it('should throw error if validUntil is before validFrom', () => {
    expect(
      () =>
        new TemporalRoleAssignment('SECRETARIA', future, past, 'Motivo válido'),
    ).toThrow(
      'La fecha de fin (validUntil) debe ser posterior a la fecha de inicio (validFrom).',
    );
  });

  it('should throw error if temporal role lacks reason', () => {
    expect(
      () => new TemporalRoleAssignment('SECRETARIA', past, future, ''),
    ).toThrow(
      'El motivo de delegación es obligatorio para asignaciones temporales de rol.',
    );
  });
});
