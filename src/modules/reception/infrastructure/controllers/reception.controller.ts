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
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
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

@Controller('reception')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Permissions(Permission.RECEPTION_VIEW)
  @Get('protocol/:protocolId/validation-detail')
  async getValidationDetail(@Param('protocolId') protocolId: string) {
    return this.receptionService.getValidationDetail(+protocolId);
  }

  @Permissions(Permission.RECEPTION_VIEW)
  @Get('protocols')
  async getProtocolsForReception() {
    return this.receptionService.getProtocolsForReception();
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

  @Permissions(Permission.RECEPTION_VIEW)
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
    const document = await this.receptionService.uploadDocument(dto, req.user.id);
    return DocumentMapper.toResponse(document);
  }

  @Permissions(Permission.RECEPTION_UPLOAD)
  @Post('protocol/:protocolId/documents/bulk')
  @Audit('DOCUMENTS_BULK_UPLOADED')
  async uploadMultipleDocuments(
    @Request() req,
    @Body() dto: UploadMultipleDocumentsDto,
  ) {
    const documents = await this.receptionService.uploadMultipleDocuments(dto, req.user.id);
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
    );
  }

  @Permissions(Permission.RECEPTION_VIEW)
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

    const filePath = join(process.cwd(), 'uploads', document.path);

    if (!existsSync(filePath)) {
      throw new NotFoundException('El archivo físico no existe en el servidor');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );

    const file = createReadStream(filePath);
    file.pipe(res);
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
