import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { IProtocolRepository } from '../../domain/ports/protocol.repository.port';
import { ProtocolOrmEntity } from '../database/protocol.entity.orm';
import { QueryProtocolDto } from '../../application/dtos/query-protocol.dto';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';
import { getPaginationParams } from '../../../../shared/db/pagination.helper';
import { ReceptionStatus } from '../../domain/enums/reception-status.enum';

@Injectable()
export class ProtocolTypeOrmRepository
  extends BaseTypeOrmRepository<ProtocolOrmEntity>
  implements IProtocolRepository
{
  constructor(
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolsRepo: Repository<ProtocolOrmEntity>,
  ) {
    super(protocolsRepo);
  }

  async findById(id: number, options?: any): Promise<ProtocolOrmEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['checklist', 'reception', 'versions'],
      ...options,
    });
  }

  async findProtocolsForReception(): Promise<ProtocolOrmEntity[]> {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.studyType', 'studyType')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .leftJoinAndSelect('p.reception', 'reception')
      .where('reception.statusId IS NOT NULL')
      .orderBy('reception.receptionDate', 'DESC')
      .getMany();
  }

  async findAll(
    query: QueryProtocolDto,
  ): Promise<[ProtocolOrmEntity[], number]> {
    const { page, limit, skip } = getPaginationParams(query);
    const { studyType, receptionStatus, reviewType } = query;

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.studyType', 'studyType')
      .leftJoinAndSelect('p.riskLevel', 'riskLevel')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .leftJoinAndSelect('p.investigators', 'investigators')
      .leftJoinAndSelect('p.institutions', 'institutions')
      .leftJoinAndSelect('p.checklist', 'checklist')
      .leftJoinAndSelect('p.reception', 'reception')
      .leftJoinAndSelect('p.versions', 'versions');

    if (studyType) qb.andWhere('studyType.code = :studyType', { studyType });
    if (receptionStatus) {
      let statusId = 1;
      if (receptionStatus === ReceptionStatus.COMPLETO) statusId = 2;
      else if (receptionStatus === ReceptionStatus.INCOMPLETO) statusId = 3;
      else if (receptionStatus === ReceptionStatus.EN_REVISION_SECRETARIA)
        statusId = 5;
      else if (receptionStatus === ('ARCHIVADO' as any)) statusId = 4;
      qb.andWhere('reception.statusId = :statusId', { statusId });
    }
    if (reviewType) qb.andWhere('p.reviewType = :reviewType', { reviewType });

    if (query.investigatorId) {
      qb.andWhere(
        '(p.principalInvestigatorId = :invId OR investigators.userId = :invId)',
        { invId: query.investigatorId },
      );
    }

    qb.skip(skip).take(limit);
    qb.orderBy('reception.receptionDate', 'DESC');

    return qb.getManyAndCount();
  }

  async countByYear(year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    return this.repo.count({
      where: {
        reception: {
          receptionDate: Between(startOfYear, endOfYear),
        },
      },
      relations: ['reception'],
    });
  }
}
