import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';
import { ModuleOrmEntity } from '../database/module.entity.orm';
import { IModulesRepository } from '../../domain/ports/modules.repository.port';

@Injectable()
export class ModulesTypeOrmRepository
  extends BaseTypeOrmRepository<ModuleOrmEntity>
  implements IModulesRepository
{
  constructor(
    @InjectRepository(ModuleOrmEntity)
    private readonly moduleRepo: Repository<ModuleOrmEntity>,
  ) {
    super(moduleRepo);
  }

  async findAll(): Promise<ModuleOrmEntity[]> {
    return this.moduleRepo.find({
      order: { order: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<ModuleOrmEntity | null> {
    return this.moduleRepo.findOne({ where: { code } });
  }
}
