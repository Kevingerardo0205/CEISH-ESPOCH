import { DocumentOrmEntity } from '../../../documents/infrastructure/database/document.entity.orm';

export class DocumentMapper {
  static toResponse(orm: DocumentOrmEntity) {
    if (!orm) return null;

    // Futurización: Generar URL dinámica para el frontend
    // Si el path empieza con http, es una URL de la nube (S3/GCS), de lo contrario es local
    const baseUrl = process.env.API_URL || 'http://localhost:3002/api';
    const viewUrl =
      orm.path && orm.path.startsWith('http')
        ? orm.path
        : `${baseUrl}/reception/document/${orm.id}/view`;

    return {
      id: orm.id,
      protocolId: orm.protocolId,
      requirementId: orm.requirementId,
      fileName: orm.fileName,
      url: viewUrl, // El frontend usará este campo siempre
      path: orm.path,
      pageCount: orm.pageCount,
      sizeBytes: orm.sizeBytes,
      isConfidential: orm.isConfidential,
      isValidatedBySecretary: orm.isValidatedBySecretary,
      uploadedByUserId: orm.uploadedByUserId,
      createdAt: orm.createdAt,
    };
  }

  static toResponseList(entities: DocumentOrmEntity[]) {
    return entities.map((entity) => this.toResponse(entity));
  }
}
