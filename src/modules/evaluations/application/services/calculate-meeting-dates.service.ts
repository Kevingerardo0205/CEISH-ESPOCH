import { Injectable } from '@nestjs/common';
import {
  BusinessDayCalculator,
  endOfDayGuayaquil,
} from '../../../../shared/services/deadline-calculator.service';
import {
  SystemParamsService,
  SP_ENTREGA_EVALUACION_DIAS,
  SP_PLAZO_REVISION_OFICIO,
} from '../../../sistema/application/services/system-params.service';
import {
  PLAZO_NORMATIVO_EXPEDITA_DIAS,
  PLAZO_NORMATIVO_PLENO_DIAS,
} from '../../../../shared/deadlines/deadline-rules';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import type { AssignmentDeadlineSnapshot } from '../../domain/ports/meeting-repository.port';

export interface ProtocolNormativeSnapshot {
  protocolCode: string;
  normativeDeadline: Date;
}

@Injectable()
export class CalculateMeetingDatesService {
  constructor(private readonly systemParams: SystemParamsService) {}

  /**
   * Calcula el plazo normativo de revisión a partir del tipo de revisión y la fecha de recepción.
   * Retorna fin de día en ECT del último día hábil del plazo (45 días EXPEDITA, 60 días PLENO/ENSAYO_CLINICO).
   * Retorna undefined si falta reviewType o receptionDate.
   * TODO TSK-015-N04: integrar feriados de Ecuador en el cálculo.
   */
  static computeNormativeDeadline(
    reviewType: string | undefined,
    receptionDate: Date | undefined,
  ): Date | undefined {
    if (!reviewType || !receptionDate) return undefined;
    const days =
      (reviewType as ReviewType) === ReviewType.EXPEDITA
        ? PLAZO_NORMATIVO_EXPEDITA_DIAS
        : PLAZO_NORMATIVO_PLENO_DIAS;
    const { deadlineDateString } =
      BusinessDayCalculator.calculateDetailedDeadline({
        startDate: receptionDate,
        businessDaysToAdd: days,
        holidays: [],
      });
    return endOfDayGuayaquil(deadlineDateString);
  }

  /** Expone el valor actual de SP_ENTREGA_EVALUACION_DIAS para snapshot en convocatoria (TSK-009-N04). */
  getEntregaDias(): number {
    return this.systemParams.get(SP_ENTREGA_EVALUACION_DIAS);
  }

  /**
   * Calcula la fecha de entrega de evaluaciones sugerida:
   * meetingDate + ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION días hábiles a las 12:00 ECT.
   * Días configurables vía SystemParams (fallback: ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION).
   */
  calculateSuggestedEvalDeadline(meetingDate: Date): Date {
    const dias = this.getEntregaDias();
    const { deadlineDateString } =
      BusinessDayCalculator.calculateDetailedDeadline({
        startDate: meetingDate,
        businessDaysToAdd: dias,
        holidays: [], // TODO TSK-015-N04
      });
    // 12:00 ECT (UTC-5) = 17:00 UTC
    const [year, month, day] = deadlineDateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 17, 0, 0, 0));
  }

  /**
   * Evalúa advertencias suaves no bloqueantes:
   * - Si evalDeadline excede el plazo normativo de algún protocolo (TSK-009-N06).
   * - Si el número de días hábiles desde la asignación más antigua es menor que
   *   PLAZO_REVISION_OFICIO_DIAS (TSK-002-N05).
   */
  evaluateSoftWarnings(
    meetingDate: Date,
    protocols: ProtocolNormativeSnapshot[],
    assignments: AssignmentDeadlineSnapshot[] | undefined,
    evalDeadline: Date,
  ): string[] {
    const warnings: string[] = [];
    const plazoRevision = this.systemParams.get(SP_PLAZO_REVISION_OFICIO);
    const formatECT = (d: Date): string =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);

    for (const protocol of protocols) {
      if (evalDeadline.getTime() > protocol.normativeDeadline.getTime()) {
        warnings.push(
          `ADVERTENCIA_PLAZO_NORMATIVO: El protocolo ${protocol.protocolCode} tiene fecha de entrega (${formatECT(evalDeadline)}) posterior a su plazo normativo (${formatECT(protocol.normativeDeadline)}).`,
        );
      }
    }

    if (assignments) {
      for (const assignment of assignments) {
        const businessDays = BusinessDayCalculator.countBusinessDays(
          assignment.oldestAssignmentDate,
          meetingDate,
        );
        if (businessDays < plazoRevision) {
          warnings.push(
            `ADVERTENCIA_PLAZO_REVISION: El protocolo ${assignment.protocolCode} (versión ${assignment.protocolVersionId}) tiene solo ${businessDays} días hábiles de revisión antes de la reunión (mínimo requerido: ${plazoRevision}).`,
          );
        }
      }
    }

    return warnings;
  }
}
