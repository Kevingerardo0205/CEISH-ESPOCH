import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from '../../application/services/roles.service';
import { AssignPermissionsDto } from '../../application/dtos/assign-permissions.dto';
import { RemovePermissionsDto } from '../../application/dtos/remove-permissions.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

@Controller('auth/roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get()
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get(':id')
  findRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findRoleById(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get(':id/permissions')
  getRolePermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRolePermissions(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_PERMISSIONS_ASSIGNED')
  @Post(':id/permissions')
  assignPermissionsToRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionsToRole(id, dto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_PERMISSIONS_SET')
  @Put(':id/permissions')
  setRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.setRolePermissions(id, dto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_PERMISSIONS_REMOVED')
  @Delete(':id/permissions')
  removePermissionsFromRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemovePermissionsDto,
  ) {
    return this.rolesService.removePermissionsFromRole(id, dto);
  }
}
