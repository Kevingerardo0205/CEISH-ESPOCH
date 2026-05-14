import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResolutionsService } from '../../application/services/resolutions.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';

import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';

@Controller('resolutions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ResolutionsController {
  constructor(private readonly resolutionsService: ResolutionsService) {}

  @Post()
  @Permissions(Permission.RESOLUTION_CREATE)
  @Audit('RESOLUTION_CREATED')
  async create(@Body() dto: any, @Request() req) {
    // pdfBuffer se extraería si la secretaria sube el archivo en esta misma petición
    return this.resolutionsService.createResolution(
      dto,
      req.user.id,
      dto.pdfBuffer,
    );
  }

  @Get('protocol/:protocolId')
  async findByProtocolId(@Param('protocolId') protocolId: string) {
    return this.resolutionsService.findByProtocolId(+protocolId);
  }
}
