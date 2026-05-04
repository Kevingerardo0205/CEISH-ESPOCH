export class ProtocolRequirement {
  constructor(
    public readonly id: number,
    public readonly requirementCode: string,
    public readonly requirementName: string,
    public readonly status: string,
    public readonly pageCount: number,
    public readonly protocolId: number,
    public readonly observations?: string,
  ) {}
}
