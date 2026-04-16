import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() data: any) {
    // Al enviar: { "protocoloId": 1, "nombreArchivo": "Consentimiento.pdf", "ruta": "/uploads/1/consent.pdf" }
    return this.documentsService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('protocol/:id')
  async findByProtocol(@Param('id') protocolId: string) {
    return this.documentsService.findByProtocol(+protocolId);
  }
}
