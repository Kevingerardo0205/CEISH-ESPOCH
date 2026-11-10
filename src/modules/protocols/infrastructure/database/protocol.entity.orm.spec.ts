import { ReceptionStatus } from '../../domain/enums/reception-status.enum';
import { ProtocolOrmEntity } from './protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';

/** Protocolo con versión activa `versionNumber` y recepción en `statusId` (undefined = sin recepción). */
function protocolWith(
  versionNumber: number | null,
  statusId?: number,
): ProtocolOrmEntity {
  const protocol = new ProtocolOrmEntity();
  if (versionNumber !== null) {
    protocol.activeVersion = {
      versionNumber,
      reception: statusId === undefined ? undefined : { statusId },
    } as unknown as ProtocolVersionOrmEntity;
  }
  return protocol;
}

describe('ProtocolOrmEntity.receptionStatus (spec-001 RF-02.5 v3.7.2, TSK-001.7)', () => {
  it.each<{ statusId?: number; version: number; expected: string }>([
    // Nuevo: borrador = versión 1 con la recepción en INICIADO (9).
    { statusId: 9, version: 1, expected: ReceptionStatus.BORRADOR },
    // Igual que antes de TSK-001.7.
    {
      statusId: 9,
      version: 2,
      expected: ReceptionStatus.EVALUACION_SUBSANACIONES,
    },
    { statusId: 10, version: 1, expected: ReceptionStatus.COMPLETO },
    { statusId: 10, version: 2, expected: ReceptionStatus.COMPLETO },
    { statusId: 11, version: 1, expected: ReceptionStatus.INCOMPLETO },
    { statusId: 12, version: 1, expected: 'ARCHIVADO' },
    {
      statusId: 15,
      version: 1,
      expected: ReceptionStatus.EN_REVISION_SECRETARIA,
    },
    {
      statusId: 15,
      version: 2,
      expected: ReceptionStatus.EN_REVISION_SECRETARIA,
    },
    {
      statusId: 20,
      version: 1,
      expected: ReceptionStatus.PENDIENTE_SUBSANACION,
    },
    {
      statusId: 21,
      version: 2,
      expected: ReceptionStatus.EVALUACION_SUBSANACIONES,
    },
    {
      statusId: undefined,
      version: 1,
      expected: ReceptionStatus.PENDIENTE_SUBSANACION,
    },
    {
      statusId: undefined,
      version: 2,
      expected: ReceptionStatus.EVALUACION_SUBSANACIONES,
    },
  ])(
    'recepción $statusId, versión $version → $expected',
    ({ statusId, version, expected }) => {
      expect(protocolWith(version, statusId).receptionStatus).toBe(expected);
    },
  );

  it('sin versión activa → PENDIENTE_SUBSANACION (igual que antes)', () => {
    expect(protocolWith(null).receptionStatus).toBe(
      ReceptionStatus.PENDIENTE_SUBSANACION,
    );
  });
});
