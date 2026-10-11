import { Injectable } from '@nestjs/common';
import { BusinessDayCalculator } from '../../../../shared/services/deadline-calculator.service';
import {
  ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION,
  PLAZO_REVISION_OFICIO_DIAS,
} from '../../../../shared/deadlines/deadline-rules';
import type { AssignmentDeadlineSnapshot } from '../../domain/ports/meeting-repository.port';

export interface ProtocolNormativeSnapshot {
  protocolCode: string;
  normativeDeadline: Date;
}

@Injectable()
export class CalculateMeetingDatesService {
  /**
   * Calcula la fecha de entrega de evaluaciones sugerida:
   * meetingDate + ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION días hábiles a las 12:00 ECT.
   */
  calculateSuggestedEvalDeadline(meetingDate: Date): Date {
    const { deadlineDateString } =
      BusinessDayCalculator.calculateDetailedDeadline({
        startDate: meetingDate,
        businessDaysToAdd: ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION,
        holidays: [], // TODO TSK-015-N04
      });
    // 12:00 ECT (UTC-5) = 17:00 UTC
    const [year, month, day] = deadlineDateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 17, 0, 0, 0));
  }

  /**
   * Evalúa advertencias suaves no bloqueantes:
   * - Si la fecha de reunión excede el plazo normativo de algún protocolo.
   * - Si el número de días hábiles desde la asignación más antigua es menor que PLAZO_REVISION_OFICIO_DIAS.
   */
  evaluateSoftWarnings(
    meetingDate: Date,
    protocols: ProtocolNormativeSnapshot[],
    assignments?: AssignmentDeadlineSnapshot[],
  ): string[] {
    const warnings: string[] = [];

    for (const protocol of protocols) {
      if (meetingDate.getTime() > protocol.normativeDeadline.getTime()) {
        warnings.push(
          `ADVERTENCIA: La fecha de reunión (${meetingDate.toISOString()}) excede el plazo normativo (${protocol.normativeDeadline.toISOString()}) del protocolo ${protocol.protocolCode}.`,
        );
      }
    }

    if (assignments) {
      for (const assignment of assignments) {
        const businessDays = BusinessDayCalculator.countBusinessDays(
          assignment.oldestAssignmentDate,
          meetingDate,
        );
        if (businessDays < PLAZO_REVISION_OFICIO_DIAS) {
          warnings.push(
            `ADVERTENCIA_PLAZO_REVISION: El protocolo ${assignment.protocolCode} (versión ${assignment.protocolVersionId}) tiene solo ${businessDays} días hábiles de revisión antes de la reunión (mínimo requerido: ${PLAZO_REVISION_OFICIO_DIAS}).`,
          );
        }
      }
    }

    return warnings;
  }
}
