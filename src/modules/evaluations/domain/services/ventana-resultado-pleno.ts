import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';

/** Estado de convocatoria que no admite registros (ConvocatoriaStatus.CANCELADA). */
const ESTADO_CANCELADA = 'CANCELADA';

export type MotivoCierreVentanaResultado = 'CANCELADA' | 'FECHA_NO_CELEBRADA';

export interface VentanaResultadoPlenoEntrada {
  convocatoriaEstado: string;
  fechaReunion: Date | null;
  /** Instante de la petición; la fecha de calendario se toma en America/Guayaquil. */
  ahora: Date;
}

/**
 * TSK-015-N25 (RF-17.1): ventana de la fecha de la reunión (el registro manual se retiró en TSK-015-N27-5;
 * la usa el contexto de resolución). Función pura. Devuelve el motivo del
 * cierre o null si la ventana está abierta:
 * - `CANCELADA` si la convocatoria está cancelada (tiene prioridad);
 * - `FECHA_NO_CELEBRADA` si no hay fecha de reunión o es posterior a hoy en America/Guayaquil.
 */
export function evaluarVentanaResultadoPleno(
  entrada: VentanaResultadoPlenoEntrada,
): MotivoCierreVentanaResultado | null {
  if (entrada.convocatoriaEstado === ESTADO_CANCELADA) return 'CANCELADA';
  const hoy = toCalendarDateString(entrada.ahora);
  if (
    !entrada.fechaReunion ||
    toCalendarDateString(entrada.fechaReunion) > hoy
  ) {
    return 'FECHA_NO_CELEBRADA';
  }
  return null;
}

/** true si se puede registrar o corregir el resultado según la ventana (sin mirar EX ni permisos). */
export function ventanaResultadoPlenoAbierta(
  entrada: VentanaResultadoPlenoEntrada,
): boolean {
  return evaluarVentanaResultadoPleno(entrada) === null;
}
