import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import {
  StorageKeyAccessPolicy,
  StorageReader,
} from '../../application/storage-key-access.policy';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestWithReader {
  user: StorageReader;
}

@ApiTags('storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StorageController {
  constructor(
    private readonly storageService: IStorageService,
    private readonly accessPolicy: StorageKeyAccessPolicy,
  ) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generar URL prefirmada para subir un archivo (método PUT)',
  })
  async getUploadUrl(
    @Body('key') key: string,
    @Body('contentType') contentType: string,
    @Request() req: RequestWithReader,
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

    await this.accessPolicy.assertCanWrite(key, contentType, req.user);
    const url = await this.storageService.generateUploadUrl(key, contentType);
    return { uploadUrl: url, key };
  }

  @Get('download-url')
  @ApiOperation({
    summary:
      'Generar URL prefirmada para descargar/visualizar un archivo (método GET)',
  })
  async getDownloadUrl(
    @Query('key') key: string,
    @Request() req: RequestWithReader,
  ) {
    if (!key) {
      throw new BadRequestException(
        'La clave (key) del archivo es obligatoria',
      );
    }

    await this.accessPolicy.assertCanRead(key, req.user);
    const url = await this.storageService.getDownloadUrl(key);
    return { downloadUrl: url };
  }

  @Post('download-url')
  @ApiOperation({
    summary:
      'Generar URL prefirmada para descargar/visualizar un archivo (método POST)',
  })
  async getDownloadUrlPost(
    @Body('key') key: string,
    @Request() req: RequestWithReader,
  ) {
    if (!key) {
      throw new BadRequestException(
        'La clave (key) del archivo es obligatoria en el body',
      );
    }

    await this.accessPolicy.assertCanRead(key, req.user);
    const url = await this.storageService.getDownloadUrl(key);
    return { downloadUrl: url };
  }
}
