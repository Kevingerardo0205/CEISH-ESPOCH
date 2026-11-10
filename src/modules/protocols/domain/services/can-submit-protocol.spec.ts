import { ProtocolStatus } from '../enums/protocol-status.enum';
import {
  canSubmitProtocol,
  SUBMITTABLE_RECEPTION_STATUS_IDS,
} from './can-submit-protocol';

describe('canSubmitProtocol (spec-001 RF-02.3 c y e, TSK-001.5)', () => {
  it.each([
    ['INICIADO (9)', ProtocolStatus.INICIADO],
    ['INCOMPLETO (11)', ProtocolStatus.INCOMPLETO],
    ['REQUIERE_SUBSANACION_DOC (20)', ProtocolStatus.REQUIERE_SUBSANACION_DOC],
  ])('acepta el envío desde %s', (_label, statusId) => {
    expect(canSubmitProtocol(statusId)).toBe(true);
  });

  it.each([
    ['COMPLETO (10)', ProtocolStatus.COMPLETO],
    ['ARCHIVADO_VENCIMIENTO (12)', ProtocolStatus.ARCHIVADO_VENCIMIENTO],
    ['EN_REVISION_SECRETARIA (15)', ProtocolStatus.EN_REVISION_SECRETARIA],
    ['EN_CONTROL_DOCUMENTAL (21)', ProtocolStatus.EN_CONTROL_DOCUMENTAL],
  ])('rechaza el envío desde %s', (_label, statusId) => {
    expect(canSubmitProtocol(statusId)).toBe(false);
  });

  it('rechaza el envío sin recepción (null o undefined)', () => {
    expect(canSubmitProtocol(null)).toBe(false);
    expect(canSubmitProtocol(undefined)).toBe(false);
  });

  it('los estados de origen son exactamente 9, 11 y 20', () => {
    expect([...SUBMITTABLE_RECEPTION_STATUS_IDS].sort((a, b) => a - b)).toEqual(
      [9, 11, 20],
    );
  });
});
