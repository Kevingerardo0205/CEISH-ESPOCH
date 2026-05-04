import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProtocolsService } from '../../application/services/protocols.service';
import { CreateProtocolDto } from '../../application/dtos/create-protocol.dto';
import { QueryProtocolDto } from '../../application/dtos/query-protocol.dto';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { ProtocolMapper } from '../../application/mappers/protocol.mapper';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@Controller('protocols')
@UseGuards(JwtAuthGuard)
export class ProtocolController {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @Get()
  async findAll(@Query() query: QueryProtocolDto) {
    return this.protocolsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const protocol = await this.protocolsService.findOne(+id);
    return ProtocolMapper.toResponse(protocol);
  }

  @Post()
  @Audit('PROTOCOL_CREATED')
  async create(@Body() dto: CreateProtocolDto, @Request() req) {
    const protocol = await this.protocolsService.create(dto, req.user.id);
    return ProtocolMapper.toResponse(protocol);
  }
}
