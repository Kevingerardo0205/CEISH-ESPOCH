import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';

/** Tipo de resolución: 1 APROBADO, 2 APROBADO CON OBSERVACIONES, 3 RECHAZADO (igual que el legacy). */
export type TipoResolucion = 1 | 2 | 3;

/**
 * TSK-015-N13 (spec-003 RF-17.4/RF-14.1): aplica el resultado del pleno a la versión evaluada y,
 * para tipos 1 y 3, al protocolo. Lo usan el legacy `POST /resolutions` y el flujo de cartas firmadas.
 * Copia fiel de `resolutions.service.ts` (antes de la extracción): mismo orden, mismos campos.
 *
 * - Tipo 1: versión → 17 (fecha de resolución, tipo 1); protocolo → 17 y `approvalDate`.
 * - Tipo 2: versión → 19. El protocolo no se toca aquí: lo cambia VersionSubsanacionService.
 * - Tipo 3: versión → 18; protocolo → 18.
 *
 * Con `protocolOrm.save`, TypeORM incrementa el `@VersionColumn` del protocolo.
 */
@Injectable()
export class ResultadoResolucionService {
  async aplicar(
    manager: EntityManager,
    params: {
      protocolOrm: ProtocolOrmEntity;
      versionId: number;
      tipo: TipoResolucion;
    },
  ): Promise<void> {
    const { protocolOrm, versionId, tipo } = params;

    if (tipo === 1) {
      await manager.update(ProtocolVersionOrmEntity, versionId, {
        statusId: ProtocolStatus.APROBADO,
        resolutionDate: new Date(),
        resolutionTypeId: tipo,
      });
      protocolOrm.statusId = ProtocolStatus.APROBADO;
      // fecha_aprobacion es columna `date`: TypeORM escribe las partes LOCALES del Date, así que
      // se construye medianoche local con el día de calendario de Ecuador (no UTC: en UTC-5 caería
      // en el día anterior).
      const [anio, mes, dia] = toCalendarDateString(new Date())
        .split('-')
        .map(Number);
      protocolOrm.approvalDate = new Date(anio, mes - 1, dia);
      await manager.save(ProtocolOrmEntity, protocolOrm);
    } else if (tipo === 3) {
      await manager.update(ProtocolVersionOrmEntity, versionId, {
        statusId: ProtocolStatus.RECHAZADO,
        resolutionDate: new Date(),
        resolutionTypeId: tipo,
      });
      protocolOrm.statusId = ProtocolStatus.RECHAZADO;
      await manager.save(ProtocolOrmEntity, protocolOrm);
    } else {
      await manager.update(ProtocolVersionOrmEntity, versionId, {
        statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
        resolutionDate: new Date(),
        resolutionTypeId: 2,
      });
    }
  }
}
