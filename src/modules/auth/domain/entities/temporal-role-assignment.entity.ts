export class TemporalRoleAssignment {
  constructor(
    public readonly roleCode: string,
    public readonly validFrom: Date = new Date(),
    public readonly validUntil: Date | null = null,
    public readonly reason: string | null = null,
    public readonly assignedBy: number | null = null,
  ) {
    if (!roleCode || roleCode.trim() === '') {
      throw new Error('El código de rol es obligatorio.');
    }

    if (validUntil && validUntil <= validFrom) {
      throw new Error(
        'La fecha de fin (validUntil) debe ser posterior a la fecha de inicio (validFrom).',
      );
    }

    if (validUntil && (!reason || reason.trim() === '')) {
      throw new Error(
        'El motivo de delegación es obligatorio para asignaciones temporales de rol.',
      );
    }
  }

  public isExpired(referenceDate: Date = new Date()): boolean {
    if (!this.validUntil) {
      return false; // Rol permanente
    }
    return this.validUntil.getTime() < referenceDate.getTime();
  }

  public isActive(referenceDate: Date = new Date()): boolean {
    if (this.validFrom.getTime() > referenceDate.getTime()) {
      return false; // Aún no entra en vigencia
    }
    return !this.isExpired(referenceDate);
  }
}
