import { Injectable } from '@nestjs/common';
import { ReviewType } from '../../domain/enums/review-type.enum';
import {
  PLAZO_CONDICION_DIAS,
  PLAZO_NORMATIVO_EXPEDITA_DIAS,
  PLAZO_NORMATIVO_PLENO_DIAS,
} from '../../../../shared/deadlines/deadline-rules';
import {
  SystemParamsService,
  SP_PLAZO_SUBSANACION_DOCUMENTAL,
} from '../../../sistema/application/services/system-params.service';

@Injectable()
export class ProtocolDeadlineService {
  constructor(private readonly systemParams: SystemParamsService) {}

  /**
   * Calculates a date adding business days (skipping weekends)
   */
  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let count = 0;
    while (count < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Sunday, 6 = Saturday
        count++;
      }
    }
    return result;
  }

  /** Lee de BD los días hábiles de plazo para subsanación (fallback: PLAZO_SUBSANACION_DOCUMENTAL_DIAS). */
  getSubmissionDias(): number {
    return this.systemParams.get(SP_PLAZO_SUBSANACION_DOCUMENTAL);
  }

  /**
   * Deadline for missing requirements (RF-07.1 / RF-13).
   * Días configurables vía SystemParams; por defecto 30.
   */
  calculateSubmissionDeadline(receptionDate: Date = new Date()): Date {
    return this.addBusinessDays(receptionDate, this.getSubmissionDias());
  }

  /**
   * Response deadline based on Review Type
   * Expedita: 45 business days
   * Pleno/Ensayo Clínico: 60 business days
   */
  calculateResponseDeadline(
    reviewType: ReviewType,
    receptionDate: Date = new Date(),
  ): Date {
    const days =
      reviewType === ReviewType.EXPEDITA
        ? PLAZO_NORMATIVO_EXPEDITA_DIAS
        : PLAZO_NORMATIVO_PLENO_DIAS;
    return this.addBusinessDays(receptionDate, days);
  }

  /**
   * Deadline for correcting observations (30 business days)
   */
  calculateSubsanacionDeadline(evaluationDate: Date = new Date()): Date {
    return this.addBusinessDays(evaluationDate, PLAZO_CONDICION_DIAS);
  }
}
