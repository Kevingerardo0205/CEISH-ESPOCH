import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

/**
 * Catálogo canónico de ítems del Anexo 9 (Guía de Evaluación Técnica).
 * Solo los códigos se persisten en BD; las descripciones viven aquí.
 */
const ANNEX9_ITEM_CATALOG: Record<string, string> = {
  // Ética (10 ítems)
  ET_1: 'Respeta a la persona y comunidad que participa en el estudio.',
  ET_2: 'Autonomía: Consentimiento informado/Idoneidad del formulario escrito y del proceso de obtención. Voluntariedad.',
  ET_3: 'Beneficencia (Valoración del estudio para la persona, comunidad y país).',
  ET_4: 'Confidencialidad.',
  ET_5: 'Aleatorización equitativa de la muestra.',
  ET_6: 'Protección de la población vulnerable.',
  ET_7: 'Riesgos potenciales del estudio.',
  ET_8: 'Beneficios potenciales del estudio.',
  ET_9: 'Competencias éticas y experticia del investigador.',
  ET_10: 'Declaración de conflicto de intereses.',
  // Metodología (12 ítems)
  MET_1:
    'Coherencia entre título, objetivos, hipótesis (de ser pertinente), introducción y justificación. Marco teórico y problema de investigación.',
  MET_2: 'Metodología - Diseño del estudio.',
  MET_3: 'Metodología - Sujetos y tamaño de la muestra.',
  MET_4: 'Metodología - Definición de variables.',
  MET_5: 'Metodología - Medición de variables y procedimientos.',
  MET_6: 'Metodología - Estandarización.',
  MET_7: 'Metodología - Manejo de datos.',
  MET_8: 'Metodología - Análisis estadístico.',
  MET_9: 'Metodología - Resultados y beneficios esperados.',
  MET_10: 'Metodología - Referencias Bibliográficas.',
  MET_11:
    'Metodología - Coherencia entre cronograma, financiamiento y personal.',
  MET_12: 'Metodología - Anexos.',
  // Jurídica (5 ítems)
  JUR_1:
    'La investigación está acorde a la legislación y normativa vigente nacional e internacional.',
  JUR_2:
    'Es un estudio multicéntrico y cuenta con la aprobación del Comité de Ética del país donde radica el patrocinador del estudio.',
  JUR_3: 'Existe contrato entre el promotor del estudio y los investigadores.',
  JUR_4:
    'Existen acuerdos relevantes entre el promotor de la investigación y el sitio clínico en donde ésta se realice.',
  JUR_5:
    'Existe póliza de seguro que cubra las responsabilidades de todos los implicados y prevea compensaciones.',
};
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import {
  SubmitEvaluationDto,
  EvaluationResult,
} from '../dtos/submit-evaluation.dto';
import {
  AspectResult,
  GlobalResult,
  ChecklistItemState,
  EvaluationItemResponseDto,
  Annex9AspectDetailDto,
} from '../dtos/annexes/evaluation-forms.dto';
import {
  EvaluationResponseDetailOrmEntity,
  EvaluationCriterionType,
} from '../../infrastructure/database/evaluation-response-detail.entity.orm';
import {
  CreateEvaluatorProfileDto,
  UpdateEvaluatorProfileDto,
} from '../dtos/evaluator-profile-crud.dto';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { ConflictOfInterestService } from './conflict-of-interest.service';
import { ReceptionStatus } from '../../../protocols/domain/enums/reception-status.enum';
import { PeerRiskAssignmentOrmEntity } from '../../infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { AssignPeerEvaluatorsDto } from '../dtos/assign-peer-evaluators.dto';
import { SubmitPeerRiskDto } from '../dtos/submit-peer-risk.dto';
import { InvestigatorProfileOrmEntity } from '../../../auth/infrastructure/database/investigator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { DocxGeneratorService } from '../../../../shared/utils/docx-generator.service';
import { Logger } from '@nestjs/common';
import { Permission } from '../../../../shared/enums/permission.enum';

@Injectable()
export class EvaluationsService {
  constructor(
    @Inject(IEvaluationRepository)
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly emailService: IEmailServicePort,
    private readonly conflictService: ConflictOfInterestService,
    @InjectRepository(PeerRiskAssignmentOrmEntity)
    private readonly peerRiskRepository: Repository<PeerRiskAssignmentOrmEntity>,
    @InjectRepository(RiskLevelOrmEntity)
    private readonly riskLevelRepository: Repository<RiskLevelOrmEntity>,
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolOrmRepository: Repository<ProtocolOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(InvestigatorProfileOrmEntity)
    private readonly profileRepo: Repository<InvestigatorProfileOrmEntity>,
    @InjectRepository(EvaluatorProfileUserOrmEntity)
    private readonly evaluatorProfileUserRepo: Repository<EvaluatorProfileUserOrmEntity>,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly docxGeneratorService: DocxGeneratorService,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
  ) {}

  private readonly logger = new Logger(EvaluationsService.name);

  /**
   * HU-004: Dashboard de carga por evaluador y protocolos pendientes
   */
  async getEvaluatorsDashboard(profileId?: number) {
    const evaluators =
      (await this.evaluationRepository.findEvaluatorsWithWorkload(
        profileId,
      )) as Array<{
        id: number;
        fullName: string;
        currentLoad: number;
        [key: string]: any;
      }>;

    // Solo se listan en el dashboard de la Presidenta si la recepción está COMPLETA y el nivel de riesgo ha sido consolidado
    const protocols = await this.protocolOrmRepository.find({
      where: {
        activeVersion: {
          reception: {
            statusId: 10, // 10 is COMPLETO
          },
        },
        isRiskLevelDesignated: true,
      },
      relations: ['studyType', 'activeVersion', 'activeVersion.reception'],
      order: {
        activeVersion: {
          reception: {
            receptionDate: 'DESC',
          },
        },
      },
    });

    // Filtrar los que no tienen asignaciones vigentes (opcional según lógica de negocio, por ahora enviamos todos los COMPLETOS)
    const mappedProtocols = protocols.map((p) => {
      let typeCode = 'EI'; // Default PLENO
      if (p.reviewType === ReviewType.EXPEDITA) typeCode = 'IO';
      if (p.reviewType === ReviewType.ENSAYO_CLINICO) typeCode = 'EC';

      return {
        id: p.id,
        ceishCode: p.ceishCode,
        title: p.title,
        receptionDate: p.receptionDate,
        type: typeCode, // Mapeo solicitado por el Frontend
        reviewType: p.reviewType,
      };
    });

    return {
      evaluators: evaluators.sort((a, b) => a.currentLoad - b.currentLoad),
      pendingProtocols: mappedProtocols,
    };
  }

