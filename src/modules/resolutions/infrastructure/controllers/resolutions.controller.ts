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

@Controller('resolutions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResolutionsController {
  constructor(private readonly resolutionsService: ResolutionsService) {}

  @Post()
  @Roles('presidente')
  @Audit('RESOLUTION_CREATED')
  async create(@Body() dto: any, @Request() req) {
    return this.resolutionsService.createResolution(dto, req.user.id);
  }

  @Get('protocol/:protocolId')
  async findByProtocolId(@Param('protocolId') protocolId: string) {
    return this.resolutionsService.findByProtocolId(+protocolId);
  }
}
