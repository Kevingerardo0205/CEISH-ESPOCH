/** Etapas canónicas del protocolo (spec-001 RF-EST.1). */
export enum ProtocolStage {
  RECEPCION = 'RECEPCION',
  ASIGNACION = 'ASIGNACION',
  EVALUACION = 'EVALUACION',
  RESOLUCION = 'RESOLUCION',
  SEGUIMIENTO = 'SEGUIMIENTO',
  RENOVACION = 'RENOVACION',
}

/** Posición de cada etapa en la barra de progreso (1 a 6). */
export const PROTOCOL_STAGE_ORDER: Readonly<Record<ProtocolStage, number>> = {
  [ProtocolStage.RECEPCION]: 1,
  [ProtocolStage.ASIGNACION]: 2,
  [ProtocolStage.EVALUACION]: 3,
  [ProtocolStage.RESOLUCION]: 4,
  [ProtocolStage.SEGUIMIENTO]: 5,
  [ProtocolStage.RENOVACION]: 6,
};
