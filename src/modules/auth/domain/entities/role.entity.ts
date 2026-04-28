export class Role {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description?: string,
    public readonly permissions: any = {},
    public readonly createdAt: Date = new Date(),
  ) {}
}
