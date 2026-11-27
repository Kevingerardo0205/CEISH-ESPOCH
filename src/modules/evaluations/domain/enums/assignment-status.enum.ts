export enum AssignmentStatus {
  SUGGESTED = 5, // Sugerido por Presidenta
  ASSIGNED = 6, // Confirmado por Secretaria (Inicia el plazo)
  COMPLETED = 7, // Evaluación finalizada por Evaluador
  ARCHIVED = 8, // Asignación descartada o vencida
  REASIGNED_VENCIMIENTO = 26, // Reasignado por vencimiento de plazo operativo
  REASIGNED_COI = 27, // Reasignado por conflicto de interés (COI)
}

/** Asignaciones activas de una versión (RF-12.7 c.2; RF-17.1 v1.6.8): SUGERIDO, ASIGNADO, COMPLETADO. */
export const ACTIVE_ASSIGNMENT_STATES: readonly AssignmentStatus[] = [
  AssignmentStatus.SUGGESTED,
  AssignmentStatus.ASSIGNED,
  AssignmentStatus.COMPLETED,
];
