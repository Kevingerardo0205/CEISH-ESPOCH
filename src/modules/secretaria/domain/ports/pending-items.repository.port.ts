import { PendingSnapshot } from '../pending-item';

/** spec-003 RF-ALR.f: lectura de los pendientes de la Secretaría en una sola consulta. */
export abstract class IPendingItemsRepository {
  abstract findSnapshot(): Promise<PendingSnapshot>;
}
