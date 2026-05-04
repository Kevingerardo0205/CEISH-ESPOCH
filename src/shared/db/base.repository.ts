import { Repository, FindOptionsWhere } from 'typeorm';

export abstract class BaseTypeOrmRepository<T extends { id: number }> {
  constructor(protected readonly repo: Repository<T>) {}

  async findById(id: number): Promise<T | null> {
    return this.repo.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async getAll(): Promise<T[]> {
    return this.repo.find();
  }

  async save(entity: Partial<T>): Promise<T> {
    return this.repo.save(entity as T);
  }

  async update(id: number, data: Partial<T>): Promise<void> {
    await this.repo.update(id, data as any);
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }
}
