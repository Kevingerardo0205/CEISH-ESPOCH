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
import { DocumentOrmEntity } from '../../../documents/infrastructure/database/document.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';
import { RequirementMapper } from '../../../protocols/application/mappers/requirement.mapper';

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

    @InjectRepository(ProtocolVersionOrmEntity)
    private readonly versionRepository: Repository<ProtocolVersionOrmEntity>,
  ) {}

  /**
   * Obtiene el detalle completo para la pantalla de validación (Checklist)
   */
  async getValidationDetail(protocolId: number) {
    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['studyType', 'principalInvestigator', 'checklist'],
    });
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    const documents =
      await this.receptionRepository.findDocumentsByProtocolId(protocolId);

    // Mapeo robusto de requerimientos con sus documentos adjuntos
    const unmappedDocs = [...documents];

    const checklistWithDocs =
      protocol.checklist?.map((req) => {
        // 1. Intentar match por ID directo (3FN)
        let docIndex = unmappedDocs.findIndex(
          (d) => d.requirementId === req.id,
        );

        // 2. Si falla, intentar match por código o nombre
        if (docIndex === -1) {
          docIndex = unmappedDocs.findIndex(
            (d) =>
              (d.fileName &&
                d.fileName
                  .toLowerCase()
                  .includes(req.requirementName.toLowerCase())) ||
              (d.fileName &&
                d.fileName
                  .toLowerCase()
                  .includes(req.requirementCode.toLowerCase())),
          );
        }

        // 3. Fallback final (Secuencial): Tomar el primer documento disponible si el requerimiento está marcado como PRESENTADO
        // Esto es útil para los datos antiguos o uploads de prueba masivos
        if (
          docIndex === -1 &&
          (req.status === RequirementStatus.PRESENTADO ||
            req.status === RequirementStatus.APROBADO) &&
          unmappedDocs.length > 0
        ) {
          docIndex = 0;
        }

        let doc: DocumentOrmEntity | null = null;
        if (docIndex !== -1) {
          doc = unmappedDocs[docIndex];
          // Remover el documento asignado para no asignarlo a otro requerimiento
          unmappedDocs.splice(docIndex, 1);
        }

        return {
          ...RequirementMapper.toResponse(req),
          attachedDocument: doc
            ? {
                id: doc.id,
                fileName: doc.fileName,
                path: doc.path,
                isValidated: doc.isValidatedBySecretary,
                uploadedAt: doc.createdAt,
                pageCount: doc.pageCount,
              }
            : null,
        };
      }) || [];

    return {
      header: {
        id: protocol.id,
        ceishCode: protocol.ceishCode || 'TRÁMITE EN PROCESO',
        title: protocol.title,
        submissionDate: protocol.receptionDate || protocol.createdAt,
        investigator: protocol.principalInvestigator?.fullName || 'No asignado',
        studyType: protocol.studyType?.name || 'No especificado',
      },
      checklist: checklistWithDocs,
      globalStatus: {
        isComplete: protocol.receptionStatus === ReceptionStatus.COMPLETO,
        status: protocol.receptionStatus,
        hasMissingItems: reception?.hasMissingItems || false,
        missingItemsList:
          reception?.missingItemsList || protocol.missingRequirements,
        submissionDeadline: protocol.submissionDeadline,
      },
    };
  }

  /**
   * Obtiene la lista completa de protocolos en bandeja de secretaría (optimizada y sin paginación)
   */
  async getProtocolsForReception() {
    const data = await this.protocolRepository.findProtocolsForReception();

    return data.map((p) => ({
      id: p.id,
      ceishCode: p.ceishCode,
      title: p.title,
      receptionStatus: p.receptionStatus,
      receptionDate: p.receptionDate,
      submissionDeadline: p.submissionDeadline,
      studyType: p.studyType ? p.studyType.name : null,
      principalInvestigator: p.principalInvestigator
        ? p.principalInvestigator.fullName
        : null,
    }));
  }

  /**
   * Fase 3 y 4: Motor de Decisión y Notificaciones Automáticas
   */

  async finalizarRevision(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException('Recepción no encontrada');

    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['principalInvestigator', 'studyType', 'checklist'],
    } as any);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const investigator = protocol.principalInvestigator;

    // ── NUEVO: Validar que no queden documentos sin calificar por secretaría ──
    const uploadedDocs =
      await this.receptionRepository.findDocumentsByProtocolId(protocolId);
    const unvalidatedDocs = uploadedDocs.filter(
      (d) => !d.isValidatedBySecretary,
    );
    if (unvalidatedDocs.length > 0) {
      throw new BadRequestException(
        `No se puede finalizar la revisión: existen ${unvalidatedDocs.length} documentos subidos pendientes de validación por parte de la Secretaría.`,
      );
    }

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

    const missingRequirements: string[] = [];

    for (const req of requiredDocs) {
      if (!req.isRequired) continue;

      // 1. Intentar buscar el estado del requisito en la lista de verificación (checklist) real de la DB
      const checklistItem = protocol.checklist?.find(
        (c) => c.requirementCode === req.code,
      );

      if (checklistItem) {
        if (
          checklistItem.status === RequirementStatus.APROBADO ||
          checklistItem.status === RequirementStatus.NO_APLICA
        ) {
          // Si ya está aprobado o validado por la Secretaría, no falta ni requiere subsanación
          continue;
        }

        if (checklistItem.status === RequirementStatus.RECHAZADO) {
          const obs = checklistItem.observations
            ? `: ${checklistItem.observations}`
            : ' (Sin observaciones específicas)';
          missingRequirements.push(`- ${req.name} requiere corrección${obs}`);
          continue;
        }

        // Si está PENDIENTE o NO_PRESENTADO, se considera faltante
        missingRequirements.push(`- Falta documento obligatorio: ${req.name}`);
        continue;
      }

      // Si el requisito no tiene checklist, es faltante (sin fallback por nombre)
      missingRequirements.push(`- Falta documento obligatorio: ${req.name}`);
    }

    const now = new Date();

    if (missingRequirements.length === 0) {
      reception.statusId = 2;
      reception.receptionDate = now;
      if (!protocol.ceishCode) {
        protocol.ceishCode = await this.receptionRepository.generateCeishCode(
          protocol.studyTypeId || protocol.studyType?.id || 1,
          now.getFullYear(),
        );
        await this.protocolRepository.save(protocol);
      }
      await this.receptionRepository.save(reception);

      // CRÍTICO 4: Crear automáticamente la Versión 1 en versiones_protocolo
      const existingVersion = await this.versionRepository.findOne({
        where: { protocolId, versionNumber: 1 },
      });
      if (!existingVersion) {
        await this.versionRepository.save({
          protocolId,
          versionNumber: 1,
          submissionDate: now,
          statusId: 1, // Estado inicial
        });
      }

      const ceishCode = protocol.ceishCode || 'PENDIENTE-ASIGNACION';

      const pdfBuffer = await this.pdfGenerator.generateReceptionCertificate({
        ceishCode: ceishCode,
        investigatorName: investigator?.fullName || 'Investigador',
        protocolTitle: protocol.title || 'Sin Título',
        date: now,
        studyType: protocol.studyType?.name || 'Observacional',
        version: 1,
        checklist:
          protocol.checklist?.map((c) => ({
            requirementName: c.requirementName,
            status: c.status,
            pageCount: c.pageCount || 0,
          })) || [],
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
      reception.missingItemsList = missingList;
      reception.hasMissingItems = true;

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

    // CRÍTICO 2: Evitar duplicar el checklist de requisitos si ya existen registros
    const existingRequirements = await this.requirementRepository.find({
      where: { protocolId },
    });

    if (existingRequirements.length === 0) {
      const checklist = calculatedRequirements.map((req) => ({
        protocolId,
        requirementCode: req.code,
        requirementName: req.name,
        status: RequirementStatus.NO_PRESENTADO,
        pageCount: 0,
      }));
      await this.requirementRepository.save(checklist);
    }

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

    const savedDocuments: DocumentOrmEntity[] = [];
    for (const docDto of dto.documents) {
      const doc = await this.uploadDocument(
        {
          ...docDto,
          protocolId: dto.protocolId,
        },
        uploadedBy,
      );
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
      const protocol = await this.protocolRepository.findById(protocolId, {
        relations: ['studyType', 'checklist'],
      } as any);
      if (!protocol) throw new NotFoundException('Protocolo no encontrado');

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

      const missing: string[] = [];

      for (const req of requiredDocs) {
        if (!req.isRequired) continue;

        const checklistItem = protocol.checklist?.find(
          (c) => c.requirementCode === req.code,
        );

        if (
          checklistItem &&
          (checklistItem.status === RequirementStatus.APROBADO ||
            checklistItem.status === RequirementStatus.NO_APLICA)
        ) {
          continue;
        }

        missing.push(req.name);
      }

      if (missing.length > 0) {
        throw new BadRequestException(
          `Faltan requisitos obligatorios o corregidos: ${missing.join(', ')}`,
        );
      }

      reception.hasMissingItems = false;
      reception.statusId = 2;
      reception.receptionDate = now;
      const protocolForCode =
        await this.protocolRepository.findById(protocolId);
      if (protocolForCode && !protocolForCode.ceishCode) {
        protocolForCode.ceishCode =
          await this.receptionRepository.generateCeishCode(
            protocolForCode.studyTypeId || 1,
            now.getFullYear(),
          );
        await this.protocolRepository.save(protocolForCode);
      }

      // CRÍTICO 4: Crear automáticamente la Versión 1 en versiones_protocolo
      const existingVersion = await this.versionRepository.findOne({
        where: { protocolId, versionNumber: 1 },
      });
      if (!existingVersion) {
        await this.versionRepository.save({
          protocolId,
          versionNumber: 1,
          submissionDate: now,
          statusId: 1, // Estado inicial
        });
      }
    } else {
      reception.hasMissingItems = true;
      reception.missingItemsList = missingItems;
      reception.statusId = 3;
      reception.completionDeadlineDate =
        this.deadlineService.calculateSubmissionDeadline(now);
      reception.missingItemsNotificationDate = now;
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
    pageCount?: number,
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
      pageCount: pageCount !== undefined ? pageCount : document.pageCount,
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
        pageCount: pageCount !== undefined ? pageCount : document.pageCount,
      });
    }

    // 4. Actualizar estado de la recepción si es necesario
    const receptionForVal = await this.receptionRepository.findByProtocolId(
      document.protocolId,
    );
    if (
      receptionForVal &&
      receptionForVal.statusId !== 5 && // EN_REVISION_SECRETARIA
      receptionForVal.statusId !== 2 // COMPLETO
    ) {
      receptionForVal.statusId = 5;
      await this.receptionRepository.save(receptionForVal);
    }

    return DocumentValidationMapper.toResponse(validation);
  }

  async getDocuments(protocolId: number) {
    return this.receptionRepository.findDocumentsByProtocolId(protocolId);
  }

  async findDocumentById(documentId: number) {
    return this.receptionRepository.findDocumentById(documentId);
  }

  async archivarPorVencimiento(protocolId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) throw new NotFoundException('Recepción no encontrada');

    reception.statusId = 4; // ARCHIVADO POR VENCIMIENTO
    await this.receptionRepository.save(reception);

    return { message: 'Protocolo archivado por vencimiento de plazo.' };
  }

  async emitirConstancia(protocolId: number) {
    const protocol = await this.protocolRepository.findById(protocolId, {
      relations: ['principalInvestigator', 'studyType', 'checklist'],
    } as any);
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const investigator = protocol.principalInvestigator;
    const ceishCode = protocol.ceishCode || 'PENDIENTE-ASIGNACION';
    const now = new Date();

    const latestVersion = await this.versionRepository.findOne({
      where: { protocolId },
      order: { versionNumber: 'DESC' },
    });
    const versionNum = latestVersion ? latestVersion.versionNumber : 1;

    const pdfBuffer = await this.pdfGenerator.generateReceptionCertificate({
      ceishCode: ceishCode,
      investigatorName: investigator?.fullName || 'Investigador',
      protocolTitle: protocol.title || 'Sin Título',
      date: now,
      studyType: protocol.studyType?.name || 'Observacional',
      version: versionNum,
      checklist:
        protocol.checklist?.map((c) => ({
          requirementName: c.requirementName,
          status: c.status,
          pageCount: c.pageCount || 0,
        })) || [],
    });

    await this.emailService.sendReceptionComplete(
      investigator?.institutionalEmail || '',
      investigator?.fullName || 'Investigador',
      protocol.title || 'Sin Título',
      ceishCode,
      pdfBuffer,
    );

    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (reception) {
      reception.isCertificateIssued = true;
      reception.certificateDate = now;
      await this.receptionRepository.save(reception);
    }

    return { message: 'Constancia emitida y enviada exitosamente.' };
  }

  async updateReceptionStatus(protocolId: number, statusId: number) {
    const reception =
      await this.receptionRepository.findByProtocolId(protocolId);
    if (!reception) {
      throw new NotFoundException(
        `No se encontró la recepción para el protocolo ${protocolId}`,
      );
    }
    reception.statusId = statusId;
    return this.receptionRepository.save(reception);
  }
}
