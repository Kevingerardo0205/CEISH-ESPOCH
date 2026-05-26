import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';
import { PermissionOrmEntity } from '../database/permission.entity.orm';
import { IPermissionsRepository } from '../../domain/ports/permissions.repository.port';

@Injectable()
export class PermissionsTypeOrmRepository
  extends BaseTypeOrmRepository<PermissionOrmEntity>
  implements IPermissionsRepository
{
  constructor(
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionRepo: Repository<PermissionOrmEntity>,
  ) {
    super(permissionRepo);
  }

  async findAll(): Promise<PermissionOrmEntity[]> {
    return this.permissionRepo.find({
      relations: ['module'],
      order: { module: { order: 'ASC' }, code: 'ASC' },
    });
  }

  async findById(id: number): Promise<PermissionOrmEntity | null> {
    return this.permissionRepo.findOne({
      where: { id },
      relations: ['module'],
    });
  }

  async findByModuleId(moduleId: number): Promise<PermissionOrmEntity[]> {
    return this.permissionRepo.find({
      where: { moduleId },
      relations: ['module'],
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<PermissionOrmEntity | null> {
    return this.permissionRepo.findOne({ where: { code } });
  }
}
