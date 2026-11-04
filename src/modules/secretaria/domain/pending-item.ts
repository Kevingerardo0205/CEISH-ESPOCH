import { ProtocolStage } from '../../protocols/domain/enums/protocol-stage.enum';

/** spec-003 RF-ALR.f.1: acción principal de cada fila (se deriva, no se almacena). */
export enum PendingAction {
  VALIDAR = 'VALIDAR',
  ASIGNAR = 'ASIGNAR',
  REASIGNAR = 'REASIGNAR',
}

/** spec-003 RF-ALR.f.2: grupo de plazo de cada fila. */
export enum DeadlineGroup {
  VENCIDO = 'VENCIDO',
  HOY = 'HOY',
  SEMANA = 'SEMANA',
  PROXIMO = 'PROXIMO',
  SIN_PLAZO = 'SIN_PLAZO',
}

/** spec-003 RF-ALR.f.3: orden de los grupos en la vista. */
export const DEADLINE_GROUP_ORDER: readonly DeadlineGroup[] = [
  DeadlineGroup.VENCIDO,
  DeadlineGroup.HOY,
  DeadlineGroup.SEMANA,
  DeadlineGroup.PROXIMO,
  DeadlineGroup.SIN_PLAZO,
];

/** spec-003 RF-ALR.f.3: valores del query param `filtro`. */
export const PENDING_FILTERS = ['todos', 'vencidos', 'hoy', 'semana'] as const;
export type PendingFilter = (typeof PENDING_FILTERS)[number];

export const PENDING_ACTION_TEXT: Readonly<Record<PendingAction, string>> = {
  [PendingAction.VALIDAR]: 'Validar documentos',
  [PendingAction.ASIGNAR]: 'Asignar evaluadores',
  [PendingAction.REASIGNAR]: 'Reasignar evaluador',
};

export const PENDING_STATUS_TEXT: Readonly<Record<PendingAction, string>> = {
  [PendingAction.VALIDAR]: 'Recepción por validar',
  [PendingAction.ASIGNAR]: 'Recepción completa · sin evaluadores',
  [PendingAction.REASIGNAR]: 'En evaluación · dictamen vencido',
};

/** Fila tal como sale de la base, antes de clasificar el plazo y la etapa. */
export interface PendingRow {
  action: PendingAction;
  protocolId: number;
  ceishCode: string | null;
  title: string | null;
  protocolStatusId: number | null;
  protocolStatusStage: ProtocolStage | null;
  receptionStatusId: number | null;
  receptionStatusStage: ProtocolStage | null;
  resolutionEmitted: boolean;
  deadline: Date | null;
}

/** Resultado de la única consulta: `now` es NOW() de la base. */
export interface PendingSnapshot {
  now: Date;
  rows: PendingRow[];
}

export interface PendingItem {
  protocolId: number;
  ceishCode: string | null;
  title: string | null;
  estadoActual: string;
  etapa: ProtocolStage | null;
  etapaOrden: number | null;
  fechaPlazo: string | null;
  estadoPlazo: DeadlineGroup;
  accion: PendingAction;
  accionTexto: string;
}

export interface PendingTotals {
  todos: number;
  vencidos: number;
  hoy: number;
  semana: number;
}

export interface PendingItemsResult {
  fechaReferencia: string;
  totales: PendingTotals;
  items: PendingItem[];
}
