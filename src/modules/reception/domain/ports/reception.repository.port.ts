import { ReceptionOrmEntity } from '../../infrastructure/database/reception.entity.orm';
import { ReceptionDocumentOrmEntity } from '../../infrastructure/database/recepcion-document.entity.orm';
import { DocumentValidationOrmEntity } from '../../infrastructure/database/document-validation.entity.orm';

export abstract class IReceptionRepository {
  abstract findById(id: number): Promise<ReceptionOrmEntity | null>;
  abstract findByProtocolId(
    protocolId: number,
  ): Promise<ReceptionOrmEntity | null>;
  abstract save(
    entity: Partial<ReceptionOrmEntity>,
  ): Promise<ReceptionOrmEntity>;

  abstract saveDocument(
    entity: Partial<ReceptionDocumentOrmEntity>,
  ): Promise<ReceptionDocumentOrmEntity>;
  abstract findDocumentById(
    id: number,
  ): Promise<ReceptionDocumentOrmEntity | null>;
  abstract findDocumentsByProtocolId(
    protocolId: number,
  ): Promise<ReceptionDocumentOrmEntity[]>;

  abstract saveValidation(
    entity: Partial<DocumentValidationOrmEntity>,
  ): Promise<DocumentValidationOrmEntity>;
  abstract findValidationsByDocumentId(
    documentId: number,
  ): Promise<DocumentValidationOrmEntity[]>;

  abstract findLatestValidationsByProtocolId(
    protocolId: number,
  ): Promise<DocumentValidationOrmEntity[]>;

  abstract countByYearAndType(
    year: number,
    studyTypeCode: string,
  ): Promise<number>;
}
