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
      relations: [
        'checklist',
        'activeVersion',
        'activeVersion.reception',
        'versions',
      ],
      ...options,
    });
  }

  async findProtocolsForReception(
    status?: string,
  ): Promise<ProtocolOrmEntity[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.studyType', 'studyType')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .leftJoinAndSelect('p.activeVersion', 'activeVersion')
      .leftJoinAndSelect('activeVersion.reception', 'reception')
      .where('reception.statusId IS NOT NULL');

    if (status) {
      if (status === 'pendientes') {
        qb.andWhere('reception.statusId IN (9, 15)');
      } else if (status === 'incompletos') {
        qb.andWhere('reception.statusId = 11');
      } else if (status === 'validados') {
        qb.andWhere('reception.statusId = 10');
      } else if (status === 'archivados') {
        qb.andWhere('reception.statusId = 12');
      }
    }

    return qb.orderBy('reception.receptionDate', 'DESC').getMany();
  }

  async findAll(
    query: QueryProtocolDto,
  ): Promise<[ProtocolOrmEntity[], number]> {
    const { limit, skip } = getPaginationParams(query);
    const { studyType, receptionStatus, reviewType } = query;

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.studyType', 'studyType')
      .leftJoinAndSelect('p.riskLevel', 'riskLevel')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .leftJoinAndSelect('p.investigators', 'investigators')
      .leftJoinAndSelect('p.institutions', 'institutions')
      .leftJoinAndSelect('p.checklist', 'checklist')
      .leftJoinAndSelect('p.activeVersion', 'activeVersion')
      .leftJoinAndSelect('activeVersion.reception', 'reception')
      .leftJoinAndSelect('p.versions', 'versions');

    if (studyType) qb.andWhere('studyType.code = :studyType', { studyType });
    if (query.statusId) {
      qb.andWhere('p.statusId = :statusId', { statusId: query.statusId });
    }
    if (query.subsanar === 'true' || (query.subsanar as any) === true) {
      qb.andWhere(
        '(reception.statusId = 9 OR reception.statusId IS NULL OR reception.id IS NULL OR reception.statusId = 11)',
      );
    } else if (receptionStatus) {
      if (receptionStatus === ReceptionStatus.EVALUACION_SUBSANACIONES) {
        qb.andWhere(
          'reception.statusId = 9 AND activeVersion.versionNumber > 1',
        );
      } else if (receptionStatus === ReceptionStatus.PENDIENTE_SUBSANACION) {
        qb.andWhere(
          '(reception.statusId = 9 OR reception.statusId IS NULL OR reception.id IS NULL) AND (activeVersion.versionNumber = 1 OR activeVersion.id IS NULL)',
        );
      } else {
        let statusId = 9;
        if (receptionStatus === ReceptionStatus.COMPLETO) statusId = 10;
        else if (receptionStatus === ReceptionStatus.INCOMPLETO) statusId = 11;
        else if (receptionStatus === ReceptionStatus.EN_REVISION_SECRETARIA)
          statusId = 15;
        else if (receptionStatus === ('ARCHIVADO' as any)) statusId = 12;
        qb.andWhere('reception.statusId = :statusId', { statusId });
      }
    }
    if (reviewType) qb.andWhere('p.reviewType = :reviewType', { reviewType });

    if (query.investigatorId) {
      qb.andWhere(
        '(p.principalInvestigatorId = :invId OR investigators.userId = :invId)',
        { invId: query.investigatorId },
      );
    }

    qb.skip(skip).take(limit);
    qb.orderBy('p.updatedAt', 'DESC');

    return qb.getManyAndCount();
  }

  async countByYear(year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    return this.repo.count({
      where: {
        activeVersion: {
          reception: {
            receptionDate: Between(startOfYear, endOfYear),
          },
        },
      },
      relations: ['activeVersion', 'activeVersion.reception'],
    });
  }
}
