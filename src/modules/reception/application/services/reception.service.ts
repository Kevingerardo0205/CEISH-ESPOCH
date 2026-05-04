import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IReceptionRepository } from '../../domain/ports/reception.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolCodeGenerator } from '../../../protocols/application/services/protocol-code-generator.service';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { ProtocolChecklistFactory } from '../../../protocols/application/factories/protocol-checklist.factory';
import { ReceptionMapper } from '../mappers/reception.mapper';
import { DocumentValidationMapper } from '../mappers/document-validation.mapper';
import { ReceptionStatus } from '../../../protocols/domain/enums/reception-status.enum';
import { StudyTypeCode } from '../../../protocols/domain/enums/study-type.enum';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';
import { UploadDocumentDto, UploadMultipleDocumentsDto } from '../dtos/upload-document.dto';
import { ReceptionDocumentOrmEntity } from '../../infrastructure/database/recepcion-document.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';

@Injectable()
export class ReceptionService {
  constructor(
    private readonly receptionRepository: IReceptionRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly codeGenerator: ProtocolCodeGenerator,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly checklistFactory: ProtocolChecklistFactory,
    
    @InjectRepository(ProtocolRequirementOrmEntity)
    private readonly requirementRepository: Repository<ProtocolRequirementOrmEntity>,
  ) {}

  /**
   * PET 4.1.1 + 4.1.6: Iniciar Recepción
   * Genera código CEISH, crea registro de recepción e inicializa checklist
   */
  async iniciarRecepcion(protocolId: number, createdByUserId: number) {
    const protocol = await this.protocolRepository.findById(protocolId);
    if (!protocol) throw new NotFoundException(`Protocol ${protocolId} not found`);

    const existingReception = await this.receptionRepository.findByProtocolId(protocolId);
    if (existingReception) throw new ConflictException(`Reception already exists for protocol ${protocolId}`);

    // 1. Generar Código
    const studyTypeCode = (protocol.studyType?.code as StudyTypeCode) || StudyTypeCode.IO;
    const year = new Date().getFullYear();
    const count = await this.receptionRepository.countByYearAndType(year, studyTypeCode);
    const generatedCeishCode = this.codeGenerator.generate(studyTypeCode, count + 1);

    // 2. Inicializar Checklist (Requisitos)
    const templates = this.checklistFactory.getRequirements(studyTypeCode);
    const checklist = templates.map(t => ({
      protocolId,
      requirementCode: t.code,
      requirementName: t.name,
      status: RequirementStatus.NO_PRESENTADO,
      pageCount: 0,
    }));
    await this.requirementRepository.save(checklist);

    // 3. Crear Recepción
    const reception = await this.receptionRepository.save({
      protocolId,
      createdByUserId,
      generatedCeishCode,
      receptionDate: new Date(),
      statusId: 1, // PENDIENTE
    });

    // 4. Actualizar Protocolo
    await this.protocolRepository.update(protocolId, { ceishCode: generatedCeishCode });

    return ReceptionMapper.toResponse(reception);
  }

  async findOneByProtocolId(protocolId: number) {
    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException(`Reception for protocol ${protocolId} not found`);
    return ReceptionMapper.toResponse(reception);
  }

  /**
   * Carga de documento individual
   */
  async uploadDocument(dto: UploadDocumentDto, uploadedBy: number) {
    const document = await this.receptionRepository.saveDocument({
      protocolId: dto.protocolId,
      fileName: dto.fileName,
      path: dto.path,
      pageCount: dto.pageCount,
      sizeBytes: dto.sizeBytes,
      isConfidential: dto.isConfidential ?? true,
      uploadedByUserId: uploadedBy,
      isValidatedBySecretary: false,
    });
    return document;
  }

  /**
   * Carga múltiple de documentos (máx 50 archivos, 100MB acumulados)
   */
  async uploadMultipleDocuments(dto: UploadMultipleDocumentsDto, uploadedBy: number) {
    if (dto.documents.length > 50) {
      throw new BadRequestException('Máximo 50 archivos permitidos por carga.');
    }

    const totalSize = dto.documents.reduce((acc, doc) => acc + parseInt(doc.sizeBytes || '0'), 0);
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (totalSize > MAX_SIZE) {
      throw new BadRequestException('El tamaño total de los archivos supera el límite de 100MB.');
    }

    const savedDocuments: ReceptionDocumentOrmEntity[] = [];
    for (const docDto of dto.documents) {
      const doc = await this.receptionRepository.saveDocument({
        protocolId: dto.protocolId,
        fileName: docDto.fileName,
        path: docDto.path,
        pageCount: docDto.pageCount,
        sizeBytes: docDto.sizeBytes,
        isConfidential: docDto.isConfidential ?? true,
        uploadedByUserId: uploadedBy,
        isValidatedBySecretary: false,
      });
      savedDocuments.push(doc);
    }
    return savedDocuments;
  }

