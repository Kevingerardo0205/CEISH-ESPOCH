import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Redirect,
} from '@nestjs/common';
import { ResolutionsService } from '../../application/services/resolutions.service';
import { CartasFirmadasService } from '../../application/services/cartas-firmadas.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Audit } from '../../../../shared/decorators/audit.decorator';

import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

export interface CreateResolutionPayload {
  protocolId: number;
  versionLock?: number;
  validityYears?: number;
  followUpPeriodDays?: number;
  observations?: string;
  pdfLetterPath?: string;
  letterFilePath?: string;
  archivoCartaPdf?: string;
  pdfBuffer?: Buffer;
}

export interface RequestWithUser {
  user: {
    id: number;
    permissions?: string[];
  };
}

@Controller('resolutions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ResolutionsController {
  constructor(
    private readonly resolutionsService: ResolutionsService,
    private readonly cartasFirmadasService: CartasFirmadasService,
  ) {}

  /**
   * LEGACY (spec-003 v1.6.6, TSK-015-N09): flujo anterior, se mantiene solo porque el frontend lo usa.
   * No se extiende; las cartas firmadas van por /resolutions/convocatorias/…/cartas. Se retira en TSK-015-N18.
   */
  @Post()
  @Permissions(Permission.RESOLUTION_CREATE)
  @Audit('RESOLUTION_CREATED')
  async create(
    @Body() dto: CreateResolutionPayload,
    @Request() req: RequestWithUser,
  ): Promise<unknown> {
    // pdfBuffer se extraería si la secretaria sube el archivo en esta misma petición
    return this.resolutionsService.createResolution(
      dto,
      req.user.id,
      dto.pdfBuffer,
    );
  }

  @Get('templates/observations-response')
  @Redirect('https://nestjs.com', 302)
  async getObservationsResponseTemplate(): Promise<{
    url: string;
    statusCode: number;
  }> {
    const url =
      await this.resolutionsService.getObservationsResponseTemplateUrl();
    return { url, statusCode: 302 };
  }

  /**
   * TSK-015-N17 (RF-17.6): sin @Permissions en la ruta (el investigador principal no tiene
   * RESOLUCION_HISTORIAL). La regla de lectura está en el servicio.
   */
  @Get('protocol/:protocolId')
  async findByProtocolId(
    @Param('protocolId') protocolId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.resolutionsService.findByProtocolIdForReader(
      Number(protocolId),
      req.user,
    );
  }

  /**
   * TSK-015-N25 (RF-17.1, RF-17.4, RF-17.6): contexto de la etapa Resolución de un protocolo.
   * Acceso y visibilidad en CartasFirmadasService.contextoProtocolo (404 «Protocolo no encontrado.»
   * para cualquier lector sin acceso).
   */
  @Get('protocol/:protocolId/contexto')
  async contextoProtocolo(
    @Param(
      'protocolId',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('ID de protocolo inválido'),
      }),
    )
    protocolId: number,
    @Request() req: RequestWithUser,
  ) {
    if (protocolId < 1) {
      throw new BadRequestException('ID de protocolo inválido');
    }
    return this.cartasFirmadasService.contextoProtocolo(
      protocolId,
      req.user,
      new Date(),
    );
  }
}
