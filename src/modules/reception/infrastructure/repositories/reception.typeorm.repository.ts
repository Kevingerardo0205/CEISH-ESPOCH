import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IReceptionRepository } from '../../domain/ports/reception.repository.port';
import { ReceptionOrmEntity } from '../database/reception.entity.orm';
import { DocumentOrmEntity } from '../../../documents/infrastructure/database/document.entity.orm';
import { DocumentValidationOrmEntity } from '../database/document-validation.entity.orm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';

@Injectable()
export class ReceptionTypeOrmRepository
  extends BaseTypeOrmRepository<ReceptionOrmEntity>
  implements IReceptionRepository
{
  constructor(
    @InjectRepository(ReceptionOrmEntity)
    private readonly receptionRepo: Repository<ReceptionOrmEntity>,
    @InjectRepository(DocumentOrmEntity)
    private readonly documentRepo: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentValidationOrmEntity)
    private readonly validationRepo: Repository<DocumentValidationOrmEntity>,
  ) {
    super(receptionRepo);
  }

  override async findById(id: number): Promise<ReceptionOrmEntity | null> {
    return this.receptionRepo.findOne({
      where: { id },
      relations: ['version', 'version.protocol'],
    });
  }

  async findByProtocolId(
    protocolId: number,
  ): Promise<ReceptionOrmEntity | null> {
    return this.receptionRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.version', 'version')
      .innerJoinAndSelect('version.protocol', 'protocol')
      .where('protocol.id = :protocolId', { protocolId })
      .andWhere('version.id = protocol.versionActualId')
      .getOne();
  }

  async findByVersionId(versionId: number): Promise<ReceptionOrmEntity | null> {
    return this.receptionRepo.findOne({
      where: { versionId },
      relations: ['version', 'version.protocol'],
    });
  }

  async saveDocument(
    entity: Partial<DocumentOrmEntity>,
  ): Promise<DocumentOrmEntity> {
    return this.documentRepo.save(entity as DocumentOrmEntity);
  }

  async findDocumentById(id: number): Promise<DocumentOrmEntity | null> {
    return this.documentRepo.findOne({ where: { id } });
  }

  async findDocumentsByProtocolId(
    protocolId: number,
  ): Promise<DocumentOrmEntity[]> {
    return this.documentRepo
      .createQueryBuilder('d')
      .innerJoin(ProtocolOrmEntity, 'p', 'd.protocolo_id = p.id')
      .where('p.id = :protocolId', { protocolId })
      .andWhere('d.version_id = p.version_actual_id')
      .leftJoinAndSelect('d.requirement', 'requirement')
      .leftJoinAndSelect('d.tipoDocumento', 'tipoDocumento')
      .getMany();
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
    return this.validationRepo
      .createQueryBuilder('v')
      .innerJoin(DocumentOrmEntity, 'd', 'v.documento_id = d.id')
      .innerJoin(ProtocolOrmEntity, 'p', 'd.protocolo_id = p.id')
      .where('p.id = :protocolId', { protocolId })
      .andWhere('d.version_id = p.version_actual_id')
      .getMany();
  }

  async countByYearAndType(
    year: number,
    studyTypeCode: string,
  ): Promise<number> {
    const qb = this.receptionRepo
      .createQueryBuilder('r')
      .leftJoin('public.versiones_protocolo', 'vp', 'r.version_id = vp.id')
      .leftJoin('public.protocolos', 'p', 'vp.protocolo_id = p.id')
      .leftJoin('catalogos.tipos_estudio', 'te', 'p.tipo_estudio_id = te.id')
      .where('EXTRACT(YEAR FROM r.fecha_recepcion) = :year', { year })
      .andWhere('te.codigo = :studyTypeCode', { studyTypeCode });

    return qb.getCount();
  }

  async generateCeishCode(studyTypeId: number, year: number): Promise<string> {
    const result = await this.repo.query(
      'SELECT catalogos.generate_codigo_ceish($1, $2) as code',
      [studyTypeId, year],
    );
    return result[0]?.code;
  }
}
