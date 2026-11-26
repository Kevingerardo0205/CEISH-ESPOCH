import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartasFirmadasService } from '../../application/services/cartas-firmadas.service';
import {
  RegistrarCartaFirmadaDto,
  SolicitarSubidaCartaDto,
} from '../../application/dtos/cartas-firmadas.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';
import type { RequestWithUser } from './resolutions.controller';

/**
 * TSK-015-N09 — spec-003 RF-17.4 y RF-17.7 (v1.6.6). Carta firmada por versiones.
 * Creación y subida: RESOLUCION_CREAR (solo SECRETARIA). Vigente: investigador principal o
 * RESOLUCION_HISTORIAL (regla en el servicio). Historial: RESOLUCION_HISTORIAL (404 si no).
 */
@Controller(
  'resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas',
)
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CartasFirmadasController {
  constructor(private readonly cartas: CartasFirmadasService) {}

  @Post('upload-url')
  @Permissions(Permission.RESOLUCION_CREAR)
  async solicitarSubida(
    @Param('convocatoriaId', ParseUUIDPipe) convocatoriaId: string,
    @Param('convocatoriaProtocoloId', ParseUUIDPipe)
    convocatoriaProtocoloId: string,
    @Body() dto: SolicitarSubidaCartaDto,
  ) {
    return this.cartas.solicitarSubida(
      convocatoriaId,
      convocatoriaProtocoloId,
      dto,
    );
  }

  @Post()
  @Permissions(Permission.RESOLUCION_CREAR)
  @Audit('CARTA_FIRMADA_REGISTRADA')
  async registrar(
    @Param('convocatoriaId', ParseUUIDPipe) convocatoriaId: string,
    @Param('convocatoriaProtocoloId', ParseUUIDPipe)
    convocatoriaProtocoloId: string,
    @Body() dto: RegistrarCartaFirmadaDto,
    @Request() req: RequestWithUser,
  ) {
    return this.cartas.registrar(
      convocatoriaId,
      convocatoriaProtocoloId,
      dto,
      req.user.id,
    );
  }

  @Get('vigente')
  async vigente(
    @Param('convocatoriaId', ParseUUIDPipe) convocatoriaId: string,
    @Param('convocatoriaProtocoloId', ParseUUIDPipe)
    convocatoriaProtocoloId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.cartas.vigente(
      convocatoriaId,
      convocatoriaProtocoloId,
      req.user,
    );
  }

  @Get()
  async historial(
    @Param('convocatoriaId', ParseUUIDPipe) convocatoriaId: string,
    @Param('convocatoriaProtocoloId', ParseUUIDPipe)
    convocatoriaProtocoloId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.cartas.historial(
      convocatoriaId,
      convocatoriaProtocoloId,
      req.user,
    );
  }
}
