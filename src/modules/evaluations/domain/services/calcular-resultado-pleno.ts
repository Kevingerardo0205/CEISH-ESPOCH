import {
  ACTIVE_ASSIGNMENT_STATES,
  AssignmentStatus,
} from '../enums/assignment-status.enum';
import { EvaluatorDictamen } from '../enums/evaluator-dictamen.enum';

/**
 * Resultados del pleno por protocolo (spec-003 RF-17.1 v1.6.8: el sistema lo calcula, no se registra
 * a mano). SUSPENDIDO no es resultado del pleno.
 */
export const RESULTADOS_PLENO = [
  'APROBADO_DEFINITIVO',
  'APROBADO_CON_CONDICION',
  'NO_APROBADO',
] as const;

export type ResultadoPleno = (typeof RESULTADOS_PLENO)[number];

/** Una asignación de la versión con el dictamen de su evaluación (resultado_id 1/2/3, o null). */
export interface AsignacionParaResultado {
  estadoId: number;
  resultadoId: number | null | undefined;
}

/** Conteos por dictamen, sin identidad de evaluadores (B8). */
export interface ResumenDictamenes {
  aprobado: number;
  conCondicion: number;
  noAprobado: number;
  pendientes: number;
}

export type CalculoResultadoPleno =
  | {
      estado: 'PENDIENTE';
      resultado: null;
      resumen: ResumenDictamenes;
    }
  | {
      estado: 'CALCULADO';
      resultado: ResultadoPleno;
      resumen: ResumenDictamenes;
    };

/**
 * TSK-015-N27-3 (RF-17.1 v1.6.8). Función pura; no es `determineResolutionType` (legacy, no se toca).
 * - Solo cuentan las asignaciones activas (5, 6, 7). Las reasignadas (26, 27) y las archivadas (8)
 *   se ignoran.
 * - Precondición: todas las activas están en 7 (COMPLETED), tienen un dictamen válido (1, 2 o 3) y
 *   hay al menos una. Si no se cumple → PENDIENTE; el estado 5 (sugerido) cuenta como activo y bloquea.
 * - Combinación: todos 1 → APROBADO_DEFINITIVO; todos 3 → NO_APROBADO; cualquier otro caso
 *   (incluido «todos 2») → APROBADO_CON_CONDICION.
 */
export function calcularResultadoPleno(
  asignaciones: readonly AsignacionParaResultado[],
): CalculoResultadoPleno {
  const activas = asignaciones.filter((a) =>
    (ACTIVE_ASSIGNMENT_STATES as readonly number[]).includes(a.estadoId),
  );

  const resumen: ResumenDictamenes = {
    aprobado: 0,
    conCondicion: 0,
    noAprobado: 0,
    pendientes: 0,
  };
  const estadoCompletada: number = AssignmentStatus.COMPLETED;
  for (const a of activas) {
    if (a.estadoId !== estadoCompletada) {
      resumen.pendientes++;
      continue;
    }
    switch (a.resultadoId) {
      case EvaluatorDictamen.APROBADO:
        resumen.aprobado++;
        break;
      case EvaluatorDictamen.APROBADO_CON_OBSERVACIONES:
        resumen.conCondicion++;
        break;
      case EvaluatorDictamen.RECHAZADO:
        resumen.noAprobado++;
        break;
      default:
        resumen.pendientes++;
    }
  }

  if (activas.length === 0 || resumen.pendientes > 0) {
    return { estado: 'PENDIENTE', resultado: null, resumen };
  }

  const todos = (valor: EvaluatorDictamen): boolean =>
    activas.every((a) => a.resultadoId === valor);

  if (todos(EvaluatorDictamen.APROBADO)) {
    return { estado: 'CALCULADO', resultado: 'APROBADO_DEFINITIVO', resumen };
  }
  if (todos(EvaluatorDictamen.RECHAZADO)) {
    return { estado: 'CALCULADO', resultado: 'NO_APROBADO', resumen };
  }
  return { estado: 'CALCULADO', resultado: 'APROBADO_CON_CONDICION', resumen };
}
