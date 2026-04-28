export class StudyType {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly name: string,
    public readonly evaluationDeadlineDays?: number,
    public readonly requiresArcsa?: boolean,
    public readonly reportPeriodicityDays?: number,
    public readonly requiresStartReport?: boolean,
    public readonly requiresFinalReport?: boolean,
    public readonly isActive: boolean = true,
  ) {}
}
