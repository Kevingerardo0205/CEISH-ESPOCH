import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';
import { RoleCode } from '../../../auth/domain/enums/role.enum';
import { PendingItemsService } from '../../application/services/pending-items.service';
import { PendingItemsQueryDto } from '../../application/dtos/pending-items-query.dto';
import { PendingItemsResponseDto } from '../../application/dtos/pending-items-response.dto';
import { PendingItemsResult } from '../../domain/pending-item';

@ApiTags('secretaria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('secretaria')
export class SecretariaController {
  constructor(private readonly pendingItemsService: PendingItemsService) {}

  /** spec-003 RF-ALR.f: vista unificada de pendientes de la Secretaría (solo lectura). */
  @Get('pendientes')
  @Roles(RoleCode.SECRETARIA)
  @Permissions(Permission.DASHBOARD_VENCIMIENTOS)
  @ApiOperation({
    summary:
      'Pendientes de la Secretaría: validar, asignar y reasignar, con vencidos primero',
  })
  @ApiOkResponse({ type: PendingItemsResponseDto })
  async getPending(@Query() query: PendingItemsQueryDto): Promise<{
    statusCode: number;
    message: string;
    data: PendingItemsResult;
  }> {
    const data = await this.pendingItemsService.getPending(
      query.filtro ?? 'todos',
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Pendientes obtenidos exitosamente',
      data,
    };
  }
}
