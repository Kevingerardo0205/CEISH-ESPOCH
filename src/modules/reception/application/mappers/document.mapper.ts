import { ReceptionDocumentOrmEntity } from '../../infrastructure/database/recepcion-document.entity.orm';

export class DocumentMapper {
  static toResponse(orm: ReceptionDocumentOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      protocolId: orm.protocolId,
      requirementId: orm.requirementId,
      fileName: orm.fileName,
      path: orm.path,
      pageCount: orm.pageCount,
      sizeBytes: orm.sizeBytes,
      isConfidential: orm.isConfidential,
      isValidatedBySecretary: orm.isValidatedBySecretary,
      uploadedByUserId: orm.uploadedByUserId,
      createdAt: orm.createdAt,
      // Se podría expandir para incluir la relación con el catálogo o el requisito si fuera necesario
    };
  }

  static toResponseList(entities: ReceptionDocumentOrmEntity[]) {
    return entities.map((entity) => this.toResponse(entity));
  }
}
