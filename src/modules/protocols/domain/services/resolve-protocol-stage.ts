import {
  ProtocolStage,
  PROTOCOL_STAGE_ORDER,
} from '../enums/protocol-stage.enum';
import { ProtocolStatus } from '../enums/protocol-status.enum';

/** Estado del catálogo con su etapa (catalogos.estados.etapa). */
export interface StageSourceStatus {
  id: number;
  stage: ProtocolStage | null;
}

export interface ProtocolStageResult {
  stage: ProtocolStage | null;
  order: number | null;
}

/**
 * Etapa del protocolo (spec-001 RF-EST.1 v3.5.5).
 * - Origen: estado del protocolo; si es NULL, estado de la recepción de la versión activa;
 *   si tampoco hay recepción, RECEPCION.
 * - Excepción: APROBADO (17) pasa a SEGUIMIENTO cuando la versión activa tiene resolución emitida.
 * - El orden es la posición de la etapa (1 a 6).
 *
 * La misma regla está en SQL en `protocolStageSql` (./protocol-stage.sql.ts), que filtra
 * GET /protocols por etapa (RF-EST.3, TSK-001.4); si cambia una, cambia la otra.
 */
export function resolveProtocolStage(
  protocolStatus: StageSourceStatus | null | undefined,
  receptionStatus: StageSourceStatus | null | undefined,
  resolutionEmitted: boolean,
): ProtocolStageResult {
  const source = protocolStatus ?? receptionStatus;
  let stage: ProtocolStage | null = source
    ? source.stage
    : ProtocolStage.RECEPCION;

  if (protocolStatus?.id === ProtocolStatus.APROBADO && resolutionEmitted) {
    stage = ProtocolStage.SEGUIMIENTO;
  }

  return { stage, order: stage ? PROTOCOL_STAGE_ORDER[stage] : null };
}
