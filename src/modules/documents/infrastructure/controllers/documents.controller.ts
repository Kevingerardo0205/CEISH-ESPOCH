import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Redirect,
} from '@nestjs/common';
import { DocumentsService } from '../../application/services/documents.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentOrmEntity } from '../database/document.entity.orm';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo documento' })
  async create(@Body() data: Partial<DocumentOrmEntity>) {
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

  // === ENDPOINTS PARA PLANTILLAS DE DOCUMENTOS ===

  @Get('templates')
  @ApiOperation({ summary: 'Listar todas las plantillas de documentos base' })
  async findAllTemplates() {
    return this.documentsService.findAllTemplates();
  }

  @Get('templates/:code/download')
  @ApiOperation({
    summary: 'Redirigir a la URL de descarga de una plantilla por su código',
  })
  @Redirect('https://nestjs.com', 302)
  async downloadTemplate(
    @Param('code') code: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.documentsService.getTemplateDownloadUrl(code);
    return { url, statusCode: 302 };
  }

  @Post('templates')
  @Permissions(Permission.CONFIG_PLANTILLAS)
  @ApiOperation({
    summary:
      'Crear o actualizar los metadatos de una plantilla de documento (Admin)',
  })
  async upsertTemplateMetadata(@Body() body: { code: string; name: string }) {
    return this.documentsService.upsertTemplateMetadata(body.code, body.name);
  }

  @Post('templates/:code/file')
  @Permissions(Permission.CONFIG_PLANTILLAS)
  @ApiOperation({
    summary: 'Asociar una nueva ruta de archivo subido a una plantilla (Admin)',
  })
  async associateTemplateFile(
    @Param('code') code: string,
    @Body() body: { path: string },
  ) {
    // El frontend ya subió el archivo directamente a R2/S3 y nos envía el path/clave guardado
    return this.documentsService.updateTemplateFilePath(code, body.path);
  }
}
