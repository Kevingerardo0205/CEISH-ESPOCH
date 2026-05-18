import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IReceptionRepository } from '../../domain/ports/reception.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { RequirementsService } from '../../../protocols/application/services/requirements.service';
import { ReceptionMapper } from '../mappers/reception.mapper';
import { DocumentValidationMapper } from '../mappers/document-validation.mapper';
import { ReceptionStatus } from '../../../protocols/domain/enums/reception-status.enum';
import { StudyTypeCode } from '../../../protocols/domain/enums/study-type.enum';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';
import {
  UploadDocumentDto,
  UploadMultipleDocumentsDto,
} from '../dtos/upload-document.dto';
import { ReceptionDocumentOrmEntity } from '../../infrastructure/database/recepcion-document.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';

import { DocumentValidationStatus } from '../../domain/enums/document-validation-status.enum';

import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';

@Injectable()
export class ReceptionService {
  constructor(
    private readonly receptionRepository: IReceptionRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly requirementsService: RequirementsService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly emailService: IEmailServicePort,

    @InjectRepository(ProtocolRequirementOrmEntity)
    private readonly requirementRepository: Repository<ProtocolRequirementOrmEntity>,
  ) {}

  /**
   * Fase 3 y 4: Motor de Decisión y Notificaciones Automáticas
   */
  async finalizarRevision(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException('Recepción no encontrada');

    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['principalInvestigator', 'studyType'],
    } as any);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const investigator = protocol.principalInvestigator;

    const studyTypeCode =
      (protocol.studyType?.code as StudyTypeCode) || StudyTypeCode.IO;
    const requiredDocs = await this.requirementsService.calcularRequeridos(
      studyTypeCode,
      {
        muestras: protocol.usesBiologicalSamples,
        vulnerable: protocol.isVulnerablePopulation,
        multicentrico: protocol.isMulticentric,
        institucionesPublicas: protocol.hasExternalInstitutions,
        poblacionIndigena: protocol.isIndigenousPopulation,
      },
    );

    const latestValidations =
      await this.receptionRepository.findLatestValidationsByProtocolId(
        protocolId,
      );
    const uploadedDocs =
      await this.receptionRepository.findDocumentsByProtocolId(protocolId);

    const missingRequirements: string[] = [];

    for (const req of requiredDocs) {
      if (!req.isRequired) continue;
      
      // Filtramos documentos vinculados a este requisito
      const docsForReq = uploadedDocs.filter(
        (d) =>
          d.requirementId !== null ? d.requirementId === req.id : // Si tenemos ID, usamos ID
          (d.tipoDocumento?.codigoAnexo === req.code || d.fileName.includes(req.name)), // Fallback por código/nombre
      );

      if (docsForReq.length === 0) {
        missingRequirements.push(`- Falta documento obligatorio: ${req.name}`);
        continue;
      }
      const hasApproved = docsForReq.some((doc) => {
        const val = latestValidations.find((v) => v.documentId === doc.id);
        return val?.statusId === DocumentValidationStatus.APROBADO;
      });
      if (!hasApproved) {
        const lastVal = latestValidations.find((v) =>
          docsForReq.some((d) => d.id === v.documentId),
        );
        const obs = lastVal?.observations
          ? `: ${lastVal.observations}`
          : ' (Sin observaciones específicas)';
        missingRequirements.push(`- ${req.name} requiere corrección${obs}`);
      }
    }

    const now = new Date();

    if (missingRequirements.length === 0) {
      reception.statusId = 2;
      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.COMPLETO,
        receptionDate: now,
      });
      await this.receptionRepository.save(reception);

      const updatedProtocol =
        await this.protocolRepository.findById(protocolId);
      const ceishCode = updatedProtocol?.ceishCode || 'PENDIENTE-ASIGNACION';

      const pdfBuffer = await this.pdfGenerator.generateReceptionCertificate({
        ceishCode: ceishCode,
        investigatorName: investigator?.fullName || 'Investigador',
        protocolTitle: protocol.title || 'Sin Título',
        date: now,
        studyType: protocol.studyType?.name || 'Observacional',
      });

      await this.emailService
        .sendReceptionComplete(
          investigator?.institutionalEmail || '',
          investigator?.fullName || 'Investigador',
          protocol.title || 'Sin Título',
          ceishCode,
          pdfBuffer,
        )
        .catch((e) => console.error('Error enviando email completo:', e));

      await this.emailService
        .notifyPresidentNewProtocol(
          'presidente.ceish@espoch.edu.ec',
          protocol.title || 'Sin Título',
          ceishCode,
        )
        .catch((e) => console.error('Error notificando al presidente:', e));

      return {
        status: ReceptionStatus.COMPLETO,
        ceishCode: ceishCode,
        message:
          'Protocolo completado. Se ha enviado la constancia por correo al investigador.',
      };
    } else {
      reception.statusId = 3;
      reception.completionDeadlineDate =
        this.deadlineService.calculateSubmissionDeadline(now);
      const missingList = missingRequirements.join('\n');

      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.INCOMPLETO,
        missingRequirements: missingList,
        submissionDeadline: reception.completionDeadlineDate,
      });

      await this.receptionRepository.save(reception);

      await this.emailService
        .sendReceptionIncomplete(
          investigator?.institutionalEmail || '',
          investigator?.fullName || 'Investigador',
          protocol.title || 'Sin Título',
          missingList,
          reception.completionDeadlineDate,
        )
        .catch((e) => console.error('Error enviando email incompleto:', e));

      return {
        status: ReceptionStatus.INCOMPLETO,
        message:
          'Se han detectado observaciones. Se ha notificado al investigador.',
        missingItems: missingRequirements,
        deadline: reception.completionDeadlineDate,
      };
    }
  }

  async iniciarRecepcion(protocolId: number, createdByUserId: number) {
    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['studyType'],
    });
    if (!protocol)
      throw new NotFoundException(`Protocol ${protocolId} not found`);

    const existingReception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (existingReception)
      throw new ConflictException(
        `Reception already exists for protocol ${protocolId}`,
      );

    const studyTypeCode =
      (protocol.studyType?.code as StudyTypeCode) || StudyTypeCode.IO;
    const calculatedRequirements =
      await this.requirementsService.calcularRequeridos(studyTypeCode, {
        muestras: protocol.usesBiologicalSamples,
        vulnerable: protocol.isVulnerablePopulation,
        multicentrico: protocol.isMulticentric,
        institucionesPublicas: protocol.hasExternalInstitutions,
        poblacionIndigena: protocol.isIndigenousPopulation,
      });

    const checklist = calculatedRequirements.map((req) => ({
      protocolId,
      requirementCode: req.code,
      requirementName: req.name,
      status: RequirementStatus.NO_PRESENTADO,
      pageCount: 0,
    }));
    await this.requirementRepository.save(checklist);

    const reception = await this.receptionRepository.save({
      protocolId,
      createdByUserId,
      receptionDate: new Date(),
      statusId: 1,
    });

    return ReceptionMapper.toResponse(reception);
  }

  async findOneByProtocolId(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception)
      throw new NotFoundException(
        `Reception for protocol ${protocolId} not found`,
      );
    return ReceptionMapper.toResponse(reception);
  }

  async uploadDocument(dto: UploadDocumentDto, uploadedBy: number) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    if (
      protocol.receptionStatus === ReceptionStatus.EN_REVISION_SECRETARIA ||
      protocol.receptionStatus === ReceptionStatus.COMPLETO
    ) {
      throw new BadRequestException(
        'No puede subir documentos mientras el protocolo está en revisión o ya está completo.',
      );
    }

    const document = await this.receptionRepository.saveDocument({
      protocolId: dto.protocolId,
      requirementId: dto.requirementId, // 3FN: Vínculo directo
      fileName: dto.fileName,
      path: dto.path,
      pageCount: dto.pageCount,
      sizeBytes: dto.sizeBytes,
      isConfidential: dto.isConfidential ?? true,
      uploadedByUserId: uploadedBy,
      isValidatedBySecretary: false,
    });

    // Actualizar estado en checklist
    if (dto.requirementId) {
      await this.requirementRepository.update(dto.requirementId, {
        status: RequirementStatus.PRESENTADO,
        pageCount: dto.pageCount || 0,
      });
    } else if (dto.requirementCode) {
      // Fallback por código para compatibilidad
      const req = await this.requirementRepository.findOne({
        where: {
          protocolId: dto.protocolId,
          requirementCode: dto.requirementCode,
        },
      });
      if (req) {
        await this.requirementRepository.update(req.id, {
          status: RequirementStatus.PRESENTADO,
          pageCount: dto.pageCount || 0,
        });
      }
    }

    return document;
  }

  async uploadMultipleDocuments(
    dto: UploadMultipleDocumentsDto,
    uploadedBy: number,
  ) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    if (
      protocol.receptionStatus === ReceptionStatus.EN_REVISION_SECRETARIA ||
      protocol.receptionStatus === ReceptionStatus.COMPLETO
    ) {
      throw new BadRequestException(
        'No puede subir documentos mientras el protocolo está en revisión.',
      );
    }

    if (dto.documents.length > 50) {
      throw new BadRequestException('Máximo 50 archivos permitidos por carga.');
    }

    const savedDocuments: ReceptionDocumentOrmEntity[] = [];
    for (const docDto of dto.documents) {
      const doc = await this.uploadDocument({
        ...docDto,
        protocolId: dto.protocolId,
      }, uploadedBy);
      savedDocuments.push(doc);
    }
    return savedDocuments;
  }

  async verificarRequisitos(
    protocolId: number,
    isComplete: boolean,
    missingItems?: string,
  ) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception)
      throw new NotFoundException(
        `Reception for protocol ${protocolId} not found`,
      );

    const now = new Date();

    if (isComplete) {
      const requirements = await this.requirementRepository.find({
        where: { protocolId },
      });
      const missing = requirements.filter(
        (r) => r.status === RequirementStatus.NO_PRESENTADO || r.status === RequirementStatus.RECHAZADO,
      );

      if (missing.length > 0) {
        throw new BadRequestException(
          `Faltan requisitos obligatorios o corregidos: ${missing.map((m) => m.requirementName).join(', ')}`,
        );
      }

      reception.hasMissingItems = false;
      reception.statusId = 2;

      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.COMPLETO,
      });
    } else {
      reception.hasMissingItems = true;
      reception.missingItemsList = missingItems;
      reception.statusId = 3;
      reception.completionDeadlineDate =
        this.deadlineService.calculateSubmissionDeadline(now);
      reception.missingItemsNotificationDate = now;

      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.INCOMPLETO,
        missingRequirements: missingItems,
        submissionDeadline: reception.completionDeadlineDate,
      });
    }

    const saved = await this.receptionRepository.save(reception);
    return ReceptionMapper.toResponse(saved);
  }

  async updateRequirementStatus(
    protocolId: number,
    requirementId: number,
    status: RequirementStatus,
  ) {
    const requirement = await this.requirementRepository.findOne({
      where: { id: requirementId, protocolId },
    });
    if (!requirement) throw new NotFoundException('Requisito no encontrado');

    requirement.status = status;
    return this.requirementRepository.save(requirement);
  }

  async validateDocument(
    documentId: number,
    userId: number,
    statusId: number,
    observations?: string,
  ) {
    const document =
      await this.receptionRepository.findDocumentById(documentId);
    if (!document)
      throw new NotFoundException(`Document ${documentId} not found`);

    // 1. Registrar validación individual (Historial habilitado)
    const validation = await this.receptionRepository.saveValidation({
      documentId,
      statusId,
      observations,
      validatedByUserId: userId,
      validationDate: new Date(),
    });

    // 2. Marcar documento como procesado
    await this.receptionRepository.saveDocument({
      ...document,
      isValidatedBySecretary: true,
    });

    // 3. Sincronización Automática con el Checklist (Punto Clave Fase 3)
    if (document.requirementId) {
      let newStatus: RequirementStatus;
      
      if (statusId === DocumentValidationStatus.APROBADO) {
        newStatus = RequirementStatus.APROBADO;
      } else {
        newStatus = RequirementStatus.RECHAZADO;
      }

      await this.requirementRepository.update(document.requirementId, {
        status: newStatus,
        observations: observations || '',
      });
    }

    // 4. Actualizar estado del protocolo si es necesario
    const protocol = await this.protocolRepository.findById(
      document.protocolId,
    );
    if (
      protocol &&
      protocol.receptionStatus !== ReceptionStatus.EN_REVISION_SECRETARIA &&
      protocol.receptionStatus !== ReceptionStatus.COMPLETO
    ) {
      await this.protocolRepository.update(protocol.id, {
        receptionStatus: ReceptionStatus.EN_REVISION_SECRETARIA,
      });
    }

    return DocumentValidationMapper.toResponse(validation);
  }

  async getDocuments(protocolId: number) {
    return this.receptionRepository.findDocumentsByProtocolId(protocolId);
  }

  async archivarPorVencimiento(protocolId: number) {
    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException('Recepción no encontrada');

    reception.statusId = 4; // ARCHIVADO POR VENCIMIENTO
    await this.receptionRepository.save(reception);

    await this.protocolRepository.update(protocolId, {
      receptionStatus: 'ARCHIVADO' as any,
    });

    return { message: 'Protocolo archivado por vencimiento de plazo.' };
  }

  async emitirConstancia(protocolId: number) {
    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['principalInvestigator', 'studyType'],
    } as any);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const investigator = protocol.principalInvestigator;
    const ceishCode = protocol.ceishCode || 'PENDIENTE-ASIGNACION';
    const now = new Date();

    const pdfBuffer = await this.pdfGenerator.generateReceptionCertificate({
      ceishCode: ceishCode,
      investigatorName: investigator?.fullName || 'Investigador',
      protocolTitle: protocol.title || 'Sin Título',
      date: now,
      studyType: protocol.studyType?.name || 'Observacional',
    });

    await this.emailService.sendReceptionComplete(
      investigator?.institutionalEmail || '',
      investigator?.fullName || 'Investigador',
      protocol.title || 'Sin Título',
      ceishCode,
      pdfBuffer,
    );

    const reception = await this.receptionRepository.findByProtocolId(protocolId);
    if (reception) {
      reception.isCertificateIssued = true;
      reception.certificateDate = now;
      await this.receptionRepository.save(reception);
    }

    return { message: 'Constancia emitida y enviada exitosamente.' };
  }
}
