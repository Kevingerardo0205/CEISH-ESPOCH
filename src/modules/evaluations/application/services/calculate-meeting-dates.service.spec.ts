import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';

describe('CalculateMeetingDatesService', () => {
  let service: CalculateMeetingDatesService;

  beforeEach(() => {
    service = new CalculateMeetingDatesService();
  });

  it('should calculate suggested deadline for a meeting starting on Thursday at 20:00 ECT (strictly prior Thursday)', () => {
    // Jueves 15 de Octubre de 2026 a las 20:00 ECT (UTC-5) -> 2026-10-16T01:00:00.000Z
    const thursdayMeetingDate = new Date('2026-10-16T01:00:00.000Z');

    const deadline =
      service.calculateSuggestedEvalDeadline(thursdayMeetingDate);

    // Jueves estrictamente previo es el 8 de Octubre de 2026 a las 23:59:59.999 ECT -> 2026-10-09T04:59:59.999Z
    expect(deadline.toISOString()).toBe('2026-10-09T04:59:59.999Z');
  });

  it('should calculate suggested deadline for a meeting on a Saturday (Thursday of that same week)', () => {
    // Sábado 17 de Octubre de 2026 a las 10:00 ECT (UTC-5) -> 2026-10-17T15:00:00.000Z
    const saturdayMeetingDate = new Date('2026-10-17T15:00:00.000Z');

    const deadline =
      service.calculateSuggestedEvalDeadline(saturdayMeetingDate);

    // Jueves previo de la misma semana es el 15 de Octubre de 2026 a las 23:59:59.999 ECT -> 2026-10-16T04:59:59.999Z
    expect(deadline.toISOString()).toBe('2026-10-16T04:59:59.999Z');
  });

  it('should calculate suggested deadline for a meeting on a Monday (Thursday of previous week)', () => {
    // Lunes 19 de Octubre de 2026 a las 09:00 ECT -> 2026-10-19T14:00:00.000Z
    const mondayMeetingDate = new Date('2026-10-19T14:00:00.000Z');

    const deadline = service.calculateSuggestedEvalDeadline(mondayMeetingDate);

    // Jueves previo es el 15 de Octubre de 2026 a las 23:59:59.999 ECT -> 2026-10-16T04:59:59.999Z
    expect(deadline.toISOString()).toBe('2026-10-16T04:59:59.999Z');
  });

  it('should format legacy call deadline without day-shift under both UTC and America/Guayaquil', () => {
    const originalTz = process.env.TZ;
    try {
      for (const tz of ['UTC', 'America/Guayaquil']) {
        process.env.TZ = tz;
        // Jueves 12 de marzo de 2026 a las 20:00 hora de Ecuador (UTC-5)
        const callDate = new Date('2026-03-12T20:00:00-05:00');
        const deadline = new Date(callDate);
        deadline.setDate(deadline.getDate() - 1);
        while (deadline.getDay() !== 4) {
          deadline.setDate(deadline.getDate() - 1);
        }
        deadline.setHours(23, 59, 59, 999);

        // toCalendarDateString siempre debe dar el jueves 5 de marzo en Ecuador
        const dateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Guayaquil',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(deadline);

        expect(dateStr).toBe('2026-03-05');
      }
    } finally {
      process.env.TZ = originalTz;
    }
  });
});
