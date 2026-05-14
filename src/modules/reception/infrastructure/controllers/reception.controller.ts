import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
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

@Controller('reception')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

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
    return this.receptionService.uploadDocument(dto, req.user.id);
  }

  @Permissions(Permission.RECEPTION_UPLOAD)
  @Post('protocol/:protocolId/documents/bulk')
  @Audit('DOCUMENTS_BULK_UPLOADED')
  async uploadMultipleDocuments(
    @Request() req,
    @Body() dto: UploadMultipleDocumentsDto,
  ) {
    return this.receptionService.uploadMultipleDocuments(dto, req.user.id);
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
    return this.receptionService.getDocuments(+protocolId);
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
