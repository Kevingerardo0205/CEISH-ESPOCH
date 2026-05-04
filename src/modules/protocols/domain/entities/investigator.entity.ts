import { InvestigatorRole } from '../enums/investigator-role.enum';

export class Investigator {
  constructor(
    public readonly id: number,
    public readonly fullName: string,
    public readonly identification: string,
    public readonly position: string,
    public readonly institution: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly education: string,
    public readonly role: InvestigatorRole,
    public readonly userId?: number,
  ) {}
}
