import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IReceptionRepository } from '../../domain/ports/reception.repository.port';
import { ReceptionOrmEntity } from '../database/reception.entity.orm';
import { ReceptionDocumentOrmEntity } from '../database/recepcion-document.entity.orm';
import { DocumentValidationOrmEntity } from '../database/document-validation.entity.orm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';

@Injectable()
export class ReceptionTypeOrmRepository
  extends BaseTypeOrmRepository<ReceptionOrmEntity>
  implements IReceptionRepository
{
  constructor(
    @InjectRepository(ReceptionOrmEntity)
    private readonly receptionRepo: Repository<ReceptionOrmEntity>,
    @InjectRepository(ReceptionDocumentOrmEntity)
    private readonly documentRepo: Repository<ReceptionDocumentOrmEntity>,
    @InjectRepository(DocumentValidationOrmEntity)
    private readonly validationRepo: Repository<DocumentValidationOrmEntity>,
  ) {
    super(receptionRepo);
  }

  async findByProtocolId(
    protocolId: number,
  ): Promise<ReceptionOrmEntity | null> {
    return this.receptionRepo.findOne({ where: { protocolId } });
  }

  async saveDocument(
    entity: Partial<ReceptionDocumentOrmEntity>,
  ): Promise<ReceptionDocumentOrmEntity> {
    return this.documentRepo.save(entity as ReceptionDocumentOrmEntity);
  }

  async findDocumentById(
    id: number,
  ): Promise<ReceptionDocumentOrmEntity | null> {
    return this.documentRepo.findOne({ where: { id } });
  }

  async findDocumentsByProtocolId(
    protocolId: number,
  ): Promise<ReceptionDocumentOrmEntity[]> {
    return this.documentRepo.find({ where: { protocolId } });
  }

  async saveValidation(
    entity: Partial<DocumentValidationOrmEntity>,
  ): Promise<DocumentValidationOrmEntity> {
    return this.validationRepo.save(entity as DocumentValidationOrmEntity);
  }

  async findValidationsByDocumentId(
    documentId: number,
  ): Promise<DocumentValidationOrmEntity[]> {
    return this.validationRepo.find({ where: { documentId } });
  }

  async findLatestValidationsByProtocolId(
    protocolId: number,
  ): Promise<DocumentValidationOrmEntity[]> {
    // Subquery para obtener la última validación de cada documento
    return this.validationRepo
      .createQueryBuilder('v')
      .innerJoin('recepcion.documentos', 'd', 'v.documento_id = d.id')
      .where('d.protocolo_id = :protocolId', { protocolId })
      .andWhere(
        'v.id IN (SELECT MAX(id) FROM recepcion.validaciones_documento GROUP BY documento_id)',
      )
      .getMany();
  }

  async countByYearAndType(
    year: number,
    studyTypeCode: string,
  ): Promise<number> {
    const qb = this.receptionRepo
      .createQueryBuilder('r')
      .leftJoin('protocolos', 'p', 'r.protocolo_id = p.id')
      .leftJoin('catalogos.tipos_estudio', 'te', 'p.tipo_estudio_id = te.id')
      .where('EXTRACT(YEAR FROM r.fecha_recepcion) = :year', { year })
      .andWhere('te.codigo = :studyTypeCode', { studyTypeCode });

    return qb.getCount();
  }
}
