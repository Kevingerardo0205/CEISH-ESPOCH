export enum AssignmentStatus {
  SUGGESTED = 5, // Sugerido por Presidenta
  ASSIGNED = 6, // Confirmado por Secretaria (Inicia el plazo)
  COMPLETED = 7, // Evaluación finalizada por Evaluador
  ARCHIVED = 8, // Asignación descartada o vencida
  REASIGNED_VENCIMIENTO = 26, // Reasignado por vencimiento de plazo operativo
  REASIGNED_COI = 27, // Reasignado por conflicto de interés (COI)
}
