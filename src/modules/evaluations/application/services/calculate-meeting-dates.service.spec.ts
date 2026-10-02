import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';

describe('CalculateMeetingDatesService (T006)', () => {
  let service: CalculateMeetingDatesService;

  beforeEach(() => {
    service = new CalculateMeetingDatesService();
  });

  it('should auto-calculate Thursday prior at 23:59:59.999 when meeting is on a Thursday', () => {
    // 2026-10-15 es Jueves
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const calculated = service.calculateSuggestedEvalDeadline(meetingDate);

    // Debe ser el Jueves previo (2026-10-08) a las 23:59:59.999
    expect(calculated.getFullYear()).toBe(2026);
    expect(calculated.getMonth()).toBe(9); // Octubre (0-indexed)
    expect(calculated.getDate()).toBe(8);
    expect(calculated.getHours()).toBe(23);
    expect(calculated.getMinutes()).toBe(59);
    expect(calculated.getSeconds()).toBe(59);
  });

  it('should auto-calculate Thursday prior at 23:59:59.999 when meeting is on a Friday', () => {
    // 2026-10-16 es Viernes
    const meetingDate = new Date('2026-10-16T09:00:00.000Z');
    const calculated = service.calculateSuggestedEvalDeadline(meetingDate);

    // Debe ser el Jueves de esa misma semana (2026-10-15) a las 23:59:59.999
    expect(calculated.getDate()).toBe(15);
    expect(calculated.getHours()).toBe(23);
    expect(calculated.getMinutes()).toBe(59);
  });

  it('should auto-calculate Thursday prior at 23:59:59.999 when meeting is on a Tuesday', () => {
    // 2026-10-20 es Martes
    const meetingDate = new Date('2026-10-20T09:00:00.000Z');
    const calculated = service.calculateSuggestedEvalDeadline(meetingDate);

    // Debe ser el Jueves previo (2026-10-15) a las 23:59:59.999
    expect(calculated.getDate()).toBe(15);
  });

  it('should emit soft warnings when meetingDate exceeds normative deadline of any protocol', () => {
    const meetingDate = new Date('2026-10-25T09:00:00.000Z'); // Posterior al plazo normativo
    const protocols = [
      {
        protocolCode: 'CEISH-IO-001',
        normativeDeadline: new Date('2026-10-20T17:00:00.000Z'),
      },
      {
        protocolCode: 'CEISH-IO-002',
        normativeDeadline: new Date('2026-10-30T17:00:00.000Z'),
      },
    ];

    const warnings = service.evaluateSoftWarnings(meetingDate, protocols);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('CEISH-IO-001');
  });
});
