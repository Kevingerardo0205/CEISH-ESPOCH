import { DocumentValidationOrmEntity } from '../../infrastructure/database/document-validation.entity.orm';

export class DocumentValidationMapper {
  static toResponse(orm: DocumentValidationOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      documentId: orm.documentId,
      statusId: orm.statusId,
      observations: orm.observations,
      validatedByUserId: orm.validatedByUserId,
      validationDate: orm.validationDate,
    };
  }
}
