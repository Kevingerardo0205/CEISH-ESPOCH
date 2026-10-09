import 'reflect-metadata';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy — secret guard', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL };
  });

  afterEach(() => {
    process.env = ORIGINAL;
  });

  it('throws at construction when JWT_SECRET is absent', () => {
    delete process.env['JWT_SECRET'];
    expect(() => new JwtStrategy()).toThrow(/JWT_SECRET/);
  });

  it('throws at construction when JWT_SECRET is empty', () => {
    process.env['JWT_SECRET'] = '';
    expect(() => new JwtStrategy()).toThrow(/JWT_SECRET/);
  });

  it('constructs successfully when JWT_SECRET is provided', () => {
    process.env['JWT_SECRET'] = 'test-secret-value-only-for-unit-tests';
    expect(() => new JwtStrategy()).not.toThrow();
  });

  it('validate() returns the payload unchanged', () => {
    process.env['JWT_SECRET'] = 'test-secret-value-only-for-unit-tests';
    const strategy = new JwtStrategy();
    const payload = {
      sub: 1,
      id: 1,
      email: 'usuario@test.ec',
      roles: ['SECRETARIA'],
      permissions: ['evaluators:assign'],
    };
    expect(strategy.validate(payload)).toEqual({ ...payload, id: payload.sub });
  });
});
