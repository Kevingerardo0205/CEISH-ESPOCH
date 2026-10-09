import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

function makeConfig(secret: string | undefined): ConfigService {
  return {
    getOrThrow: (path: string) => {
      if (path === 'app.jwtSecret') {
        if (secret === undefined) throw new Error(`Config key "${path}" not found`);
        return secret;
      }
      throw new Error(`Config key "${path}" not found`);
    },
  } as unknown as ConfigService;
}

describe('JwtStrategy — secret guard', () => {
  it('throws at construction when JWT_SECRET is absent', () => {
    expect(() => new JwtStrategy(makeConfig(undefined))).toThrow();
  });

  it('constructs successfully when JWT_SECRET is provided', () => {
    expect(
      () => new JwtStrategy(makeConfig('test-secret-value-only-for-unit-tests')),
    ).not.toThrow();
  });

  it('validate() returns the payload unchanged', () => {
    const strategy = new JwtStrategy(
      makeConfig('test-secret-value-only-for-unit-tests'),
    );
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
