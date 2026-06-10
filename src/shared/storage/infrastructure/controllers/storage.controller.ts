import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { IStorageService } from '../../domain/ports/storage.service.port';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StorageController {
  constructor(private readonly storageService: IStorageService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generar URL prefirmada para subir un archivo (método PUT)',
  })
  async getUploadUrl(
    @Body('key') key: string,
    @Body('contentType') contentType: string,
  ) {
    if (!key) {
      throw new BadRequestException(
        'La clave (key) del archivo es obligatoria',
      );
    }
    if (!contentType) {
      throw new BadRequestException(
        'El tipo de contenido (contentType) es obligatorio',
      );
    }

    const url = await this.storageService.generateUploadUrl(key, contentType);
    return { uploadUrl: url, key };
  }

  @Get('download-url')
  @ApiOperation({
    summary:
      'Generar URL prefirmada para descargar/visualizar un archivo (método GET)',
  })
  async getDownloadUrl(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException(
        'La clave (key) del archivo es obligatoria',
      );
    }

    const url = await this.storageService.getDownloadUrl(key);
    return { downloadUrl: url };
  }
}
