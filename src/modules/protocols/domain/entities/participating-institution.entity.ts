export class ParticipatingInstitution {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly type: 'PUBLIC' | 'PRIVATE',
    public readonly address: string,
    public readonly contactPerson: string,
    public readonly protocolId: number,
  ) {}
}
