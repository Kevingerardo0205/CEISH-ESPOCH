import { Injectable } from '@nestjs/common';
import { ReviewType } from '../../domain/enums/review-type.enum';

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
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        count++;
      }
    }
    return result;
  }

  /**
   * Deadline for missing requirements (15 business days)
   */
  calculateSubmissionDeadline(receptionDate: Date = new Date()): Date {
    return this.addBusinessDays(receptionDate, 15);
  }

  /**
   * Response deadline based on Review Type
   * Expedita: 45 business days
   * Pleno/Ensayo Clínico: 60 business days
   */
  calculateResponseDeadline(reviewType: ReviewType, receptionDate: Date = new Date()): Date {
    const days = reviewType === ReviewType.EXPEDITA ? 45 : 60;
    return this.addBusinessDays(receptionDate, days);
  }

  /**
   * Evaluator assignment deadline
   * Expedita: 8 business days
   * Pleno: 15 business days
   */
  calculateEvaluatorDeadline(reviewType: ReviewType, assignmentDate: Date = new Date()): Date {
    const days = reviewType === ReviewType.EXPEDITA ? 8 : 15;
    return this.addBusinessDays(assignmentDate, days);
  }
}
