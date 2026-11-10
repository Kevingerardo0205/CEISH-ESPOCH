import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { ListProtocolsQueryDto } from '../../application/dtos/list-protocols-query.dto';

/** Opciones de `findAll` que no vienen del cliente (las fija el servicio). */
export interface FindAllProtocolsOptions {
  /** RF-EST.3 punto 5: excluye los borradores (recepción de la versión activa en 9). */
  excludeDrafts?: boolean;
}

export abstract class IProtocolRepository {
  abstract findAll(
    query: ListProtocolsQueryDto,
    options?: FindAllProtocolsOptions,
  ): Promise<[ProtocolOrmEntity[], number]>;
  /**
   * RF-02.3 c y e: pasa a 15 la recepción de la versión activa solo si está en un estado de
   * envío (9, 11 o 20), en una sola sentencia. Devuelve false si no actualizó ninguna fila.
   */
  abstract submitActiveReception(protocolId: number): Promise<boolean>;
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
