import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { IProtocolRepository } from '../../domain/ports/protocol.repository.port';
import { ProtocolOrmEntity } from '../database/protocol.entity.orm';
import { QueryProtocolDto } from '../../application/dtos/query-protocol.dto';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';
import { getPaginationParams } from '../../../../shared/db/pagination.helper';

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

  async findAll(
    query: QueryProtocolDto,
  ): Promise<[ProtocolOrmEntity[], number]> {
    const { page, limit, skip } = getPaginationParams(query);
    const { studyType, receptionStatus, reviewType } = query;

    const qb = this.protocolsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.studyType', 'studyType')
      .leftJoinAndSelect('p.riskLevel', 'riskLevel')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .leftJoinAndSelect('p.investigators', 'investigators')
      .leftJoinAndSelect('p.institutions', 'institutions')
      .leftJoinAndSelect('p.checklist', 'checklist');

    if (studyType) qb.andWhere('studyType.code = :studyType', { studyType });
    if (receptionStatus)
      qb.andWhere('p.receptionStatus = :receptionStatus', { receptionStatus });
    if (reviewType) qb.andWhere('p.reviewType = :reviewType', { reviewType });

    qb.skip(skip).take(limit);
    qb.orderBy('p.receptionDate', 'DESC');

    return qb.getManyAndCount();
  }

  async countByYear(year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    return this.protocolsRepo.count({
      where: {
        receptionDate: Between(startOfYear, endOfYear),
      },
    });
  }
}
