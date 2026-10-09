import { Injectable } from '@nestjs/common';

export interface ProtocolNormativeSnapshot {
  protocolCode: string;
  normativeDeadline: Date;
}

@Injectable()
export class CalculateMeetingDatesService {
  /**
   * Calcula la fecha de entrega de evaluaciones sugerida (Jueves estrictamente previo a las 23:59:59.999).
   */
  calculateSuggestedEvalDeadline(meetingDate: Date): Date {
    const evalDate = new Date(meetingDate.getTime());
    const dayOfWeek = evalDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves, ..., 6 = Sábado

    let daysToSubtract = 0;
    if (dayOfWeek > 4) {
      // Viernes (5) o Sábado (6) -> retroceder al jueves de esa misma semana
      daysToSubtract = dayOfWeek - 4;
    } else if (dayOfWeek === 4) {
      // Jueves de la misma semana -> retroceder 7 días al jueves anterior
      daysToSubtract = 7;
    } else {
      // Domingo (0), Lunes (1), Martes (2), Miércoles (3) -> retroceder a la semana anterior
      daysToSubtract = dayOfWeek + 3;
    }

    evalDate.setDate(evalDate.getDate() - daysToSubtract);
    evalDate.setHours(23, 59, 59, 999);
    return evalDate;
  }

  /**
   * Evalúa advertencias suaves no bloqueantes si la fecha de reunión excede el plazo normativo de algún protocolo.
   */
  evaluateSoftWarnings(
    meetingDate: Date,
    protocols: ProtocolNormativeSnapshot[],
  ): string[] {
    const warnings: string[] = [];

    for (const protocol of protocols) {
      if (meetingDate.getTime() > protocol.normativeDeadline.getTime()) {
        warnings.push(
          `ADVERTENCIA: La fecha de reunión (${meetingDate.toISOString()}) excede el plazo normativo (${protocol.normativeDeadline.toISOString()}) del protocolo ${protocol.protocolCode}.`,
        );
      }
    }

    return warnings;
  }
}