  /**
   * HU-005: Obtener asignaciones con alertas de plazo y sugerencia de Anexo
   */
  async getMyAssignments(evaluatorId: number) {
    const assignments =
      await this.evaluationRepository.findAssignmentsByEvaluatorId(evaluatorId);
    const now = new Date();

    return assignments
      .filter((a) => a.statusId === +AssignmentStatus.ASSIGNED)
      .map((a) => {
        const deadline = a.deadline ? new Date(a.deadline) : null;
        let diffDays: number | null = null;
        let isUrgent = false;

        if (deadline) {
          const diffTime = deadline.getTime() - now.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isUrgent = diffDays !== null && diffDays <= 2 && diffDays >= 0;
        }

        const isRiskDesignated = a.version?.protocol?.isRiskLevelDesignated;
        const reviewType = a.version?.protocol?.reviewType;
        let annexSuggestion: string | null = null;

        if (isRiskDesignated && reviewType) {
          if (reviewType === ReviewType.EXPEDITA)
            annexSuggestion = 'Anexo 9 (Revisión Expedita)';
          else if (reviewType === ReviewType.ENSAYO_CLINICO)
            annexSuggestion = 'Anexo 11 (Ensayos Clínicos)';
          else annexSuggestion = 'Anexo 10 (Revisión Plena)';
        }

        return {
          ...a,
          isUrgent,
          daysRemaining: diffDays,
          annexToUse: annexSuggestion,
        };
      });
  }

