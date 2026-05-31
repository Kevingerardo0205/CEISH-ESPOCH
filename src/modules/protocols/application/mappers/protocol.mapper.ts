import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { InvestigatorMapper } from './investigator.mapper';
import { InstitutionMapper } from './institution.mapper';
import { RequirementMapper } from './requirement.mapper';

export class ProtocolMapper {
  static toResponse(orm: ProtocolOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      ceishCode: orm.ceishCode,
      title: orm.title,
      version: orm.version,
      studyType: orm.studyType?.name,
      studyTypeCode: orm.studyType?.code,
      riskLevel: orm.riskLevel?.name,
      receptionStatus: orm.receptionStatus,
      reviewType: orm.reviewType,

      // Dates
      receptionDate: orm.receptionDate,
      submissionDeadline: orm.submissionDeadline,
      responseDeadline: orm.responseDeadline,
      approvalDate: orm.approvalDate,
      expirationDate: orm.expirationDate,
      completionDate: orm.completionDate,
      renewalRequestDeadline: orm.renewalRequestDeadline,

      // Financial
      financingAmount: orm.financingAmount,
      financingSources: orm.financingSources,

      // Flags
      isVulnerablePopulation: orm.isVulnerablePopulation,
      usesBiologicalSamples: orm.usesBiologicalSamples,
      isMulticentric: orm.isMulticentric,
      currentVersion: orm.currentVersion,
      isTimelineTermsAccepted: orm.isTimelineTermsAccepted,
      timelineTermsAcceptedAt: orm.timelineTermsAcceptedAt,
      timelineTermsAcceptedIp: orm.timelineTermsAcceptedIp,

      // Control
      missingRequirements: orm.missingRequirements,
      isPresidentNotified: orm.isPresidentNotified,
      presidentNotificationDate: orm.presidentNotificationDate,

      // Relations
      investigators: orm.investigators?.map((inv) =>
        InvestigatorMapper.toResponse(inv),
      ),
      institutions: orm.institutions?.map((inst) =>
        InstitutionMapper.toResponse(inst),
      ),
      checklist: orm.checklist?.map((req) => RequirementMapper.toResponse(req)),

      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }
}
