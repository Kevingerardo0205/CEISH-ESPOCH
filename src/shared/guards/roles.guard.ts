import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    const activeUserRoles: string[] = (user?.temporalRoles || [])
      .filter((tr: { code: string; isExpired?: boolean }) => !tr.isExpired)
      .map((tr: { code: string }) => tr.code)
      .concat(user?.roles || []);

    const hasRole = requiredRoles.some((role) =>
      activeUserRoles.some((userRole: string) => {
        return userRole.toLowerCase() === role.toLowerCase();
      }),
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
