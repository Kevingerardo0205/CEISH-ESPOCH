import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '../../application/services/permissions.service';
import { CreatePermissionDto } from '../../application/dtos/create-permission.dto';
import { UpdatePermissionDto } from '../../application/dtos/update-permission.dto';
import { CreateModuleDto } from '../../application/dtos/create-module.dto';
import { UpdateModuleDto } from '../../application/dtos/update-module.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // --- MODULES ---
  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get('auth/modules')
  findAllModules() {
    return this.permissionsService.findAllModules();
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get('auth/modules/:id')
  findModuleById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findModuleById(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get('auth/modules/:id/permissions')
  findPermissionsByModule(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findPermissionsByModule(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('MODULE_CREATED')
  @Post('auth/modules')
  createModule(@Body() createModuleDto: CreateModuleDto) {
    return this.permissionsService.createModule(createModuleDto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('MODULE_UPDATED')
  @Patch('auth/modules/:id')
  updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    return this.permissionsService.updateModule(id, updateModuleDto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('MODULE_DELETED')
  @Delete('auth/modules/:id')
  deleteModule(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deleteModule(id);
  }

  // --- PERMISSIONS ---
  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get('auth/permissions')
  findAllPermissions() {
    return this.permissionsService.findAllPermissions();
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Get('auth/permissions/:id')
  findPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findPermissionById(id);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('PERMISSION_CREATED')
  @Post('auth/permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('PERMISSION_UPDATED')
  @Patch('auth/permissions/:id')
  updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, updatePermissionDto);
  }

  @Permissions(Permission.PERMISOS_GESTIONAR)
  @Audit('PERMISSION_DELETED')
  @Delete('auth/permissions/:id')
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deletePermission(id);
  }
}
