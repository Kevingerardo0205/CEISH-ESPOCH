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

    // ... lógica de validación (idéntica a la anterior)
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
      const docsForReq = uploadedDocs.filter(
        (d) =>
          d.tipoDocumento?.codigoAnexo === req.code ||
          d.fileName.includes(req.name),
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
      // RESULTADO A: COMPLETO
      reception.statusId = 2;

      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.COMPLETO,
        receptionDate: now,
      });

      await this.receptionRepository.save(reception);

      // --- FASE 4: ACCIONES AUTOMÁTICAS (COMPLETO) ---
      // 1. Recargar protocolo para obtener el CÓDIGO CEISH (generado por trigger SQL)
      const updatedProtocol =
        await this.protocolRepository.findById(protocolId);
      const ceishCode = updatedProtocol?.ceishCode || 'PENDIENTE-ASIGNACION';

      // 2. Generar PDF de Constancia (Anexo 7)
      const pdfBuffer = await this.pdfGenerator.generateReceptionCertificate({
        ceishCode: ceishCode,
        investigatorName: investigator?.fullName || 'Investigador',
        protocolTitle: protocol.title || 'Sin Título',
        date: now,
        studyType: protocol.studyType?.name || 'Observacional',
      });

      // 3. Enviar Email con el PDF adjunto
      await this.emailService
        .sendReceptionComplete(
          investigator?.institutionalEmail || '',
          investigator?.fullName || 'Investigador',
          protocol.title || 'Sin Título',
          ceishCode,
          pdfBuffer,
        )
        .catch((e) => console.error('Error enviando email completo:', e));

      // 4. Notificar al Presidente
      await this.emailService
        .notifyPresidentNewProtocol(
          'presidente.ceish@espoch.edu.ec', // Configurable
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
      // RESULTADO B: INCOMPLETO
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

      // --- FASE 4: ACCIONES AUTOMÁTICAS (INCOMPLETO) ---
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

  /**
   * PET 4.1.1: Iniciar Recepción
   * Prepara el registro de recepción e inicializa el checklist dinámico.
   * El código CEISH será generado por Trigger en BD al pasar a estado COMPLETO.
   */
  async iniciarRecepcion(protocolId: number, createdByUserId: number) {
    const protocol = await this.protocolRepository.findById(protocolId);
    if (!protocol)
      throw new NotFoundException(`Protocol ${protocolId} not found`);

    const existingReception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (existingReception)
      throw new ConflictException(
        `Reception already exists for protocol ${protocolId}`,
      );

    // 1. Inicializar Checklist Dinámico (Fase 3 - E6)
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

    // 2. Crear Registro de Recepción
    const reception = await this.receptionRepository.save({
      protocolId,
      createdByUserId,
      receptionDate: new Date(),
      statusId: 1, // PENDIENTE
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

  /**
   * Carga de documento individual unificada en recepcion.documentos
   * Bloquea la subida si el protocolo ya está en revisión por la secretaria.
   */
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
    // ... resto del código anterior

    const totalSize = dto.documents.reduce(
      (acc, doc) => acc + parseInt(doc.sizeBytes || '0'),
      0,
    );
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (totalSize > MAX_SIZE) {
      throw new BadRequestException(
        'El tamaño total de los archivos supera el límite de 100MB.',
      );
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
   * PET 4.1.3: Verificar Requisitos.
   * Al pasar a COMPLETO, el trigger de BD generará el código CEISH.
   */
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
      // Validar checklist
      const requirements = await this.requirementRepository.find({
        where: { protocolId },
      });
      const missing = requirements.filter(
        (r) => r.status === RequirementStatus.NO_PRESENTADO,
      );

      if (missing.length > 0) {
        throw new BadRequestException(
          `Faltan requisitos obligatorios: ${missing.map((m) => m.requirementName).join(', ')}`,
        );
      }

      reception.hasMissingItems = false;
      reception.statusId = 2; // COMPLETADO POR INVESTIGADOR

      // Actualizar estado del protocolo disparará el trigger del Código CEISH
      await this.protocolRepository.update(protocolId, {
        receptionStatus: ReceptionStatus.COMPLETO,
      });
    } else {
      reception.hasMissingItems = true;
      reception.missingItemsList = missingItems;
      reception.statusId = 3; // INCOMPLETO
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

  async archivarPorVencimiento(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception)
      throw new NotFoundException(
        `Reception for protocol ${protocolId} not found`,
      );

    const protocol = await this.protocolRepository.findById(protocolId);
    if (protocol?.receptionStatus !== ReceptionStatus.INCOMPLETO) {
      throw new BadRequestException(
        'Solo se pueden archivar protocolos con estado INCOMPLETO.',
      );
    }

    const now = new Date();
    if (
      !reception.completionDeadlineDate ||
      reception.completionDeadlineDate > now
    ) {
      throw new BadRequestException(
        'El plazo de subsanación aún no ha vencido.',
      );
    }

    await this.protocolRepository.update(protocolId, {
      statusId: 99, // ARCHIVADO
      missingRequirements:
        'Archivado automáticamente por vencimiento de plazo de subsanación.',
    });

    return { message: 'Protocolo archivado exitosamente por vencimiento.' };
  }

  async emitirConstancia(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception)
      throw new NotFoundException(
        `Reception for protocol ${protocolId} not found`,
      );

    const protocol = await this.protocolRepository.findById(protocolId);
    if (protocol?.receptionStatus !== ReceptionStatus.COMPLETO) {
      throw new BadRequestException(
        'Debe completar la recepción antes de emitir la constancia.',
      );
    }

    reception.isCertificateIssued = true;
    reception.certificateDate = new Date();
    await this.receptionRepository.save(reception);

    await this.protocolRepository.update(protocolId, {
      isReceptionCertificateIssued: true,
      receptionCertificateDate: reception.certificateDate,
      isPresidentNotified: true,
      presidentNotificationDate: new Date(),
    });

    return ReceptionMapper.toResponse(reception);
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

    // 1. Registrar validación individual
    const validation = await this.receptionRepository.saveValidation({
      documentId,
      statusId,
      observations,
      validatedByUserId: userId,
      validationDate: new Date(),
    });

    // 2. Marcar documento como procesado por secretaria
    await this.receptionRepository.saveDocument({
      ...document,
      isValidatedBySecretary: true,
    });

    // 3. Si es la primera validación, cambiar estado del protocolo a EN_REVISION_SECRETARIA
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
}
