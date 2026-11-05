import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { InvestigatorMapper } from './investigator.mapper';
import { InstitutionMapper } from './institution.mapper';
import { RequirementMapper } from './requirement.mapper';
import { ProtocolStage } from '../../domain/enums/protocol-stage.enum';
import { resolveProtocolStage } from '../../domain/services/resolve-protocol-stage';

export interface ProtocolStageFields {
  etapa: ProtocolStage | null;
  etapaOrden: number | null;
}

export class ProtocolMapper {
  /**
   * Etapa del protocolo (RF-EST.1/RF-EST.2, TSK-001.2). Requiere que la consulta haya
   * cargado `status`, `activeVersion.reception.status` y `activeVersion.resolutions`.
   */
  static toStage(orm: ProtocolOrmEntity): ProtocolStageFields {
    const { stage, order } = resolveProtocolStage(
      orm.status,
      orm.activeVersion?.reception?.status,
      (orm.activeVersion?.resolutions?.length ?? 0) > 0,
    );
    return { etapa: stage, etapaOrden: order };
  }

  /**
   * Respuesta de los listados de GET /protocols: toResponse + etapa y etapaOrden
   * (TSK-001.2) + principalInvestigator (TSK-001.4), desde la relación ya cargada.
   */
  static toListResponse(orm: ProtocolOrmEntity) {
    if (!orm) return null;
    return {
      ...ProtocolMapper.toResponse(orm),
      ...ProtocolMapper.toStage(orm),
      principalInvestigator: orm.principalInvestigator
        ? {
            id: orm.principalInvestigator.id,
            fullName: orm.principalInvestigator.fullName,
          }
        : null,
    };
  }

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
      statusId: orm.statusId,
      versionLock: orm.versionLock,

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
