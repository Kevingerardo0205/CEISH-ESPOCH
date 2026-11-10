import { ProtocolStatus } from '../enums/protocol-status.enum';

/**
 * Estados de la recepción de la versión activa desde los que el investigador principal
 * puede enviar o reenviar el protocolo (spec-001 RF-02.3 c y e, v3.7.1):
 * INICIADO (9, borrador), INCOMPLETO (11) y REQUIERE_SUBSANACION_DOC (20).
 */
export const SUBMITTABLE_RECEPTION_STATUS_IDS: readonly number[] = [
  ProtocolStatus.INICIADO,
  ProtocolStatus.INCOMPLETO,
  ProtocolStatus.REQUIERE_SUBSANACION_DOC,
];

/** RF-02.3 e.1: en cualquier otro estado (o sin recepción) el envío se rechaza. */
export function canSubmitProtocol(
  receptionStatusId: number | null | undefined,
): boolean {
  return (
    receptionStatusId !== null &&
    receptionStatusId !== undefined &&
    SUBMITTABLE_RECEPTION_STATUS_IDS.includes(receptionStatusId)
  );
}
