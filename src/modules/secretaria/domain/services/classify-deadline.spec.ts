import { DeadlineGroup } from '../pending-item';
import { classifyDeadline, sundayOfWeek } from './classify-deadline';

// Miércoles 4 nov 2026, 10:00 en Ecuador (UTC-5).
const NOW_WED = new Date('2026-11-04T15:00:00.000Z');

describe('sundayOfWeek (semana de lunes a domingo)', () => {
  it.each([
    ['2026-11-02', '2026-11-08'], // lunes
    ['2026-11-04', '2026-11-08'], // miércoles
    ['2026-11-08', '2026-11-08'], // domingo: su propia semana
    ['2026-11-09', '2026-11-15'], // lunes siguiente
    ['2026-12-29', '2027-01-03'], // cruce de año
  ])('%s → domingo %s', (day, sunday) => {
    expect(sundayOfWeek(day)).toBe(sunday);
  });
});

describe('classifyDeadline (spec-003 RF-ALR.f.2)', () => {
  it('sin plazo → SIN_PLAZO', () => {
    expect(classifyDeadline(null, NOW_WED)).toBe(DeadlineGroup.SIN_PLAZO);
  });

  it('plazo de hoy que ya pasó → VENCIDO (no HOY)', () => {
    const today9am = new Date('2026-11-04T14:00:00.000Z');
    expect(classifyDeadline(today9am, NOW_WED)).toBe(DeadlineGroup.VENCIDO);
  });

  it('plazo de días anteriores → VENCIDO', () => {
    const lastMonth = new Date('2026-10-21T04:59:59.999Z');
    expect(classifyDeadline(lastMonth, NOW_WED)).toBe(DeadlineGroup.VENCIDO);
  });

  it('vence hoy más tarde (fin del día en Ecuador) → HOY', () => {
    const endOfToday = new Date('2026-11-05T04:59:59.999Z');
    expect(classifyDeadline(endOfToday, NOW_WED)).toBe(DeadlineGroup.HOY);
  });

  it('23:30 en Ecuador cuando en UTC ya es el día siguiente → HOY', () => {
    const now2330 = new Date('2026-11-05T04:30:00.000Z');
    const at2345 = new Date('2026-11-05T04:45:00.000Z');
    expect(classifyDeadline(at2345, now2330)).toBe(DeadlineGroup.HOY);
  });

  it('mañana → SEMANA', () => {
    const tomorrow = new Date('2026-11-05T15:00:00.000Z');
    expect(classifyDeadline(tomorrow, NOW_WED)).toBe(DeadlineGroup.SEMANA);
  });

  it('domingo 23:59:59 en Ecuador → SEMANA', () => {
    const sundayEnd = new Date('2026-11-09T04:59:59.999Z');
    expect(classifyDeadline(sundayEnd, NOW_WED)).toBe(DeadlineGroup.SEMANA);
  });

  it('lunes 00:00 en Ecuador → PROXIMO', () => {
    const mondayStart = new Date('2026-11-09T05:00:00.000Z');
    expect(classifyDeadline(mondayStart, NOW_WED)).toBe(DeadlineGroup.PROXIMO);
  });

  it('si hoy es domingo, el lunes ya es PROXIMO y el domingo por la noche es HOY', () => {
    const nowSunday = new Date('2026-11-08T15:00:00.000Z');
    expect(
      classifyDeadline(new Date('2026-11-09T15:00:00.000Z'), nowSunday),
    ).toBe(DeadlineGroup.PROXIMO);
    expect(
      classifyDeadline(new Date('2026-11-09T01:00:00.000Z'), nowSunday),
    ).toBe(DeadlineGroup.HOY);
  });
});
