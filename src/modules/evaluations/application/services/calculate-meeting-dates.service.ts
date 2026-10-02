import { Injectable } from '@nestjs/common';

export interface ProtocolNormativeSnapshot {
  protocolCode: string;
  normativeDeadline: Date;
}

@Injectable()
export class CalculateMeetingDatesService {
  // Offset fijo de Ecuador (America/Guayaquil): UTC-5 horas sin horario de verano
  private static readonly ECUADOR_OFFSET_HOURS = -5;

  /**
   * Calcula la fecha de entrega de evaluaciones sugerida (Jueves estrictamente previo a las 23:59:59.999 ECT).
   */
  calculateSuggestedEvalDeadline(meetingDate: Date): Date {
    const ecuadorShiftMs =
      CalculateMeetingDatesService.ECUADOR_OFFSET_HOURS * 60 * 60 * 1000;
    const localEcuadorTime = new Date(meetingDate.getTime() + ecuadorShiftMs);

    const year = localEcuadorTime.getUTCFullYear();
    const month = localEcuadorTime.getUTCMonth();
    const day = localEcuadorTime.getUTCDate();
    const dayOfWeek = localEcuadorTime.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 4 = Jueves, 5 = Viernes, 6 = Sábado

    let daysToSubtract = 0;
    if (dayOfWeek > 4) {
      // Viernes (5) o Sábado (6) -> retroceder al jueves de esa misma semana
      daysToSubtract = dayOfWeek - 4;
    } else if (dayOfWeek === 4) {
      // Jueves de la misma semana -> retroceder 7 días al jueves anterior (estrictamente previo)
      daysToSubtract = 7;
    } else {
      // Domingo (0), Lunes (1), Martes (2), Miércoles (3) -> retroceder al jueves de la semana anterior
      daysToSubtract = dayOfWeek + 3;
    }

    const targetThursday = new Date(Date.UTC(year, month, day - daysToSubtract));
    const thYear = targetThursday.getUTCFullYear();
    const thMonth = targetThursday.getUTCMonth();
    const thDay = targetThursday.getUTCDate();

    // 23:59:59.999 en hora de Ecuador (UTC-5) = 04:59:59.999 UTC del día siguiente
    const deadlineUtcMs =
      Date.UTC(thYear, thMonth, thDay, 23, 59, 59, 999) - ecuadorShiftMs;
    return new Date(deadlineUtcMs);
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
