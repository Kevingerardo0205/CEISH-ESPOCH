import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';

// TSK-001.1c: Todos los endpoints de gestión dinámica de permisos y módulos
// fueron retirados. Los roles del sistema son fijos (HU-001 a).
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PermissionsController {}
