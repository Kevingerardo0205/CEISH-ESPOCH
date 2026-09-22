import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RolesService } from '../../application/services/roles.service';
import { AssignPermissionsDto } from '../../application/dtos/assign-permissions.dto';
import { RemovePermissionsDto } from '../../application/dtos/remove-permissions.dto';
import { CreateRoleDto } from '../../application/dtos/create-role.dto';
import { UpdateRoleDto } from '../../application/dtos/update-role.dto';
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
  @Get('presets')
  getRolePresets() {
    return this.rolesService.getRolePresets();
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
    @Req() req: Request,
  ) {
    return this.rolesService.assignPermissionsToRole(id, dto, req);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_PERMISSIONS_SET')
  @Put(':id/permissions')
  setRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @Req() req: Request,
  ) {
    return this.rolesService.setRolePermissions(id, dto, req);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_PERMISSIONS_REMOVED')
  @Delete(':id/permissions')
  removePermissionsFromRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RemovePermissionsDto,
    @Req() req: Request,
  ) {
    return this.rolesService.removePermissionsFromRole(id, dto, req);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_CREATED')
  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_UPDATED')
  @Patch(':id')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_DELETED')
  @Delete(':id')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('ROLE_RESET_TO_PRESET')
  @Post(':id/reset-preset')
  resetRoleToPreset(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.rolesService.resetRoleToPreset(id, req);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get(':id/compliance')
  getRoleComplianceStatus(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleComplianceStatus(id);
  }
}
