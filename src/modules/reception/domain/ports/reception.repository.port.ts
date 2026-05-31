import { ReceptionOrmEntity } from '../../infrastructure/database/reception.entity.orm';
import { DocumentOrmEntity } from '../../../documents/infrastructure/database/document.entity.orm';
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
    entity: Partial<DocumentOrmEntity>,
  ): Promise<DocumentOrmEntity>;
  abstract findDocumentById(id: number): Promise<DocumentOrmEntity | null>;
  abstract findDocumentsByProtocolId(
    protocolId: number,
  ): Promise<DocumentOrmEntity[]>;

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