  /**
   * HU-005: Registrar evaluación con DTO estructurado (Anexos 9, 10, 11)
   * Aplica la Fase 5: Digitalización de Anexos
   */
  async submitEvaluation(dto: SubmitEvaluationDto, evaluatorId: number) {
    const assignment = await this.evaluationRepository.findAssignmentById(
      dto.assignmentId,
    );

    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.evaluatorId !== evaluatorId) {
      throw new BadRequestException(
        'No tiene permisos para evaluar esta asignación.',
      );
    }
    if (assignment.statusId === +AssignmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Esta evaluación ya ha sido enviada anteriormente.',
      );
    }

    const reviewType =
      assignment.version?.protocol?.reviewType || ReviewType.PLENO;
    let ethicalAspects: Record<string, unknown> = {};
    let methodologicalAspects: Record<string, unknown> = {};
    let legalAspects: Record<string, unknown> = {};

    // 1. Validar y extraer datos según el tipo de revisión (Digitalización Refactorizada)
    switch (reviewType) {
      case ReviewType.EXPEDITA: {
        if (!dto.annex9) {
          throw new BadRequestException(
            'Debe completar el Anexo 9 para revisiones expeditas.',
          );
        }

        // Helper para validar cada aspecto (Ético, Metodológico, Jurídico)
        const validateAspect = (
          aspect: Annex9AspectDetailDto,
          aspectName: string,
        ) => {
          if (!aspect) {
            throw new BadRequestException(
              `Debe proporcionar la evaluación de ${aspectName}.`,
            );
          }
          if (!aspect.items || !Array.isArray(aspect.items)) {
            throw new BadRequestException(
              `Debe proporcionar el checklist de ítems para la evaluación de ${aspectName}.`,
            );
          }

          // Verificar si algún ítem está en NC
          const hasNC = aspect.items.some(
            (it: EvaluationItemResponseDto) =>
              it.estado === ChecklistItemState.NC,
          );
          if (hasNC && aspect.resultado === AspectResult.APROBADO) {
            throw new BadRequestException(
              `El resultado de la evaluación de ${aspectName} no puede ser APROBADO si contiene algún ítem en estado NC (No cumple).`,
            );
          }

          // Validación de observaciones si el aspecto está CON_OBSERVACIONES
          if (
            aspect.resultado === AspectResult.CON_OBSERVACIONES &&
            (!aspect.observaciones || !aspect.observaciones.trim())
          ) {
            throw new BadRequestException(
              `Debe detallar las observaciones generales para la evaluación de ${aspectName}.`,
            );
          }

          // Validación de observaciones para ítems específicos en NC
          for (const item of aspect.items) {
            if (
              item.estado === ChecklistItemState.NC &&
              (!item.observaciones || !item.observaciones.trim())
            ) {
              throw new BadRequestException(
                `Debe detallar la observación específica para el ítem ${item.itemCodigo} de ${aspectName} por estar en estado NC (No cumple).`,
              );
            }
          }
        };

        validateAspect(dto.annex9.etica, 'Ética');
        validateAspect(dto.annex9.metodologia, 'Metodología');
        validateAspect(dto.annex9.juridica, 'Jurídica');

        // Criterios Técnicos PET: Consistencia de Resultados
        const hasObservations =
          dto.annex9.etica.resultado === AspectResult.CON_OBSERVACIONES ||
          dto.annex9.metodologia.resultado === AspectResult.CON_OBSERVACIONES ||
          dto.annex9.juridica.resultado === AspectResult.CON_OBSERVACIONES;

        const hasNoAprobado =
          dto.annex9.etica.resultado === AspectResult.NO_APROBADO ||
          dto.annex9.metodologia.resultado === AspectResult.NO_APROBADO ||
          dto.annex9.juridica.resultado === AspectResult.NO_APROBADO;

        if (hasNoAprobado && dto.result === EvaluationResult.APROBADO) {
          throw new BadRequestException(
            'El dictamen global no puede ser APROBADO si algún componente tiene resultado NO APROBADO.',
          );
        }

        if (hasObservations && dto.result === EvaluationResult.APROBADO) {
          throw new BadRequestException(
            'El dictamen global no puede ser APROBADO si algún componente tiene observaciones. Debe ser APROBADO_CON_OBSERVACIONES.',
          );
        }

        ethicalAspects = {
          resultado: dto.annex9.etica.resultado,
          plazo: dto.annex9.etica.plazo,
          observaciones: dto.annex9.etica.observaciones,
          items: dto.annex9.etica.items,
        };
        methodologicalAspects = {
          resultado: dto.annex9.metodologia.resultado,
          plazo: dto.annex9.metodologia.plazo,
          observaciones: dto.annex9.metodologia.observaciones,
          items: dto.annex9.metodologia.items,
        };
        legalAspects = {
          resultado: dto.annex9.juridica.resultado,
          plazo: dto.annex9.juridica.plazo,
          observaciones: dto.annex9.juridica.observaciones,
          items: dto.annex9.juridica.items,
        };
        break;
      }

      case ReviewType.PLENO: {
        if (!dto.annex10)
          throw new BadRequestException(
            'Debe completar el Anexo 10 para revisiones en pleno.',
          );
        ethicalAspects = {
          resultado: dto.annex10.resultado,
          condiciones: dto.annex10.condicionesDescripcion,
        };
        break;
      }

      case ReviewType.ENSAYO_CLINICO: {
        if (!dto.annex11)
          throw new BadRequestException(
            'Debe completar el Anexo 11 para ensayos clínicos.',
          );
        ethicalAspects = {
          resultado: dto.annex11.resultado,
          fechaEvaluacion: dto.annex11.fechaEvaluacion,
        };
        break;
      }
    }

    // 2. Validación de Informe Consolidado (PDF/Word obligatorio siempre en el PET, excepto si es borrador)
    if (!dto.isDraft && (!dto.reportPath || !dto.reportPath.trim())) {
      throw new BadRequestException(
        'Debe subir obligatoriamente el Documento Consolidado (PDF/Word) firmado para registrar la evaluación.',
      );
    }

    // Buscar si ya existe una evaluación previa para esta asignación (por ejemplo, un borrador guardado)
    const existingEvaluation =
      await this.evaluationRepository.findEvaluationByAssignmentId(
        dto.assignmentId,
      );

    // 3. Guardar o actualizar evaluación en BD (JSONB fields)
    const evaluation = await this.evaluationRepository.saveEvaluation({
      ...(existingEvaluation || {}),
      assignmentId: dto.assignmentId,
      ethicalAspects,
      methodologicalAspects,
      legalAspects,
      result: dto.result,
      observations: dto.observations,
      reportPath: dto.reportPath,
      evaluatedByUserId: evaluatorId,
      evaluationDate: new Date(),
    });

    // Guardar los detalles individuales del checklist en la BD (Opción A Relacional)
    if (reviewType === ReviewType.EXPEDITA && dto.annex9) {
      const detailsToSave: EvaluationResponseDetailOrmEntity[] = [];

      const buildDetailsForAspect = (
        items: EvaluationItemResponseDto[],
        type: EvaluationCriterionType,
      ) => {
        items.forEach((item) => {
          const detail = new EvaluationResponseDetailOrmEntity();
          detail.evaluacionId = evaluation.id;
          detail.criterioTipo = type;
          detail.itemCodigo = item.itemCodigo;
          detail.estado = item.estado;
          detail.observaciones = item.observaciones;
          detailsToSave.push(detail);
        });
      };

      buildDetailsForAspect(
        dto.annex9.etica.items,
        EvaluationCriterionType.ETICA,
      );
      buildDetailsForAspect(
        dto.annex9.metodologia.items,
        EvaluationCriterionType.METODOLOGIA,
      );
      buildDetailsForAspect(
        dto.annex9.juridica.items,
        EvaluationCriterionType.JURIDICA,
      );

      if (existingEvaluation) {
        await this.evaluationRepository.deleteEvaluationResponseDetails(
          existingEvaluation.id,
        );
      }

      await this.evaluationRepository.saveEvaluationResponseDetails(
        detailsToSave,
      );

      // ─────────────────────────────────────────────────────────────────────
      // FASE 2: Generar PDF + DOCX del Anexo 9 y subir a Cloudflare R2
      // ─────────────────────────────────────────────────────────────────────
      try {
        const protocol = await this.protocolRepository.findById(
          assignment.version.protocolId,
        );
        const evaluator = assignment.evaluator;
        const now = new Date();

        // Función compartida: mapear ítems con descripción canónica
        const mapItems = (items: EvaluationItemResponseDto[]) =>
          items.map((it) => ({
            label: ANNEX9_ITEM_CATALOG[it.itemCodigo] ?? it.itemCodigo,
            text: ANNEX9_ITEM_CATALOG[it.itemCodigo] ?? it.itemCodigo,
            c: it.estado === ChecklistItemState.C,
            nc: it.estado === ChecklistItemState.NC,
            na: it.estado === ChecklistItemState.NA,
            obs: it.observaciones,
            observaciones: it.observaciones,
          }));

        const ethicalMapped = mapItems(dto.annex9.etica.items);
        const methodologicalMapped = mapItems(dto.annex9.metodologia.items);
        const legalMapped = mapItems(dto.annex9.juridica.items);

        const commonData = {
          ceishCode: protocol?.ceishCode || 'S/C',
          investigatorName:
            protocol?.principalInvestigator?.fullName ||
            evaluator?.fullName ||
            'Evaluador',
          protocolTitle: protocol?.title || 'Sin título',
          studyType: protocol?.studyType?.name || 'Observacional',
          ethicalResult: dto.annex9.etica.resultado,
          ethicalPlazo: dto.annex9.etica.plazo,
          methodologicalResult: dto.annex9.metodologia.resultado,
          methodologicalPlazo: dto.annex9.metodologia.plazo,
          legalResult: dto.annex9.juridica.resultado,
          legalPlazo: dto.annex9.juridica.plazo,
        };

        const timestamp = Date.now();
        const evalId = evaluation.id;

        // Generar PDF y DOCX en paralelo
        const [pdfBuffer, docxBuffer] = await Promise.all([
          this.pdfGeneratorService.generateAnnex9Report({
            ...commonData,
            date: now,
            ethicalChecklist: ethicalMapped,
            methodologicalChecklist: methodologicalMapped,
            legalChecklist: legalMapped,
            observations: [
              dto.annex9.etica.observaciones,
              dto.annex9.metodologia.observaciones,
              dto.annex9.juridica.observaciones,
              dto.observations,
            ].filter((o): o is string => !!o && o.trim().length > 0),
            revisores: evaluator?.fullName ? [evaluator.fullName] : undefined,
          }),
          this.docxGeneratorService.generateAnnex9Docx({
            ...commonData,
            evaluationDate: now,
            ethicalItems: ethicalMapped,
            methodologicalItems: methodologicalMapped,
            legalItems: legalMapped,
            revisorName: evaluator?.fullName,
          }),
        ]);

        // Subir ambos a Cloudflare R2 en paralelo
        const r2KeyPdf = `evaluations/anexo9/${evalId}-${timestamp}.pdf`;
        const r2KeyDocx = `evaluations/anexo9/${evalId}-${timestamp}.docx`;

        await Promise.all([
          this.storageService.uploadFile(
            r2KeyPdf,
            pdfBuffer,
            'application/pdf',
          ),
          this.storageService.uploadFile(
            r2KeyDocx,
            docxBuffer,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ),
        ]);

        // Persistir ambas rutas en BD
        await this.evaluationRepository.saveEvaluation({
          ...evaluation,
          rutaPdf: r2KeyPdf,
          rutaDocx: r2KeyDocx,
        });
        evaluation.rutaPdf = r2KeyPdf;
        evaluation.rutaDocx = r2KeyDocx;

        this.logger.log(
          `Anexo 9 generado (PDF + DOCX) y subido a R2 para evaluación #${evalId}`,
        );
      } catch (genErr) {
        // No bloquear la evaluación si la generación falla; se loguea
        this.logger.error(
          `Error generando documentos Anexo 9 para evaluación #${evaluation.id}:`,
          genErr,
        );
      }
    }

    // 3.1. Determinar valores para cada uno de los 3 criterios técnicos del PET
    let eticaAprobado = false;
    let metodologiaAprobado = false;
    let juridicaAprobado = false;

    if (reviewType === ReviewType.EXPEDITA && dto.annex9) {
      eticaAprobado = dto.annex9.etica.resultado === AspectResult.APROBADO;
      metodologiaAprobado =
        dto.annex9.metodologia.resultado === AspectResult.APROBADO;
      juridicaAprobado =
        dto.annex9.juridica.resultado === AspectResult.APROBADO;
    } else if (reviewType === ReviewType.PLENO && dto.annex10) {
      const isApprovedOrCond =
        dto.annex10.resultado === GlobalResult.APROBADO ||
        dto.annex10.resultado === GlobalResult.APROBADO_CONDICIONADO;
      eticaAprobado = isApprovedOrCond;
      metodologiaAprobado = isApprovedOrCond;
      juridicaAprobado = isApprovedOrCond;
    } else if (reviewType === ReviewType.ENSAYO_CLINICO && dto.annex11) {
      const isApprovedOrCond =
        dto.annex11.resultado === GlobalResult.APROBADO ||
        dto.annex11.resultado === GlobalResult.APROBADO_CONDICIONADO;
      eticaAprobado = isApprovedOrCond;
      metodologiaAprobado = isApprovedOrCond;
      juridicaAprobado = isApprovedOrCond;
    }

    // Guardar relaciones en la tabla pivote evaluacion_criterio (IDs: 1 = Ética, 2 = Metodológica, 3 = Jurídica)
    await this.evaluationRepository.saveEvaluationCriteria(
      evaluation.id,
      1,
      eticaAprobado,
    );
    await this.evaluationRepository.saveEvaluationCriteria(
      evaluation.id,
      2,
      metodologiaAprobado,
    );
    await this.evaluationRepository.saveEvaluationCriteria(
      evaluation.id,
      3,
      juridicaAprobado,
    );

    // Si es un borrador (isDraft === true), actualizamos el estado temporal en la asignación pero manteniendo el status en ASSIGNED (6)
    if (dto.isDraft) {
      await this.evaluationRepository.saveAssignment({
        ...assignment,
        recommendation: dto.result,
        evaluationReport: dto.observations,
        reportPath: dto.reportPath,
        statusId: AssignmentStatus.ASSIGNED,
      });
      return evaluation;
    }

    // 3.2. Calcular y guardar el plazo de subsanación de 30 días laborables si requiere correcciones
    const needsCorrection =
      dto.result === EvaluationResult.APROBADO_CON_OBSERVACIONES ||
      (reviewType === ReviewType.EXPEDITA &&
        (dto.annex9?.etica.resultado === AspectResult.CON_OBSERVACIONES ||
          dto.annex9?.metodologia.resultado ===
            AspectResult.CON_OBSERVACIONES ||
          dto.annex9?.juridica.resultado === AspectResult.CON_OBSERVACIONES));

    if (needsCorrection) {
      const deadlineDate = this.deadlineService.calculateSubsanacionDeadline(
        new Date(),
      );
      await this.evaluationRepository.saveVersion({
        id: assignment.versionId,
        correctionDeadlineDays: 30,
        correctionDeadlineDate: deadlineDate,
      });
    }

    // 4. Actualizar estado de la asignación
    await this.evaluationRepository.saveAssignment({
      ...assignment,
      actualSubmissionDate: new Date(),
      recommendation: dto.result,
      evaluationReport: dto.observations,
      reportPath: dto.reportPath,
      statusId: AssignmentStatus.COMPLETED,
    });

    // 5. Notificar a secretaría
    const protocol = await this.protocolRepository.findById(
      assignment.version.protocolId,
    );
    if (protocol && assignment.evaluator) {
      // Nota: Aquí se debería obtener la lista de secretarias de la BD o usar el correo institucional del comité
      await this.emailService
        .sendEvaluationSubmitted(
          process.env.COMMITTEE_EMAIL || 'secretaria.ceish@espoch.edu.ec',
          assignment.evaluator.fullName,
          protocol.ceishCode || 'S/C',
        )
        .catch((err) =>
          console.error('Error enviando email de evaluación entregada:', err),
        );
    }

    // 6. Verificar si todas las evaluaciones de la versión han finalizado
    const allAssignments =
      await this.evaluationRepository.findAssignmentsByVersionId(
        assignment.versionId,
      );
    const pending = allAssignments.filter(
      (a) => a.statusId !== +AssignmentStatus.COMPLETED,
    );

    if (pending.length === 0) {
      // Todas las evaluaciones están listas (2/2 o 5/5)
      // El protocolo pasa a 'EVALUADO' (ID: 14)
      await this.protocolRepository.update(assignment.version.protocolId, {
        statusId: 14,
      });
    }

    return evaluation;
  }

  async getProfiles() {
    return this.evaluationRepository.findProfiles();
  }

  async createProfile(dto: CreateEvaluatorProfileDto) {
    return this.evaluationRepository.saveProfile({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      ordenPrioridad: dto.ordenPrioridad || 0,
      isActive: true,
    } as unknown as Partial<EvaluatorProfileOrmEntity>);
  }

  async updateProfile(id: number, dto: UpdateEvaluatorProfileDto) {
    const profile = await this.evaluationRepository.findProfileById(id);
    if (!profile)
      throw new NotFoundException('Perfil de evaluador no encontrado');

    await this.evaluationRepository.updateProfile(
      id,
      dto as unknown as Partial<EvaluatorProfileOrmEntity>,
    );
    return this.evaluationRepository.findProfileById(id);
  }

  async deleteProfile(id: number) {
    const profile = await this.evaluationRepository.findProfileById(id);
    if (!profile)
      throw new NotFoundException('Perfil de evaluador no encontrado');

    await this.evaluationRepository.deleteProfile(id);
    return {
      message: 'Perfil de evaluador eliminado exitosamente (soft-delete)',
    };
  }

  /**
   * Obtener protocolos completados que requieren asignación de pares evaluadores (Secretaría)
   */
  async getProtocolsPendingPeerAssignment() {
    return this.protocolOrmRepository.find({
      where: {
        activeVersion: {
          reception: {
            statusId: 10, // 10 is COMPLETO
          },
        },
        isRiskLevelDesignated: false,
        isTimelineTermsAccepted: true,
        statusId: IsNull(),
      },
      relations: [
        'studyType',
        'principalInvestigator',
        'activeVersion',
        'activeVersion.reception',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Asignar evaluadores a un protocolo (Secretaría)
   * Regla de negocio CEISH: Mínimo 4 evaluadores.
   * - TODOS evalúan el protocolo completo (dictamen ético).
   * - El sistema selecciona ALEATORIAMENTE 2 de ellos para la estratificación de riesgo.
   * - Se pueden asignar más de 4 dependiendo del caso del protocolo.
   */
  async assignPeerEvaluators(
    protocolId: number,
    dto: AssignPeerEvaluatorsDto,
    assignedBy?: number,
  ) {
    const protocol = await this.protocolOrmRepository.findOne({
      where: { id: protocolId },
      relations: ['activeVersion', 'activeVersion.reception'],
    });
    if (!protocol)
      throw new NotFoundException(`Protocolo ${protocolId} no encontrado`);
    if (protocol.receptionStatus !== ReceptionStatus.COMPLETO) {
      throw new BadRequestException(
        'El protocolo debe estar en estado COMPLETO de recepción.',
      );
    }
    if (!protocol.isTimelineTermsAccepted) {
      throw new BadRequestException(
        'El investigador principal debe aceptar el sometimiento a los tiempos y reglamentos del comité antes de asignar evaluadores.',
      );
    }
    if (protocol.isRiskLevelDesignated) {
      throw new BadRequestException(
        'El nivel de riesgo de este protocolo ya fue designado y confirmado.',
      );
    }

    const { evaluatorIds } = dto;

    // Validar mínimo 4 evaluadores
    if (evaluatorIds.length < 4) {
      throw new BadRequestException(
        `Debe asignar un mínimo de 4 evaluadores. Se recibieron ${evaluatorIds.length}.`,
      );
    }

    // Validar que no haya IDs duplicados
    const uniqueIds = new Set(evaluatorIds);
    if (uniqueIds.size !== evaluatorIds.length) {
      throw new BadRequestException(
        'No se permiten evaluadores duplicados en la asignación.',
      );
    }

    // Validar conflicto de interés para todos los evaluadores
    let ipProfile: InvestigatorProfileOrmEntity | undefined;
    if (protocol.principalInvestigatorId) {
      ipProfile =
        (await this.profileRepo.findOne({
          where: { userId: protocol.principalInvestigatorId },
        })) ?? undefined;
    }

    for (const evaluatorId of evaluatorIds) {
      const conflict = await this.conflictService.checkConflict(
        protocolId,
        evaluatorId,
        ipProfile,
      );
      if (conflict.hasConflict && conflict.critical) {
        throw new ConflictException(
          `Conflicto Ético Crítico con el Evaluador ${evaluatorId}: ${conflict.reason}`,
        );
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // PASO 1: Buscar o crear la versión del protocolo (FK requerida por
    //         asignaciones_evaluacion.version_id)
    // ──────────────────────────────────────────────────────────────────
    let version = await this.evaluationRepository.findVersionByProtocolId(
      protocolId,
      1,
    );
    if (!version) {
      version = await this.evaluationRepository.saveVersion({
        protocolId,
        versionNumber: 1,
        submissionDate: protocol.receptionDate || new Date(),
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // PASO 2: Limpiar asignaciones previas si es re-asignación
    // ──────────────────────────────────────────────────────────────────
    await this.peerRiskRepository.delete({ protocolId });

    const existingAssignments =
      await this.evaluationRepository.findAssignmentsByVersionId(version.id);
    for (const existing of existingAssignments) {
      if (
        existing.statusId === +AssignmentStatus.SUGGESTED ||
        existing.statusId === +AssignmentStatus.ASSIGNED
      ) {
        await this.evaluationRepository.deleteAssignment(existing.id);
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // PASO 3: Seleccionar ALEATORIAMENTE 2 evaluadores para riesgo
    // ──────────────────────────────────────────────────────────────────
    const shuffled = [...evaluatorIds].sort(() => Math.random() - 0.5);
    const riskEvaluatorIds = shuffled.slice(0, 2);

    const riskAssignments = riskEvaluatorIds.map((evaluatorId) => {
      const assignment = new PeerRiskAssignmentOrmEntity();
      assignment.protocolId = protocolId;
      assignment.evaluatorId = evaluatorId;
      return assignment;
    });

    await this.peerRiskRepository.save(riskAssignments);

    // ──────────────────────────────────────────────────────────────────
    // PASO 4: Crear asignaciones de evaluación para TODOS los evaluadores
    //         (asignaciones_evaluacion — la tabla que alimenta el flujo
    //          de dictámenes éticos, my-assignments, submit, etc.)
    // ──────────────────────────────────────────────────────────────────
    const reviewType = protocol.reviewType || ReviewType.PLENO;
    const deadline =
      this.deadlineService.calculateEvaluatorDeadline(reviewType);

    const createdAssignments: EvaluationAssignmentOrmEntity[] = [];
    for (const evalId of evaluatorIds) {
      const evaluatorProfileUser = await this.evaluatorProfileUserRepo.findOne({
        where: { userId: evalId, isActive: true },
      });

      const evalAssignment = await this.evaluationRepository.saveAssignment({
        versionId: version.id,
        evaluatorId: evalId,
        profileId: evaluatorProfileUser?.profileId,
        statusId: AssignmentStatus.ASSIGNED,
        deadline,
        assignedByUserId: assignedBy,
      });
      createdAssignments.push(evalAssignment);
    }

    // Enviar notificación por correo a todos los evaluadores asignados
    for (const evaluatorId of evaluatorIds) {
      const evaluator = await this.userRepository.findOne({
        where: { id: evaluatorId },
      });
      if (evaluator) {
        await this.emailService
          .sendEvaluationAssignment(
            evaluator.institutionalEmail,
            evaluator.fullName,
            protocol.ceishCode || `PROTOCOLO-${protocolId}`,
            deadline,
          )
          .catch((e) =>
            console.error(
              `Error enviando notificación al evaluador ${evaluatorId}:`,
              e,
            ),
          );
      }
    }

    // Actualizar el protocolo a estado 'EN EVALUACIÓN' (statusId: 13)
    if (protocol.statusId !== 13) {
      await this.protocolOrmRepository.update(protocolId, { statusId: 13 });
    }

    return {
      message: `${evaluatorIds.length} evaluadores asignados exitosamente al protocolo.`,
      totalEvaluators: evaluatorIds.length,
      riskEvaluators: riskEvaluatorIds,
      allEvaluators: evaluatorIds,
      versionId: version.id,
      evaluationAssignmentIds: createdAssignments.map((a) => a.id),
      deadline,
    };
  }

  /**
   * Obtener asignaciones de riesgo pendientes para el evaluador logueado
   */
  async getMyPendingPeerAssignments(evaluatorId: number) {
    return this.peerRiskRepository.find({
      where: {
        evaluatorId,
        submittedAt: IsNull(),
      },
      relations: [
        'protocol',
        'protocol.studyType',
        'protocol.principalInvestigator',
      ],
      order: { assignedAt: 'DESC' },
    });
  }

  /**
   * Enviar propuesta de nivel de riesgo por parte de un par evaluador
   */
  async submitPeerRiskLevel(
    assignmentId: number,
    evaluatorId: number,
    dto: SubmitPeerRiskDto,
  ) {
    const assignment = await this.peerRiskRepository.findOne({
      where: { id: assignmentId },
      relations: ['protocol'],
    });

    if (!assignment)
      throw new NotFoundException('Asignación de par no encontrada.');
    if (assignment.evaluatorId !== evaluatorId) {
      throw new BadRequestException(
        'No tiene permisos para responder esta asignación.',
      );
    }
    if (assignment.submittedAt) {
      throw new BadRequestException(
        'Esta asignación ya ha sido evaluada y enviada.',
      );
    }

    const riskLevel = await this.riskLevelRepository.findOne({
      where: { id: dto.riskLevelId, isActive: true },
    });
    if (!riskLevel)
      throw new NotFoundException(
        `Nivel de riesgo con ID ${dto.riskLevelId} no encontrado o inactivo.`,
      );

    // Registrar la propuesta del evaluador
    assignment.proposedRiskLevelId = dto.riskLevelId;
    assignment.observations = dto.observations;
    assignment.reportPath = dto.reportPath;
    assignment.submittedAt = new Date();
    await this.peerRiskRepository.save(assignment);

    // Verificar si el otro par de riesgo (seleccionado aleatoriamente) ya respondió
    const peerAssignments = await this.peerRiskRepository.find({
      where: { protocolId: assignment.protocolId },
      relations: ['proposedRiskLevel'],
    });

    const allSubmitted = peerAssignments.every((a) => a.submittedAt !== null);

    if (allSubmitted && peerAssignments.length === 2) {
      // Ambos evaluadores de riesgo (seleccionados aleatoriamente) han respondido
      const [p1, p2] = peerAssignments;

      if (p1.proposedRiskLevelId === p2.proposedRiskLevelId) {
        // Coinciden en el riesgo: consolidamos
        const finalRiskLevelId = p1.proposedRiskLevelId!;

        // Obtener los detalles del nivel de riesgo final seleccionado
        const finalRiskLevel = await this.riskLevelRepository.findOne({
          where: { id: finalRiskLevelId },
        });

        if (finalRiskLevel) {
          // Actualizar el protocolo con el riesgo oficial y marcarlo como designado
          const protocol = assignment.protocol;
          protocol.riskLevelId = finalRiskLevelId;

          // Mapear reviewType según el tipo_revision del nivel de riesgo
          // (tipo_revision es 'EXPEDITA' o 'PLENO' o 'ENSAYO_CLINICO')
          let reviewType: ReviewType = ReviewType.PLENO;
          if (finalRiskLevel.reviewType === 'EXPEDITA') {
            reviewType = ReviewType.EXPEDITA;
          } else if (finalRiskLevel.code === 'ENSAYO_CLINICO') {
            reviewType = ReviewType.ENSAYO_CLINICO;
          }

          protocol.reviewType = reviewType;
          protocol.isRiskLevelDesignated = true; // nivel_riesgo_confirmado = true
          protocol.statusId = 13; // Volver a estado 'EN EVALUACIÓN' al resolver discrepancias

          await this.protocolOrmRepository.save(protocol);

          // Recalcular deadline para TODOS los evaluadores en asignaciones_evaluacion
          const version =
            await this.evaluationRepository.findVersionByProtocolId(
              protocol.id,
              1,
            );
          if (version) {
            const newDeadline =
              this.deadlineService.calculateEvaluatorDeadline(reviewType);
            const assignmentsToUpdate =
              await this.evaluationRepository.findAssignmentsByVersionId(
                version.id,
              );
            for (const a of assignmentsToUpdate) {
              if (a.statusId === +AssignmentStatus.ASSIGNED) {
                a.deadline = newDeadline;
                await this.evaluationRepository.saveAssignment(a);
              }
            }
          }
        }
      } else {
        // Discrepancia: El sistema no debe consolidar automáticamente al mayor,
        // sino pasar el protocolo a un estado de disputa/discrepancia (statusId: 16)
        // y volver a definir el nivel de riesgo por los pares evaluadores designados.
        const protocol = assignment.protocol;
        protocol.statusId = 16; // 16 = DISCREPANCIA_RIESGO
        protocol.isRiskLevelDesignated = false;
        await this.protocolOrmRepository.save(protocol);

        // Reiniciar las asignaciones de riesgo de los dos pares para permitir volver a definir
        for (const pa of peerAssignments) {
          pa.proposedRiskLevelId = undefined;
          pa.observations = undefined;
          pa.reportPath = undefined;
          pa.submittedAt = undefined;
          await this.peerRiskRepository.save(pa);
        }

        return {
          message:
            'Se ha detectado una discrepancia en las propuestas del nivel de riesgo. El protocolo ha pasado a estado de discrepancia de riesgo y las asignaciones han sido reiniciadas para volver a ser definidas tras llegar a un acuerdo en pleno.',
        };
      }
    }

    return { message: 'Propuesta de nivel de riesgo enviada exitosamente.' };
  }

  /**
   * Obtener lista ligera de evaluadores activos para el modal de asignación de pares (Secretaría y Presidenta)
   * Busca los usuarios activos registrados con el rol de 'EVALUADOR' en la base de datos
   */
  async getActiveEvaluators() {
    return this.userRepository.find({
      where: {
        isActive: true,
        roles: {
          code: 'EVALUADOR',
        },
      },
      select: {
        id: true,
        fullName: true,
        institutionalEmail: true,
      },
    });
  }

  /**
   * Obtener información sobre el estado de la conformidad y evaluaciones de un protocolo
   */
  async getSubmitProtocolInfo(protocolId: number, _userId: number) {
    void _userId;
    const protocol = await this.protocolOrmRepository.findOne({
      where: { id: protocolId },
      relations: [
        'studyType',
        'activeVersion',
        'activeVersion.reception',
        'versions',
      ],
    });

    if (!protocol) {
      throw new NotFoundException(`Protocolo ${protocolId} no encontrado`);
    }

    // Buscar si el usuario actual tiene asignaciones de evaluación
    const version =
      await this.evaluationRepository.findVersionByProtocolId(protocolId);
    if (!version) {
      return [];
    }

    const assignments =
      await this.evaluationRepository.findAssignmentsByVersionId(version.id);

    // Buscar asignaciones de pares de riesgo para identificar quién es evaluador de riesgo
    const peerRiskAssignments = await this.peerRiskRepository.find({
      where: { protocolId },
    });
    const riskEvaluatorIds = peerRiskAssignments.map((a) => a.evaluatorId);

    return assignments.map((a) => ({
      id: a.id.toString(),
      protocolId: protocolId.toString(),
      evaluatorId: a.evaluatorId.toString(),
      investigator: a.evaluator?.fullName || 'Evaluador Asignado',
      status:
        a.statusId === +AssignmentStatus.COMPLETED ? 'COMPLETED' : 'PENDING',
      reviewType: protocol.reviewType || 'PLENO',
      isRiskEvaluator: riskEvaluatorIds.includes(a.evaluatorId),
      deadline: a.deadline,
      evaluationDate: a.actualSubmissionDate || null,
    }));
  }

  /**
   * Consultar los detalles relacionales del checklist (Anexo 9) de una evaluación.
   * Enriquece cada ítem con su descripción canónica del catálogo y genera
   * estadísticas de cumplimiento por criterio técnico.
   */
  async getEvaluationChecklistDetails(id: number) {
    // Intentar buscar por ID de evaluación primero
    let evaluation = await this.evaluationRepository.findEvaluationById(id);

    // Si no se encuentra, intentar buscar por ID de asignación
    if (!evaluation) {
      evaluation =
        await this.evaluationRepository.findEvaluationByAssignmentId(id);
    }

    if (!evaluation) {
      throw new NotFoundException(
        `No se encontró ninguna evaluación con ID de evaluación o ID de asignación igual a ${id}.`,
      );
    }

    const details =
      await this.evaluationRepository.findEvaluationDetailsByEvaluationId(
        evaluation.id,
      );

    if (!details || details.length === 0) {
      throw new NotFoundException(
        `No se encontraron detalles de checklist para la evaluación con ID ${evaluation.id}. Solo las revisiones de tipo EXPEDITA persisten el checklist relacional.`,
      );
    }

    // Enriquecer con descripción canónica
    const enrichedItems = details.map((d) => ({
      id: d.id,
      evaluacionId: d.evaluacionId,
      criterioTipo: d.criterioTipo,
      itemCodigo: d.itemCodigo,
      descripcion: ANNEX9_ITEM_CATALOG[d.itemCodigo] ?? `Ítem ${d.itemCodigo}`,
      estado: d.estado,
      observaciones: d.observaciones ?? null,
      creadoEn: d.createdAt,
    }));

    // Estadísticas de cumplimiento por criterio
    const criterios = ['ETICA', 'METODOLOGIA', 'JURIDICA'] as const;
    const stats = criterios.reduce(
      (acc, criterio) => {
        const criterioItems = enrichedItems.filter(
          (i) => (i.criterioTipo as string) === criterio,
        );
        acc[criterio] = {
          total: criterioItems.length,
          cumple: criterioItems.filter((i) => (i.estado as string) === 'C')
            .length,
          noCumple: criterioItems.filter((i) => (i.estado as string) === 'NC')
            .length,
          noAplica: criterioItems.filter((i) => (i.estado as string) === 'NA')
            .length,
        };
        return acc;
      },
      {} as Record<
        string,
        { total: number; cumple: number; noCumple: number; noAplica: number }
      >,
    );

    return {
      evaluacionId: evaluation.id,
      totalItems: enrichedItems.length,
      estadisticas: stats,
      items: enrichedItems,
    };
  }

  /**
   * Fase 2: Obtener URL firmada (30 min) para descargar el PDF del Anexo 9
   * generado automáticamente desde Cloudflare R2.
   */
  async getEvaluationDocumentUrl(id: number): Promise<{
    evaluacionId: number;
    downloadUrl: string;
    expiresInSeconds: number;
    r2Key: string;
  }> {
    // Intentar buscar por ID de evaluación primero
    let evaluation = await this.evaluationRepository.findEvaluationById(id);

    // Si no se encuentra, intentar buscar por ID de asignación
    if (!evaluation) {
      evaluation =
        await this.evaluationRepository.findEvaluationByAssignmentId(id);
    }

    if (!evaluation) {
      throw new NotFoundException(
        `No se encontró ninguna evaluación con ID de evaluación o ID de asignación igual a ${id}.`,
      );
    }

    if (!evaluation.rutaPdf) {
      throw new NotFoundException(
        `No existe un PDF del Anexo 9 generado para la evaluación #${evaluation.id}. ` +
          `El documento se genera automáticamente al registrar una evaluación EXPEDITA. ` +
          `Verifique que la evaluación sea de tipo Revisión Expedita.`,
      );
    }

    const SIGNED_URL_EXPIRY = 1800; // 30 minutos
    const downloadUrl = await this.storageService.getDownloadUrl(
      evaluation.rutaPdf,
      SIGNED_URL_EXPIRY,
    );

    return {
      evaluacionId: evaluation.id,
      downloadUrl,
      expiresInSeconds: SIGNED_URL_EXPIRY,
      r2Key: evaluation.rutaPdf,
    };
  }

  /**
   * Fase 2: Obtener URL firmada (30 min) para descargar el DOCX del Anexo 9
   * generado automáticamente desde Cloudflare R2.
   */
  async getEvaluationDocxUrl(id: number): Promise<{
    evaluacionId: number;
    downloadUrl: string;
    expiresInSeconds: number;
    r2Key: string;
    filename: string;
  }> {
    // Intentar buscar por ID de evaluación primero
    let evaluation = await this.evaluationRepository.findEvaluationById(id);

    // Si no se encuentra, intentar buscar por ID de asignación
    if (!evaluation) {
      evaluation =
        await this.evaluationRepository.findEvaluationByAssignmentId(id);
    }

    if (!evaluation) {
      throw new NotFoundException(
        `No se encontró ninguna evaluación con ID de evaluación o ID de asignación igual a ${id}.`,
      );
    }

    if (!evaluation.rutaDocx) {
      throw new NotFoundException(
        `No existe un DOCX del Anexo 9 generado para la evaluación #${evaluation.id}. ` +
          `El documento Word se genera automáticamente al registrar una evaluación EXPEDITA. ` +
          `Verifique que la evaluación sea de tipo Revisión Expedita.`,
      );
    }

    const SIGNED_URL_EXPIRY = 1800; // 30 minutos
    const downloadUrl = await this.storageService.getDownloadUrl(
      evaluation.rutaDocx,
      SIGNED_URL_EXPIRY,
    );

    // Nombre sugerido de archivo para la descarga
    const filename = `Anexo9_Evaluacion_${evaluation.id}.docx`;

    return {
      evaluacionId: evaluation.id,
      downloadUrl,
      expiresInSeconds: SIGNED_URL_EXPIRY,
      r2Key: evaluation.rutaDocx,
      filename,
    };
  }

  async getObservationsForInvestigator(
    protocolId: number,
    userId: number,
    userPermissions: string[],
  ) {
    const protocol = await this.protocolOrmRepository.findOne({
      where: { id: protocolId },
      relations: ['investigators'],
    });
    if (!protocol) throw new NotFoundException('Protocolo no encontrado');

    const isOwner = protocol.principalInvestigatorId === userId;
    const isCoInvestigator = protocol.investigators?.some(
      (inv) => inv.userId === userId,
    );
    const hasOfficialPermission = userPermissions?.some((p) =>
      [
        Permission.EVALUACION_INFORMES,
        Permission.RESOLUCION_CREAR,
        Permission.RESOLUCION_FIRMAR,
        Permission.RECEPCION_VIEW,
      ].includes(p),
    );

    if (!isOwner && !isCoInvestigator && !hasOfficialPermission) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a las observaciones de este protocolo.',
      );
    }

    const version = await this.evaluationRepository.findVersionByProtocolId(
      protocolId,
      protocol.currentVersion,
    );
    if (!version) {
      return {
        protocolId,
        observations: [],
        message: 'No hay evaluaciones registradas para este protocolo.',
      };
    }

    const assignments =
      await this.evaluationRepository.findAssignmentsByVersionId(version.id);
    const completedAssignments = assignments.filter(
      (a) => a.statusId === +AssignmentStatus.COMPLETED,
    );

    const observations = [];
    for (const assignment of completedAssignments) {
      const evaluation =
        await this.evaluationRepository.findEvaluationByAssignmentId(
          assignment.id,
        );
      if (evaluation) {
        observations.push({
          evaluatorProfile: assignment.profile?.name || 'Evaluador',
          result: evaluation.result,
          reportPath: evaluation.reportPath || assignment.reportPath,
        });
      }
    }

    return {
      protocolId,
      versionNumber: version.versionNumber,
      observations,
    };
  }
}
