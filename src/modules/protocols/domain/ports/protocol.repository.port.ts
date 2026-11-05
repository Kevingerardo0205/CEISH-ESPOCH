import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { ListProtocolsQueryDto } from '../../application/dtos/list-protocols-query.dto';

export abstract class IProtocolRepository {
  abstract findAll(
    query: ListProtocolsQueryDto,
  ): Promise<[ProtocolOrmEntity[], number]>;
  abstract findProtocolsForReception(
    status?: string,
  ): Promise<ProtocolOrmEntity[]>;
  abstract findById(
    id: number,
    options?: Record<string, unknown>,
  ): Promise<ProtocolOrmEntity | null>;
  abstract save(entity: Partial<ProtocolOrmEntity>): Promise<ProtocolOrmEntity>;
  abstract update(id: number, data: Partial<ProtocolOrmEntity>): Promise<void>;
  abstract countByYear(year: number): Promise<number>;
}
