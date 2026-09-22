import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          const data = (request?.query?.token as string) ?? '';
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SUPER_SECRET_KEY',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
