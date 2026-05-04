import { ReceptionOrmEntity } from '../../infrastructure/database/reception.entity.orm';

export class ReceptionMapper {
  static toResponse(orm: ReceptionOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      protocolId: orm.protocolId,
      receptionDate: orm.receptionDate,
      statusId: orm.statusId,
      hasMissingItems: orm.hasMissingItems,
      missingItemsList: orm.missingItemsList,
      missingItemsNotificationDate: orm.missingItemsNotificationDate,
      completionDeadlineDays: orm.completionDeadlineDays,
      completionDeadlineDate: orm.completionDeadlineDate,
      isCertificateIssued: orm.isCertificateIssued,
      certificateDate: orm.certificateDate,
      responseDeadlineDays: orm.responseDeadlineDays,
      generatedCeishCode: orm.generatedCeishCode,
      observations: orm.observations,
      createdByUserId: orm.createdByUserId,
    };
  }
}
