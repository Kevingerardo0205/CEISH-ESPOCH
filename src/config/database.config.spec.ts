import databaseConfig from './database.config';

describe('databaseConfig factory', () => {
  const ORIG = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIG,
      DB_USERNAME: 'test_user',
      DB_PASSWORD: 'test_password',
    };
  });

  afterEach(() => {
    process.env = ORIG;
  });

  it('throws when DB_PASSWORD is absent', () => {
    delete process.env['DB_PASSWORD'];
    expect(() => databaseConfig()).toThrow(/DB_PASSWORD/);
  });

  it('throws when DB_USERNAME is absent', () => {
    delete process.env['DB_USERNAME'];
    expect(() => databaseConfig()).toThrow(/DB_USERNAME/);
  });

  it('returns config with the provided credentials', () => {
    const config = databaseConfig() as Record<string, unknown>;
    expect(config['username']).toBe('test_user');
    expect(config['password']).toBe('test_password');
  });

  it('uses host/port/database defaults when optional vars absent', () => {
    delete process.env['DB_HOST'];
    delete process.env['DB_PORT'];
    delete process.env['DB_NAME'];
    const config = databaseConfig() as Record<string, unknown>;
    expect(config['host']).toBe('localhost');
    expect(config['port']).toBe(5432);
    expect(config['database']).toBe('ceish_db');
  });
});
