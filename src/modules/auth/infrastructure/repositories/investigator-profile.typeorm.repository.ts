import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInvestigatorProfileRepository } from '../../domain/ports/investigator-profile.repository.port';
import { InvestigatorProfileOrmEntity } from '../database/investigator-profile.entity.orm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';

@Injectable()
export class InvestigatorProfileTypeOrmRepository
  extends BaseTypeOrmRepository<InvestigatorProfileOrmEntity>
  implements IInvestigatorProfileRepository
{
  constructor(
    @InjectRepository(InvestigatorProfileOrmEntity)
    private readonly profileRepo: Repository<InvestigatorProfileOrmEntity>,
  ) {
    super(profileRepo);
  }

  async save(
    profile: Partial<InvestigatorProfileOrmEntity>,
    manager?: any,
  ): Promise<InvestigatorProfileOrmEntity> {
    const repo = manager
      ? manager.getRepository(InvestigatorProfileOrmEntity)
      : this.profileRepo;
    return repo.save(profile);
  }

  async findByUserId(
    userId: number,
  ): Promise<InvestigatorProfileOrmEntity | null> {
    return this.profileRepo.findOne({
      where: { userId },
    });
  }
}
