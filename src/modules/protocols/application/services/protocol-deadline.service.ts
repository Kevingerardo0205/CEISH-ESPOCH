import { Injectable } from '@nestjs/common';
import { ReviewType } from '../../domain/enums/review-type.enum';
import {
  PLAZO_SUBSANACION_DOCUMENTAL_DIAS,
  PLAZO_CONDICION_DIAS,
  PLAZO_NORMATIVO_EXPEDITA_DIAS,
  PLAZO_NORMATIVO_PLENO_DIAS,
} from '../../../../shared/deadlines/deadline-rules';

@Injectable()
export class ProtocolDeadlineService {
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

  /**
   * Deadline for missing requirements (30 business days, RF-07.1 / RF-13)
   */
  calculateSubmissionDeadline(receptionDate: Date = new Date()): Date {
    return this.addBusinessDays(
      receptionDate,
      PLAZO_SUBSANACION_DOCUMENTAL_DIAS,
    );
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
