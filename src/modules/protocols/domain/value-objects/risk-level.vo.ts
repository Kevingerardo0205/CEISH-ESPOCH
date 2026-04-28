export class RiskLevel {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly name?: string,
    public readonly reviewType?: string,
    public readonly isActive: boolean = true,
  ) {}
}
