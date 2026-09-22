export class Role {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description?: string,
    public readonly permissions: Record<string, unknown> = {},
    public readonly createdAt: Date = new Date(),
  ) {}
}
