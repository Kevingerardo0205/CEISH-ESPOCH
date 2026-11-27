/** Estado de convocatoria que impide subir la carta (ConvocatoriaStatus.CANCELADA). */
const ESTADO_CANCELADA = 'CANCELADA';

/** Motivo por el que la carta firmada todavía no se puede subir (spec-003 RF-17.2 v1.6.9). */
export type MotivoReunionNoRealizada =
  'CANCELADA' | 'SIN_FECHA' | 'NO_REALIZADA';

export interface ReunionParaCartaEntrada {
  convocatoriaEstado: string;
  /** `convocatorias.fecha_reunion` (timestamptz): instante real de la sesión; null si no tiene fecha. */
  fechaReunion: Date | null;
  /** `NOW()` de la base: instante de la petición. */
  ahora: Date;
}

/**
 * TSK-015-N27-6 (RF-17.2 v1.6.9). Función pura. Devuelve el motivo por el que no se puede subir la
 * carta, o null si la reunión ya se realizó. Compara instantes: la reunión está realizada cuando
 * `fecha_reunion` es igual o anterior a `ahora`. Orden: cancelada, sin fecha, futura.
 */
export function evaluarReunionRealizada(
  entrada: ReunionParaCartaEntrada,
): MotivoReunionNoRealizada | null {
  if (entrada.convocatoriaEstado === ESTADO_CANCELADA) return 'CANCELADA';
  if (entrada.fechaReunion === null) return 'SIN_FECHA';
  if (entrada.fechaReunion.getTime() > entrada.ahora.getTime()) {
    return 'NO_REALIZADA';
  }
  return null;
}
