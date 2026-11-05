import { ProtocolStage } from '../enums/protocol-stage.enum';
import { ProtocolStatus } from '../enums/protocol-status.enum';

/** Alias de la consulta que ya une el protocolo con sus estados y su versión activa. */
export interface ProtocolStageSqlAliases {
  /** Alias de catalogos.estados unido por protocolos.estado_id. */
  protocolStatus: string;
  /** Alias de catalogos.estados unido por recepciones.estado_id (recepción de la versión activa). */
  receptionStatus: string;
  /** Alias de versiones_protocolo unido por protocolos.version_actual_id. */
  activeVersion: string;
}

/**
 * Etapa del protocolo en SQL (spec-001 RF-EST.1 y RF-EST.3, TSK-001.4).
 *
 * REPLICA EXACTAMENTE `resolveProtocolStage` (./resolve-protocol-stage.ts); si cambia
 * una, cambia la otra:
 * - con estado del protocolo → su etapa, salvo APROBADO (17) con resolución emitida
 *   para la versión activa → SEGUIMIENTO;
 * - sin estado del protocolo y con estado de la recepción → la etapa de la recepción;
 * - sin ninguno → RECEPCION.
 * La etapa de un estado sin etapa (NULL en el catálogo) queda NULL, como en la función.
 * Los valores son constantes del dominio; ningún dato del usuario entra en el texto.
 */
export function protocolStageSql(aliases: ProtocolStageSqlAliases): string {
  const ps = `"${aliases.protocolStatus}"`;
  const rs = `"${aliases.receptionStatus}"`;
  const av = `"${aliases.activeVersion}"`;
  return `(CASE
    WHEN ${ps}."id" IS NOT NULL THEN
      CASE
        WHEN ${ps}."id" = ${ProtocolStatus.APROBADO}
          AND EXISTS (
            SELECT 1 FROM "resolucion"."resoluciones" "stageRes"
            WHERE "stageRes"."version_id" = ${av}."id"
          )
        THEN '${ProtocolStage.SEGUIMIENTO}'
        ELSE ${ps}."etapa"
      END
    WHEN ${rs}."id" IS NOT NULL THEN ${rs}."etapa"
    ELSE '${ProtocolStage.RECEPCION}'
  END)`;
}
