import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from '../../application/services/documents.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo documento' })
  async create(@Body() data: any) {
    return this.documentsService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos registrados' })
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get('protocol/:id')
  @ApiOperation({ summary: 'Listar documentos por ID de protocolo' })
  async findByProtocol(@Param('id') protocolId: string) {
    return this.documentsService.findByProtocol(+protocolId);
  }
}
