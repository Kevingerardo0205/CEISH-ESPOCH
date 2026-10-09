import { BadRequestException } from '@nestjs/common';

export class MeetingDatesValueObject {
  readonly meetingDate: Date;
  readonly evalSubmissionDeadline: Date;

  constructor(meetingDate: Date, evalSubmissionDeadline: Date) {
    if (!meetingDate || !evalSubmissionDeadline) {
      throw new BadRequestException(
        'FECHA_INVALIDA: Ambas fechas son obligatorias',
      );
    }

    if (evalSubmissionDeadline.getTime() >= meetingDate.getTime()) {
      throw new BadRequestException(
        `FECHA_EVALUACION_INVALIDA: La fecha límite de entrega de evaluaciones (${evalSubmissionDeadline.toISOString()}) debe ser estrictamente menor que la fecha de la reunión (${meetingDate.toISOString()}).`,
      );
    }

    this.meetingDate = meetingDate;
    this.evalSubmissionDeadline = evalSubmissionDeadline;
  }
}
