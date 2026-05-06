export class InvestigatorProfile {
  constructor(
    public readonly id: number | null,
    public readonly userId: number,
    public readonly personalEmail: string | null = null,
    public readonly phone: string | null = null,
    public readonly institution: string | null = null,
    public readonly position: string | null = null,
    public readonly senescytRegistration: string | null = null,
  ) {}
}
