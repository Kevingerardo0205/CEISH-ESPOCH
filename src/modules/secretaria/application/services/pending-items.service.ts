import { Injectable } from '@nestjs/common';
import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';
import { resolveProtocolStage } from '../../../protocols/domain/services/resolve-protocol-stage';
import { IPendingItemsRepository } from '../../domain/ports/pending-items.repository.port';
import { classifyDeadline } from '../../domain/services/classify-deadline';
import {
  DEADLINE_GROUP_ORDER,
  DeadlineGroup,
  PENDING_ACTION_TEXT,
  PENDING_STATUS_TEXT,
  PendingFilter,
  PendingItem,
  PendingItemsResult,
  PendingRow,
} from '../../domain/pending-item';

const FILTER_GROUP: Readonly<
  Record<Exclude<PendingFilter, 'todos'>, DeadlineGroup>
> = {
  vencidos: DeadlineGroup.VENCIDO,
  hoy: DeadlineGroup.HOY,
  semana: DeadlineGroup.SEMANA,
};

interface SortableItem {
  item: PendingItem;
  deadlineMs: number | null;
}

/** spec-003 RF-ALR.f: vista unificada de pendientes de la Secretaría. */
@Injectable()
export class PendingItemsService {
  constructor(private readonly repository: IPendingItemsRepository) {}

  async getPending(
    filter: PendingFilter = 'todos',
  ): Promise<PendingItemsResult> {
    const { now, rows } = await this.repository.findSnapshot();

    const sorted = rows
      .map((row) => this.toSortable(row, now))
      .sort(compareItems)
      .map((s) => s.item);

    const countOf = (group: DeadlineGroup): number =>
      sorted.filter((i) => i.estadoPlazo === group).length;

    const items =
      filter === 'todos'
        ? sorted
        : sorted.filter((i) => i.estadoPlazo === FILTER_GROUP[filter]);

    return {
      fechaReferencia: toCalendarDateString(now),
      totales: {
        todos: sorted.length,
        vencidos: countOf(DeadlineGroup.VENCIDO),
        hoy: countOf(DeadlineGroup.HOY),
        semana: countOf(DeadlineGroup.SEMANA),
      },
      items,
    };
  }

  private toSortable(row: PendingRow, now: Date): SortableItem {
    const { stage, order } = resolveProtocolStage(
      row.protocolStatusId === null
        ? null
        : { id: row.protocolStatusId, stage: row.protocolStatusStage },
      row.receptionStatusId === null
        ? null
        : { id: row.receptionStatusId, stage: row.receptionStatusStage },
      row.resolutionEmitted,
    );
    return {
      deadlineMs: row.deadline ? row.deadline.getTime() : null,
      item: {
        protocolId: row.protocolId,
        ceishCode: row.ceishCode,
        title: row.title,
        estadoActual: PENDING_STATUS_TEXT[row.action],
        etapa: stage,
        etapaOrden: order,
        fechaPlazo: row.deadline ? row.deadline.toISOString() : null,
        estadoPlazo: classifyDeadline(row.deadline, now),
        accion: row.action,
        accionTexto: PENDING_ACTION_TEXT[row.action],
      },
    };
  }
}

/** spec-003 RF-ALR.f.3: grupo, luego fechaPlazo ascendente, luego ceishCode. */
function compareItems(a: SortableItem, b: SortableItem): number {
  const byGroup =
    DEADLINE_GROUP_ORDER.indexOf(a.item.estadoPlazo) -
    DEADLINE_GROUP_ORDER.indexOf(b.item.estadoPlazo);
  if (byGroup !== 0) return byGroup;

  if (a.deadlineMs !== b.deadlineMs) {
    if (a.deadlineMs === null) return 1;
    if (b.deadlineMs === null) return -1;
    return a.deadlineMs - b.deadlineMs;
  }

  const codeA = a.item.ceishCode;
  const codeB = b.item.ceishCode;
  if (codeA !== codeB) {
    if (codeA === null) return 1;
    if (codeB === null) return -1;
    return codeA < codeB ? -1 : 1;
  }
  return a.item.protocolId - b.item.protocolId;
}
