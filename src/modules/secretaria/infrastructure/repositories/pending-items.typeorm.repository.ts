import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ENTREGA_EVALUACION_ZONA_HORARIA } from '../../../../shared/deadlines/deadline-rules';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { ProtocolStage } from '../../../protocols/domain/enums/protocol-stage.enum';
import { AssignmentStatus } from '../../../evaluations/domain/enums/assignment-status.enum';
import { ConvocatoriaStatus } from '../../../evaluations/infrastructure/database/entities/convocatoria.orm-entity';
import { IPendingItemsRepository } from '../../domain/ports/pending-items.repository.port';
import {
  PendingAction,
  PendingRow,
  PendingSnapshot,
} from '../../domain/pending-item';

interface RawPendingRow {
  now: Date;
  action: PendingAction | null;
  protocolId: number | null;
  ceishCode: string | null;
  title: string | null;
  protocolStatusId: number | null;
  protocolStatusStage: string | null;
  receptionStatusId: number | null;
  receptionStatusStage: string | null;
  resolutionEmitted: boolean | null;
  deadline: Date | null;
}

/**
 * spec-003 RF-ALR.f.1: una sola consulta con CTEs y UNION ALL.
 * - Todas las filas usan la versión activa (protocolos.version_actual_id).
 * - Plazo de la fila c): COALESCE(fecha_limite_ts, fin del día de fecha_limite en
 *   America/Guayaquil), equivalente a endOfDayGuayaquil() de deadline-calculator.service.ts.
 * - NOW() sale de la base; el LEFT JOIN desde `ahora` garantiza una fila aunque no haya pendientes.
 */
const PENDING_ITEMS_SQL = `
WITH ahora AS (
  SELECT NOW() AS now
),
base AS (
  SELECT
    p.id                       AS protocol_id,
    p.codigo_ceish             AS ceish_code,
    p.titulo                   AS title,
    p.version_actual_id        AS version_id,
    p.estado_id                AS protocol_status_id,
    ep.etapa                   AS protocol_status_stage,
    p.nivel_riesgo_confirmado  AS risk_confirmed,
    p.sometimiento_tiempos_aceptado AS terms_accepted,
    r.estado_id                AS reception_status_id,
    er.etapa                   AS reception_status_stage,
    EXISTS (
      SELECT 1 FROM resolucion.resoluciones rs
      WHERE rs.version_id = p.version_actual_id
    )                          AS resolution_emitted
  FROM public.protocolos p
  LEFT JOIN catalogos.estados ep ON ep.id = p.estado_id
  LEFT JOIN recepcion.recepciones r ON r.version_id = p.version_actual_id
  LEFT JOIN catalogos.estados er ON er.id = r.estado_id
  WHERE p.eliminado_en IS NULL
    AND p.version_actual_id IS NOT NULL
),
validar AS (
  SELECT $1::text AS action, b.*, NULL::timestamptz AS deadline
  FROM base b
  WHERE b.reception_status_id = $4
),
asignar AS (
  SELECT $2::text AS action, b.*, NULL::timestamptz AS deadline
  FROM base b
  WHERE b.reception_status_id = $5
    AND b.protocol_status_id IS NULL
    AND b.risk_confirmed = false
    AND b.terms_accepted = true
    AND NOT EXISTS (
      SELECT 1 FROM evaluacion.asignaciones_evaluacion a
      WHERE a.version_id = b.version_id
        AND a.estado_id = ANY($6::int[])
    )
),
reasignar AS (
  SELECT $3::text AS action, b.*, v.deadline
  FROM base b
  JOIN LATERAL (
    SELECT MIN(x.deadline) AS deadline
    FROM (
      SELECT COALESCE(
               a.fecha_limite_ts,
               (a.fecha_limite + INTERVAL '1 day' - INTERVAL '1 millisecond')
                 AT TIME ZONE $8
             ) AS deadline
      FROM evaluacion.asignaciones_evaluacion a
      WHERE a.version_id = b.version_id
        AND a.estado_id = $7
        AND EXISTS (
          SELECT 1
          FROM evaluacion.convocatoria_protocolos cp
          JOIN evaluacion.convocatorias c ON c.id = cp.convocatoria_id
          WHERE cp.version_id = a.version_id
            AND cp.eliminado_en IS NULL
            AND c.eliminado_en IS NULL
            AND c.estado <> $9
            AND c.fecha_entrega_evaluacion IS NOT NULL
        )
    ) x
    WHERE x.deadline < NOW()
  ) v ON v.deadline IS NOT NULL
),
pendientes AS (
  SELECT * FROM validar
  UNION ALL
  SELECT * FROM asignar
  UNION ALL
  SELECT * FROM reasignar
)
SELECT
  ah.now                     AS "now",
  u.action                   AS "action",
  u.protocol_id              AS "protocolId",
  u.ceish_code               AS "ceishCode",
  u.title                    AS "title",
  u.protocol_status_id       AS "protocolStatusId",
  u.protocol_status_stage    AS "protocolStatusStage",
  u.reception_status_id      AS "receptionStatusId",
  u.reception_status_stage   AS "receptionStatusStage",
  u.resolution_emitted       AS "resolutionEmitted",
  u.deadline                 AS "deadline"
FROM ahora ah
LEFT JOIN pendientes u ON true
`;

@Injectable()
export class PendingItemsTypeormRepository implements IPendingItemsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findSnapshot(): Promise<PendingSnapshot> {
    const raw: RawPendingRow[] = await this.dataSource.query(
      PENDING_ITEMS_SQL,
      [
        PendingAction.VALIDAR,
        PendingAction.ASIGNAR,
        PendingAction.REASIGNAR,
        ProtocolStatus.EN_REVISION_SECRETARIA,
        ProtocolStatus.COMPLETO,
        [AssignmentStatus.SUGGESTED, AssignmentStatus.ASSIGNED],
        AssignmentStatus.ASSIGNED,
        ENTREGA_EVALUACION_ZONA_HORARIA,
        ConvocatoriaStatus.CANCELADA,
      ],
    );

    const now = new Date(raw[0].now);
    const rows: PendingRow[] = raw
      .filter((r) => r.action !== null && r.protocolId !== null)
      .map((r) => ({
        action: r.action as PendingAction,
        protocolId: Number(r.protocolId),
        ceishCode: r.ceishCode,
        title: r.title,
        protocolStatusId:
          r.protocolStatusId === null ? null : Number(r.protocolStatusId),
        protocolStatusStage: r.protocolStatusStage as ProtocolStage | null,
        receptionStatusId:
          r.receptionStatusId === null ? null : Number(r.receptionStatusId),
        receptionStatusStage: r.receptionStatusStage as ProtocolStage | null,
        resolutionEmitted: r.resolutionEmitted === true,
        deadline: r.deadline === null ? null : new Date(r.deadline),
      }));

    return { now, rows };
  }
}
