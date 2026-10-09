import { endOfDayGuayaquil } from './deadline-calculator.service';

describe('endOfDayGuayaquil', () => {
  it('converts 2026-03-12 to 2026-03-13T04:59:59.999Z (23:59:59.999 ECT)', () => {
    const result = endOfDayGuayaquil('2026-03-12');
    expect(result.toISOString()).toBe('2026-03-13T04:59:59.999Z');
  });

  it('VERDE: deadline=2026-03-12, now=2026-03-12 10:00 Guayaquil (15:00 UTC) → vigente, daysRemaining=0, not expired', () => {
    const deadline = endOfDayGuayaquil('2026-03-12');
    // 2026-03-12 10:00 ECT = 2026-03-12 15:00 UTC
    const now = new Date('2026-03-12T15:00:00.000Z');

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffTime < 0;

    expect(isExpired).toBe(false);
    expect(diffDays).toBe(0);
  });

  it('ROJO: deadline=2026-03-12, now=2026-03-13 00:30 Guayaquil (05:30 UTC) → vencido', () => {
    const deadline = endOfDayGuayaquil('2026-03-12');
    // 2026-03-13 00:30 ECT = 2026-03-13 05:30 UTC (after 04:59:59 UTC deadline)
    const now = new Date('2026-03-13T05:30:00.000Z');

    const diffTime = deadline.getTime() - now.getTime();
    const isExpired = diffTime < 0;

    expect(isExpired).toBe(true);
  });

  it('handles end-of-year boundary correctly (2025-12-31 → 2026-01-01T04:59:59.999Z)', () => {
    const result = endOfDayGuayaquil('2025-12-31');
    expect(result.toISOString()).toBe('2026-01-01T04:59:59.999Z');
  });
});
