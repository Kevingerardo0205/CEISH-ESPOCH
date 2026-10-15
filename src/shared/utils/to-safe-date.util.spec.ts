import { toSafeDate } from './to-safe-date.util';

describe('toSafeDate', () => {
  it('retorna el mismo Date si ya es Date', () => {
    const d = new Date('2026-10-15T09:00:00.000Z');
    expect(toSafeDate(d)).toBe(d);
  });

  it('convierte string ISO 8601 a Date válido', () => {
    const result = toSafeDate('2026-10-15T09:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-10-15T09:00:00.000Z');
  });

  it('convierte string YYYY-MM-DD a Date sin lanzar', () => {
    const result = toSafeDate('2026-10-15');
    expect(result).toBeInstanceOf(Date);
    expect(() => result!.toISOString()).not.toThrow();
  });

  it('convierte string de fecha como las que devuelve pg (timestamptz texto) a Date', () => {
    const result = toSafeDate('2026-10-15 09:00:00+00');
    expect(result).toBeInstanceOf(Date);
    expect(() => result!.toISOString()).not.toThrow();
  });

  it('retorna null si el valor es null', () => {
    expect(toSafeDate(null)).toBeNull();
  });

  it('retorna null si el valor es undefined', () => {
    expect(toSafeDate(undefined)).toBeNull();
  });

  it('nunca lanza TypeError al encadenar .toISOString() cuando el valor es no-nulo', () => {
    const cases: Array<Date | string> = [
      new Date('2026-01-01'),
      '2026-01-01',
      '2026-01-01T00:00:00.000Z',
    ];
    cases.forEach((v) => {
      expect(() => toSafeDate(v)!.toISOString()).not.toThrow();
    });
  });
});
