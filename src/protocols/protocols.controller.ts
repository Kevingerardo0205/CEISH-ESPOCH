import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProtocolsService } from './protocols.service';

@Controller('protocols')
export class ProtocolsController {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @Get()
  findAll() {
    return this.protocolsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.protocolsService.findOne(+id);
  }

  @Post()
  create(@Body() data: any) {
    return this.protocolsService.create(data);
  }
}
