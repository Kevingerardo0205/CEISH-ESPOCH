import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';

/**
 * TSK-015-N13 (spec-003 RF-14.1, RF-17.5): crea la versión de subsanación (v2.0) tras un dictamen
 * «aprobado con condición». Lo usan el legacy `POST /resolutions` (tipo 2) y el flujo de cartas
 * firmadas (solo Anexo 15). Copia fiel de los pasos 1 a 4 de `resolutions.service.ts` antes de la
 * extracción: mismo orden y mismos campos.
 *
 * 1. Nueva versión con número + 1, estado 21 (EN_CONTROL_DOCUMENTAL), plazo de subsanación.
 * 2. El protocolo apunta a la nueva versión y queda en 21.
 * 3. Recepción nueva de la versión en INICIADO (9), sin faltantes.
 * 4. Checklist: APROBADO y NO_APLICA intactos; el resto a NO_PRESENTADO.
 */
@Injectable()
export class VersionSubsanacionService {
  constructor(private readonly deadlineService: ProtocolDeadlineService) {}

  async crearSiguiente(
    manager: EntityManager,
    params: {
      protocolId: number;
      protocolOrm: ProtocolOrmEntity;
      versionNumber: number | null | undefined;
      userId: number;
    },
  ): Promise<void> {
    const { protocolId, protocolOrm, versionNumber, userId } = params;
    const nextVersionNumber = (versionNumber || 1) + 1;
    const deadlineDate = this.deadlineService.calculateSubsanacionDeadline(
      new Date(),
    );

    // 1. Crear nueva versión
    const newVersion = manager.create(ProtocolVersionOrmEntity, {
      protocolId,
      versionNumber: nextVersionNumber,
      submissionDate: new Date(),
      statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL,
      correctionDeadlineDays: this.deadlineService.getCondicionDias(),
      correctionDeadlineDate: deadlineDate,
    });
    const savedVersion = await manager.save(
      ProtocolVersionOrmEntity,
      newVersion,
    );

    // 2. Asociar el protocolo a la nueva versión y sincronizar su estado a 21
    protocolOrm.versionActualId = savedVersion.id;
    protocolOrm.statusId = ProtocolStatus.EN_CONTROL_DOCUMENTAL;
    await manager.save(ProtocolOrmEntity, protocolOrm);

    // 3. Recepción nueva de la versión (INICIADO 9)
    const newReception = manager.create(ReceptionOrmEntity, {
      protocolId,
      versionId: savedVersion.id,
      statusId: ProtocolStatus.INICIADO,
      createdByUserId: userId,
      hasMissingItems: false,
    });
    await manager.save(ReceptionOrmEntity, newReception);

    // 4. Checklist: resetear lo no aprobado ni aplicable
    const checklistItems = await manager.find(ProtocolRequirementOrmEntity, {
      where: { protocolId },
    });
    for (const item of checklistItems) {
      if (
        item.status !== RequirementStatus.APROBADO &&
        item.status !== RequirementStatus.NO_APLICA
      ) {
        await manager.update(ProtocolRequirementOrmEntity, item.id, {
          status: RequirementStatus.NO_PRESENTADO,
        });
      }
    }
  }
}
