import { User } from '../../../auth/domain/entities/user.entity';
import { StudyType } from '../enums/study-type.enum';
import { RiskLevel } from '../value-objects/risk-level.vo';
import { GeographicCoverage } from '../enums/geographic-coverage.enum';
import { ReceptionStatus } from '../enums/reception-status.enum';
import { Investigator } from './investigator.entity';
import { ParticipatingInstitution } from './participating-institution.entity';
import { ProtocolRequirement } from './protocol-requirement.entity';

export class Protocol {
  constructor(
    public readonly id: number,
    public readonly ceishCode: string,
    public readonly principalInvestigatorId: number,
    public readonly title?: string,
    public readonly studyTypeId?: number,
    public readonly riskLevelId?: number,
    public readonly statusId?: number,
    
    // PET specific fields
    public readonly version: string = '1.0',
    public readonly receptionDate?: Date,
    public readonly financingAmount?: number,
    public readonly financingSources?: string,
    public readonly estimatedStartDate?: Date,
    public readonly estimatedEndDate?: Date,
    public readonly geographicCoverage?: GeographicCoverage,
    public readonly studyDurationMonths?: number,
    
    // Reception Status Fields
    public readonly receptionStatus: ReceptionStatus = ReceptionStatus.PENDIENTE_SUBSANACION,
    public readonly missingRequirements?: string,
    public readonly submissionDeadline?: Date, // 15 business days for missing requirements
    public readonly responseDeadline?: Date,   // 45 or 60 business days
    
    // Notifications and Certificates
    public readonly isPresidentNotified: boolean = false,
    public readonly presidentNotificationDate?: Date,
    public readonly isInvestigatorNotified: boolean = false,
    public readonly investigatorNotificationDate?: Date,
    public readonly isReceptionCertificateIssued: boolean = false,
    public readonly receptionCertificateDate?: Date,
    
    // Flags from original
    public readonly isVulnerablePopulation: boolean = false,
    public readonly usesBiologicalSamples: boolean = false,
    public readonly isMulticentric: boolean = false,
    public readonly currentVersion: number = 1,
    
    // Relations (Optional)
    public readonly principalInvestigator?: User,
    public readonly studyType?: StudyType,
    public readonly riskLevel?: RiskLevel,
    public readonly investigators: Investigator[] = [],
    public readonly institutions: ParticipatingInstitution[] = [],
    public readonly checklist: ProtocolRequirement[] = [],
    
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
