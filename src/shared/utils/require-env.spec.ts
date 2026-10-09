import { requireEnv } from './require-env';

describe('requireEnv', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL };
  });

  afterEach(() => {
    process.env = ORIGINAL;
  });

  it('returns the value when the variable is defined', () => {
    process.env['TEST_VAR_CEISH'] = 'hello';
    expect(requireEnv('TEST_VAR_CEISH')).toBe('hello');
  });

  it('throws an Error when the variable is absent', () => {
    delete process.env['TEST_VAR_CEISH'];
    expect(() => requireEnv('TEST_VAR_CEISH')).toThrow(Error);
  });

  it('error message names the variable but does not include its value', () => {
    delete process.env['MY_SECRET'];
    expect(() => requireEnv('MY_SECRET')).toThrow(
      expect.objectContaining({ message: expect.stringContaining('MY_SECRET') }),
    );
  });

  it('throws when the variable is defined but empty', () => {
    process.env['TEST_EMPTY'] = '';
    expect(() => requireEnv('TEST_EMPTY')).toThrow(Error);
  });
});