  /**
   * PET 4.1.3 + 4.1.4: Verificar Requisitos con validación de obligatorios
   */
  async verificarRequisitos(protocolId: number, isComplete: boolean, missingItems?: string) {
    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException(`Reception for protocol ${protocolId} not found`);

    const now = new Date();
    
    if (isComplete) {
      // VALIDACIÓN: Verificar que todos los requisitos estén PRESENTADOS
      const requirements = await this.requirementRepository.find({ where: { protocolId } });
      const missing = requirements.filter(r => r.status === RequirementStatus.NO_PRESENTADO);
      
      if (missing.length > 0) {
        const missingNames = missing.map(m => m.requirementName).join(', ');
        throw new BadRequestException(`No se puede completar la recepción. Faltan los siguientes requisitos: ${missingNames}`);
      }

      reception.hasMissingItems = false;
      reception.missingItemsList = undefined;
      reception.completionDeadlineDate = undefined;
      reception.statusId = 2; // PENDIENTE DE VALIDACIÓN (Completado por investigador)
      reception.responseDeadlineDays = 60; 
      
      await this.protocolRepository.update(protocolId, { 
        receptionStatus: ReceptionStatus.COMPLETO 
      });
    } else {
      reception.hasMissingItems = true;
      reception.missingItemsList = missingItems;
      reception.statusId = 3; // INCOMPLETO
      reception.completionDeadlineDate = this.deadlineService.calculateSubmissionDeadline(now);
      reception.missingItemsNotificationDate = now;

      await this.protocolRepository.update(protocolId, { 
        receptionStatus: ReceptionStatus.INCOMPLETO,
        missingRequirements: missingItems,
        submissionDeadline: reception.completionDeadlineDate
      });
    }

    const saved = await this.receptionRepository.save(reception);
    return ReceptionMapper.toResponse(saved);
  }

  /**
   * Actualizar estado de un requisito individual
   */
  async updateRequirementStatus(protocolId: number, requirementId: number, status: RequirementStatus) {
    const requirement = await this.requirementRepository.findOne({ where: { id: requirementId, protocolId } });
    if (!requirement) throw new NotFoundException('Requisito no encontrado');

    requirement.status = status;
    return this.requirementRepository.save(requirement);
  }

  async archivarPorVencimiento(protocolId: number) {
    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException(`Reception for protocol ${protocolId} not found`);

    const protocol = await this.protocolRepository.findById(protocolId);
    if (protocol?.receptionStatus !== ReceptionStatus.INCOMPLETO) {
      throw new BadRequestException('Solo se pueden archivar protocolos con estado INCOMPLETO.');
    }

    const now = new Date();
    if (!reception.completionDeadlineDate || reception.completionDeadlineDate > now) {
      throw new BadRequestException('El plazo de subsanación aún no ha vencido.');
    }

    await this.protocolRepository.update(protocolId, {
      statusId: 99, 
      missingRequirements: 'Archivado automáticamente por vencimiento de plazo de subsanación.',
    });

    return { message: 'Protocolo archivado exitosamente por vencimiento.' };
  }

  async emitirConstancia(protocolId: number) {
    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException(`Reception for protocol ${protocolId} not found`);

    const protocol = await this.protocolRepository.findById(protocolId);
    if (protocol?.receptionStatus !== ReceptionStatus.COMPLETO) {
      throw new BadRequestException('Debe completar la recepción antes de emitir la constancia.');
    }

    reception.isCertificateIssued = true;
    reception.certificateDate = new Date();
    await this.receptionRepository.save(reception);
    
    await this.protocolRepository.update(protocolId, {
      isReceptionCertificateIssued: true,
      receptionCertificateDate: reception.certificateDate,
      isPresidentNotified: true,
      presidentNotificationDate: new Date()
    });

    return ReceptionMapper.toResponse(reception);
  }

  async validateDocument(documentId: number, userId: number, statusId: number, observations?: string) {
    const document = await this.receptionRepository.findDocumentById(documentId);
    if (!document) throw new NotFoundException(`Document ${documentId} not found`);

    const validation = await this.receptionRepository.saveValidation({
      documentId,
      statusId,
      observations,
      validatedByUserId: userId,
      validationDate: new Date(),
    });

    return DocumentValidationMapper.toResponse(validation);
  }

  async getDocuments(protocolId: number) {
    return this.receptionRepository.findDocumentsByProtocolId(protocolId);
  }
}
