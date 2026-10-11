import {
  endOfDayGuayaquil,
  BusinessDayCalculator,
} from './deadline-calculator.service';

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

describe('BusinessDayCalculator.countBusinessDays', () => {
  it('returns 0 when from and to are the same day (intervalo abierto vacío)', () => {
    // Intervalo (Oct 13, Oct 13) = vacío
    const d = new Date('2026-10-13T14:00:00.000Z'); // martes Oct 13
    expect(BusinessDayCalculator.countBusinessDays(d, d)).toBe(0);
  });

  it('returns 0 when from > to (intervalo invertido)', () => {
    // Oct 15 Jue > Oct 10 Sáb → sin días
    const from = new Date('2026-10-15T09:00:00.000Z');
    const to = new Date('2026-10-10T14:00:00.000Z');
    expect(BusinessDayCalculator.countBusinessDays(from, to)).toBe(0);
  });

  it('counts correctly with a weekend in the middle, both endpoints excluded', () => {
    // (Oct 8 Jue, Oct 14 Mié): Oct 9 Vie (+1), Oct 10 Sáb skip, Oct 11 Dom skip, Oct 12 Lun (+2), Oct 13 Mar (+3)
    const from = new Date('2026-10-08T14:00:00.000Z');
    const to = new Date('2026-10-14T09:00:00.000Z');
    expect(BusinessDayCalculator.countBusinessDays(from, to)).toBe(3);
  });

  it('confirms open interval: from=Oct 10 Sáb to=Oct 15 Jue → 3 (solo 12 Lun, 13 Mar, 14 Mié)', () => {
    // Oct 11 Dom skip, Oct 12 (+1), Oct 13 (+2), Oct 14 (+3); Oct 15 excluido
    const from = new Date('2026-10-10T14:00:00.000Z');
    const to = new Date('2026-10-15T09:00:00.000Z');
    expect(BusinessDayCalculator.countBusinessDays(from, to)).toBe(3);
  });

  it('skips a day listed in holidays', () => {
    // (Oct 8 Jue, Oct 13 Mar) sin feriado: Oct 9 Vie (+1), Oct 12 Lun (+2) → 2
    // Con feriado Oct 9: Oct 9 Vie skip, Oct 12 Lun (+1) → 1
    const from = new Date('2026-10-08T14:00:00.000Z');
    const to = new Date('2026-10-13T09:00:00.000Z');
    expect(
      BusinessDayCalculator.countBusinessDays(from, to, ['2026-10-09']),
    ).toBe(1);
    expect(BusinessDayCalculator.countBusinessDays(from, to)).toBe(2);
  });

  it('is timezone-safe: same result under TZ=UTC and TZ=America/Guayaquil', () => {
    // 2026-10-12T23:30:00.000Z = Oct 12 18:30 ECT (Lunes) ≠ Oct 13 00:30 UTC (Martes)
    // ECT-correcto: from=Oct 12 Lun → (Oct 12, Oct 15 Jue): Oct 13 Mar (+1), Oct 14 Mié (+2) → 2
    const from = new Date('2026-10-12T23:30:00.000Z');
    const to = new Date('2026-10-15T09:00:00.000Z');
    const originalTz = process.env.TZ;
    const results: number[] = [];
    try {
      for (const tz of ['UTC', 'America/Guayaquil']) {
        process.env.TZ = tz;
        results.push(BusinessDayCalculator.countBusinessDays(from, to));
      }
    } finally {
      process.env.TZ = originalTz;
    }
    expect(results[0]).toBe(2);
    expect(results[1]).toBe(2);
  });
});
