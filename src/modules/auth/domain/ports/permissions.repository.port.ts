import { PermissionOrmEntity } from '../../infrastructure/database/permission.entity.orm';

export abstract class IPermissionsRepository {
  abstract findAll(): Promise<PermissionOrmEntity[]>;
  abstract findById(id: number): Promise<PermissionOrmEntity | null>;
  abstract findByModuleId(moduleId: number): Promise<PermissionOrmEntity[]>;
  abstract findByCode(code: string): Promise<PermissionOrmEntity | null>;
  abstract save(permission: Partial<PermissionOrmEntity>): Promise<PermissionOrmEntity>;
  abstract update(id: number, data: Partial<PermissionOrmEntity>): Promise<void>;
  abstract softDelete(id: number): Promise<void>;
}
