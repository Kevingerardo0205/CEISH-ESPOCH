import { User } from '../../../auth/domain/entities/user.entity';
import { StudyType } from '../enums/study-type.enum';
import { RiskLevel } from '../value-objects/risk-level.vo';

export class Protocol {
  constructor(
    public readonly id: number,
    public readonly ceishCode: string,
    public readonly principalInvestigator: User,
    public readonly principalInvestigatorId: number,
    public readonly title?: string,
    public readonly studyType?: StudyType,
    public readonly studyTypeId?: number,
    public readonly riskLevel?: RiskLevel,
    public readonly riskLevelId?: number,
    public readonly statusId?: number,
    public readonly receptionDate?: Date,
    public readonly approvalDate?: Date,
    public readonly expirationDate?: Date,
    public readonly completionDate?: Date,
    public readonly studyDurationMonths?: number,
    public readonly isVulnerablePopulation: boolean = false,
    public readonly usesBiologicalSamples: boolean = false,
    public readonly isMulticentric: boolean = false,
    public readonly currentVersion: number = 1,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
