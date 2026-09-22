import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../enums/permission.enum';

interface GuardUser {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  private static cache = new Map<
    number,
    { permissions: string[]; expiry: number }
  >();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const user = request.user as GuardUser | undefined;

    // Si el usuario no está autenticado o no posee ID, denegar
    if (!user || !user.id) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    // Consultar permisos en caché o desde la base de datos con TTL de 5 minutos
    const now = Date.now();
    const cached = PermissionsGuard.cache.get(user.id);
    let activePermissions: string[];

    if (cached && cached.expiry > now) {
      activePermissions = cached.permissions;
    } else {
      const dbPermissionsRaw = await this.dataSource.query(
        `
        SELECT DISTINCT p.codigo as code
        FROM catalogos.rol_permisos rp
        INNER JOIN catalogos.permisos p ON rp.permiso_id = p.id
        INNER JOIN catalogos.usuarios_roles ur ON rp.rol_id = ur.rol_id
        WHERE ur.usuario_id = $1
          AND (ur.fecha_inicio IS NULL OR ur.fecha_inicio <= NOW())
          AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
      `,
        [user.id],
      );

      activePermissions = dbPermissionsRaw.map((row) => row.code);
      PermissionsGuard.cache.set(user.id, {
        permissions: activePermissions,
        expiry: now + this.CACHE_TTL_MS,
      });
    }

    // Verificar si el usuario tiene AL MENOS UNO de los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      activePermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permiso requerido: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
