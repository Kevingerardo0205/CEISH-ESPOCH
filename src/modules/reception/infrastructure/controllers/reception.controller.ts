import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ReceptionService } from '../../application/services/reception.service';
import { ValidateDocumentDto } from '../../application/dtos/validate-document.dto';
import { VerifyReceptionDto } from '../../application/dtos/verify-reception.dto';
import {
  UploadDocumentDto,
  UploadMultipleDocumentsDto,
} from '../../application/dtos/upload-document.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';
import { DocumentMapper } from '../../application/mappers/document.mapper';

import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import {
  isValidPdfExtension,
  sanitizeFilenameBackend,
} from '../../../../shared/utils/validation';

@Controller('reception')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceptionController {
  constructor(
    private readonly receptionService: ReceptionService,
    private readonly storageService: IStorageService,
  ) {}

  @Get('protocol/:protocolId/validation-detail')
  async getValidationDetail(
    @Param('protocolId') protocolId: string,
    @Request() req,
  ) {
    return this.receptionService.getValidationDetail(
      +protocolId,
      req.user.id,
      req.user.permissions,
    );
  }

  @Permissions(Permission.RECEPTION_VIEW)
  @Get('protocols')
  async getProtocolsForReception(@Query('status') status?: string) {
    return this.receptionService.getProtocolsForReception(status);
  }

  @Permissions(Permission.RECEPTION_START)
  @Post('protocol/:protocolId/start')
  @Audit('RECEPTION_STARTED')
  async iniciarRecepcion(
    @Param('protocolId') protocolId: string,
    @Request() req,
  ) {
    return this.receptionService.iniciarRecepcion(+protocolId, req.user.id);
  }

  @Permissions(
    Permission.RECEPTION_VIEW,
    Permission.EVALUACION_RIESGO,
    Permission.EVALUATION_VIEW_MINE,
  )
  @Get('protocol/:protocolId')
  async findByProtocolId(@Param('protocolId') protocolId: string) {
    return this.receptionService.findOneByProtocolId(+protocolId);
  }

  @Permissions(Permission.DOCUMENTS_VALIDATE)
  @Patch('protocol/:protocolId/verify')
  @Audit('REQUIREMENTS_VERIFIED')
  async verificar(
    @Param('protocolId') protocolId: string,
    @Body() dto: VerifyReceptionDto,
  ) {
    return this.receptionService.verificarRequisitos(
      +protocolId,
      dto.isComplete,
      dto.missingItemsList,
    );
  }

  @Permissions(Permission.DOCUMENTS_VALIDATE)
  @Post('protocol/:protocolId/finalize')
  @Audit('RECEPTION_FINALIZED')
  async finalizarRevision(@Param('protocolId') protocolId: string) {
    return this.receptionService.finalizarRevision(+protocolId);
  }

  @Permissions(Permission.RECEPTION_UPLOAD)
  @Post('protocol/:protocolId/document')
  @Audit('DOCUMENT_UPLOADED')
  async uploadDocument(@Request() req, @Body() dto: UploadDocumentDto) {
    if (!dto.fileName) {
      throw new BadRequestException('El nombre del archivo es obligatorio');
    }
    if (!isValidPdfExtension(dto.fileName)) {
      throw new BadRequestException('El archivo debe tener formato PDF');
    }
    dto.fileName = sanitizeFilenameBackend(dto.fileName);

    const document = await this.receptionService.uploadDocument(
      dto,
      req.user.id,
    );
    return DocumentMapper.toResponse(document);
  }

  @Permissions(Permission.RECEPTION_UPLOAD)
  @Post('protocol/:protocolId/documents/bulk')
  @Audit('DOCUMENTS_BULK_UPLOADED')
  async uploadMultipleDocuments(
    @Request() req,
    @Body() dto: UploadMultipleDocumentsDto,
  ) {
    const documents = await this.receptionService.uploadMultipleDocuments(
      dto,
      req.user.id,
    );
    return DocumentMapper.toResponseList(documents);
  }

  @Permissions(Permission.DOCUMENTS_VALIDATE)
  @Post('protocol/:protocolId/archive-vencimiento')
  @Audit('RECEPTION_ARCHIVED_BY_EXPIRATION')
  async archivar(@Param('protocolId') protocolId: string) {
    return this.receptionService.archivarPorVencimiento(+protocolId);
  }

  @Permissions(Permission.DOCUMENTS_APPROVE_FINAL)
  @Post('protocol/:protocolId/certificate')
  @Audit('RECEPTION_CERTIFICATE_ISSUED')
  async emitirConstancia(@Param('protocolId') protocolId: string) {
    return this.receptionService.emitirConstancia(+protocolId);
  }

  @Permissions(Permission.DOCUMENTS_VALIDATE)
  @Post('document/:documentId/validate')
  @Audit('DOCUMENT_VALIDATED')
  async validateDocument(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body() dto: ValidateDocumentDto,
  ) {
    return this.receptionService.validateDocument(
      +documentId,
      req.user.id,
      dto.statusId,
      dto.observations,
      dto.pageCount,
    );
  }

  @Permissions(
    Permission.RECEPTION_VIEW,
    Permission.EVALUACION_RIESGO,
    Permission.EVALUATION_VIEW_MINE,
  )
  @Get('protocol/:protocolId/documents')
  async getDocuments(@Param('protocolId') protocolId: string) {
    const documents = await this.receptionService.getDocuments(+protocolId);
    return DocumentMapper.toResponseList(documents);
  }

  @Get('document/:documentId/view')
  @Audit('DOCUMENT_VIEWED')
  async viewDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const document = await this.receptionService.findDocumentById(+documentId);
    if (!document) throw new NotFoundException('Documento no encontrado');

    if (document.path && document.path.startsWith('http')) {
      return res.redirect(document.path);
    }

    const hasSlashes = document.path && document.path.includes('/');

    if (!hasSlashes) {
      // Es un archivo heredado (legacy). Podría estar migrado a S3 o seguir solo en local.
      try {
        // Verificamos si existe en S3
        await this.storageService.getMetadata(document.path);
        const downloadUrl = await this.storageService.getDownloadUrl(
          document.path,
        );
        return res.redirect(downloadUrl);
      } catch (error) {
        // Fallback a archivo local si no existe en storage o si la key no corresponde
        const filePath = join(process.cwd(), 'uploads', document.path);

        if (!existsSync(filePath)) {
          throw new NotFoundException(
            'El archivo físico no existe en el servidor ni en storage',
          );
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${document.fileName}"`,
        );

        const file = createReadStream(filePath);
        file.pipe(res);
        return;
      }
    }

    try {
      const downloadUrl = await this.storageService.getDownloadUrl(
        document.path,
      );
      return res.redirect(downloadUrl);
    } catch (error) {
      throw new NotFoundException(
        'El archivo no pudo ser descargado desde el storage',
      );
    }
  }

  @Get('document/:documentId/download-url')
  @Audit('DOCUMENT_DOWNLOAD_URL_GENERATED')
  async getDocumentDownloadUrl(@Param('documentId') documentId: string) {
    const document = await this.receptionService.findDocumentById(+documentId);
    if (!document) throw new NotFoundException('Documento no encontrado');

    if (document.path && document.path.startsWith('http')) {
      return { downloadUrl: document.path };
    }

    const hasSlashes = document.path && document.path.includes('/');

    if (!hasSlashes) {
      // Es un archivo heredado (legacy). Verificamos si ya está en S3
      try {
        await this.storageService.getMetadata(document.path);
      } catch (error) {
        // No está en S3, intentamos migrarlo sobre la marcha si existe localmente
        const filePath = join(process.cwd(), 'uploads', document.path);
        if (existsSync(filePath)) {
          try {
            const buffer = readFileSync(filePath);
            await this.storageService.uploadFile(
              document.path,
              buffer,
              'application/pdf',
            );
          } catch (uploadErr) {
            throw new NotFoundException(
              'El archivo no existe en el storage y falló la migración automática',
            );
          }
        } else {
          throw new NotFoundException(
            'El archivo físico no existe en el servidor ni en storage',
          );
        }
      }
    }

    try {
      const downloadUrl = await this.storageService.getDownloadUrl(
        document.path,
      );
      return { downloadUrl };
    } catch (error) {
      throw new NotFoundException(
        'El archivo no pudo ser localizado en el storage',
      );
    }
  }

  @Permissions(Permission.DOCUMENTS_VALIDATE)
  @Patch('protocol/:protocolId/requirement/:reqId')
  @Audit('REQUIREMENT_STATUS_UPDATED')
  async updateRequirement(
    @Param('protocolId') protocolId: string,
    @Param('reqId') reqId: string,
    @Body('status') status: RequirementStatus,
  ) {
    return this.receptionService.updateRequirementStatus(
      +protocolId,
      +reqId,
      status,
    );
  }
}
