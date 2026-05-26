import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { QueryProtocolDto } from '../../application/dtos/query-protocol.dto';

export abstract class IProtocolRepository {
  abstract findAll(
    query: QueryProtocolDto,
  ): Promise<[ProtocolOrmEntity[], number]>;
  abstract findProtocolsForReception(): Promise<ProtocolOrmEntity[]>;
  abstract findById(
    id: number,
    options?: any,
  ): Promise<ProtocolOrmEntity | null>;
  abstract save(entity: Partial<ProtocolOrmEntity>): Promise<ProtocolOrmEntity>;
  abstract update(id: number, data: Partial<ProtocolOrmEntity>): Promise<void>;
  abstract countByYear(year: number): Promise<number>;
}
