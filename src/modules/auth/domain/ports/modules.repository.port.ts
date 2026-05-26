import { ModuleOrmEntity } from '../../infrastructure/database/module.entity.orm';

export abstract class IModulesRepository {
  abstract findAll(): Promise<ModuleOrmEntity[]>;
  abstract findById(id: number): Promise<ModuleOrmEntity | null>;
  abstract findByCode(code: string): Promise<ModuleOrmEntity | null>;
  abstract save(module: Partial<ModuleOrmEntity>): Promise<ModuleOrmEntity>;
  abstract update(id: number, data: Partial<ModuleOrmEntity>): Promise<void>;
  abstract softDelete(id: number): Promise<void>;
}
