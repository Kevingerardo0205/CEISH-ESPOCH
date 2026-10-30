import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from '../../application/services/users.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

@Controller('auth/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions(Permission.USUARIOS_VER)
  @Get()
  findAllRoles() {
    return this.usersService.getRoles();
  }
}
