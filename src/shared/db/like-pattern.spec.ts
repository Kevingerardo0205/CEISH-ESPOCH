import { escapeLikePattern } from './like-pattern';

describe('escapeLikePattern (TSK-001.4)', () => {
  it('deja igual un término sin comodines', () => {
    expect(escapeLikePattern('CEISH-2026 Estudio')).toBe('CEISH-2026 Estudio');
  });

  it('escapa % y _', () => {
    expect(escapeLikePattern('50%_x')).toBe('50\\%\\_x');
  });

  it('escapa la barra invertida antes que los comodines', () => {
    expect(escapeLikePattern('a\\%b')).toBe('a\\\\\\%b');
  });

  it('escapa todas las apariciones', () => {
    expect(escapeLikePattern('%%__')).toBe('\\%\\%\\_\\_');
  });
});
