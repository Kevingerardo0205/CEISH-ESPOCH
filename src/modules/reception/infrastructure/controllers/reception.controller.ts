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
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';

@Controller('reception')
@UseGuards(JwtAuthGuard)
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Post('protocol/:protocolId/start')
  @Audit('RECEPTION_STARTED')
  async iniciarRecepcion(
    @Param('protocolId') protocolId: string,
    @Request() req,
  ) {
    return this.receptionService.iniciarRecepcion(+protocolId, req.user.id);
  }

  @Get('protocol/:protocolId')
  async findByProtocolId(@Param('protocolId') protocolId: string) {
    return this.receptionService.findOneByProtocolId(+protocolId);
  }

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

  @Post('protocol/:protocolId/document')
  @Audit('DOCUMENT_UPLOADED')
  async uploadDocument(@Request() req, @Body() dto: UploadDocumentDto) {
    return this.receptionService.uploadDocument(dto, req.user.id);
  }

  @Post('protocol/:protocolId/documents/bulk')
  @Audit('DOCUMENTS_BULK_UPLOADED')
  async uploadMultipleDocuments(
    @Request() req,
    @Body() dto: UploadMultipleDocumentsDto,
  ) {
    return this.receptionService.uploadMultipleDocuments(dto, req.user.id);
  }

  @Post('protocol/:protocolId/archive-vencimiento')
  @Audit('RECEPTION_ARCHIVED_BY_EXPIRATION')
  async archivar(@Param('protocolId') protocolId: string) {
    return this.receptionService.archivarPorVencimiento(+protocolId);
  }

  @Post('protocol/:protocolId/certificate')
  @Audit('RECEPTION_CERTIFICATE_ISSUED')
  async emitirConstancia(@Param('protocolId') protocolId: string) {
    return this.receptionService.emitirConstancia(+protocolId);
  }

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

  @Get('protocol/:protocolId/documents')
  async getDocuments(@Param('protocolId') protocolId: string) {
    return this.receptionService.getDocuments(+protocolId);
  }

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
