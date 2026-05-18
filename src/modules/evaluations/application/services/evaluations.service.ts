import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { AssignEvaluatorsDto } from '../dtos/assign-evaluator.dto';
import { SubmitEvaluationDto } from '../dtos/submit-evaluation.dto';
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

@Injectable()
export class EvaluationsService {
  constructor(
    @Inject(IEvaluationRepository)
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly emailService: IEmailServicePort,
    private readonly conflictService: ConflictOfInterestService,
  ) {}

  /**
   * HU-004: Dashboard de carga por evaluador y protocolos pendientes
   */
  async getEvaluatorsDashboard(profileId?: number) {
    const [evaluators, [protocols]] = await Promise.all([
      this.evaluationRepository.findEvaluatorsWithWorkload(profileId),
      this.protocolRepository.findAll({
        receptionStatus: ReceptionStatus.COMPLETO,
      }),
    ]);

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
   * HU-004: Sugerir evaluadores (Presidenta)
   * Aplica la Fase 2: Motor de Asignación por Riesgo (2 vs 5)
   */
  async suggestEvaluators(dto: AssignEvaluatorsDto, suggestedBy: number) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol)
      throw new NotFoundException(`Protocol ${dto.protocolId} not found`);

    const reviewType = protocol.reviewType || ReviewType.PLENO;
    const requiredCount = reviewType === ReviewType.EXPEDITA ? 2 : 5;

    // 1. Validar cantidad exacta (Fase 2)
    if (dto.evaluators.length !== requiredCount) {
      throw new BadRequestException(
        `Para una revisión de tipo ${reviewType} se requieren exactamente ${requiredCount} evaluadores.`,
      );
    }

    // 2. Validar perfiles únicos para Revisión en Pleno (PET 5.1)
    if (reviewType === ReviewType.PLENO) {
      const profiles = dto.evaluators.map((e) => e.profileId);
      const uniqueProfiles = new Set(profiles);
      if (uniqueProfiles.size !== 5) {
        throw new BadRequestException(
          'Para una revisión en PLENO, debe asignar exactamente un evaluador por cada perfil obligatorio: Jurídico, Salud, Metodología, Bioética y Sociedad Civil.',
        );
      }
    }

    // 3. Validar unicidad de evaluadores
    const evaluatorIds = dto.evaluators.map((e) => e.evaluatorId);
    const uniqueIds = new Set(evaluatorIds);
    if (uniqueIds.size !== evaluatorIds.length) {
      throw new BadRequestException(
        'No puede asignar al mismo evaluador más de una vez.',
      );
    }

    let version = await this.evaluationRepository.findVersionByProtocolId(
      dto.protocolId,
      1,
    );
    if (!version) {
      version = await this.evaluationRepository.saveVersion({
        protocolId: dto.protocolId,
        versionNumber: 1,
        submissionDate: protocol.receptionDate || new Date(),
      });
    }

    // 3. Limpiar sugerencias previas para esta versión si existen (Re-sugerencia)
    const existing = await this.evaluationRepository.findAssignmentsByVersionId(
      version.id,
    );
    const pendingCount = existing.filter(
      (a) => a.statusId === AssignmentStatus.SUGGESTED,
    ).length;
    if (pendingCount > 0) {
      // Podríamos borrarlos o marcarlos como obsoletos. Por ahora los borramos para permitir limpia re-asignación.
      for (const a of existing) {
        if (a.statusId === AssignmentStatus.SUGGESTED) {
          await this.evaluationRepository.deleteAssignment(a.id);
        }
      }
    }

    const assignments: EvaluationAssignmentOrmEntity[] = [];
    for (const evalDto of dto.evaluators) {
      // 4. Validar conflictos de interés (Fase 1)
      const conflict = await this.conflictService.checkConflict(
        dto.protocolId,
        evalDto.evaluatorId,
      );
      if (conflict.hasConflict && conflict.critical) {
        throw new ConflictException(
          `Conflicto Ético con Evaluador ${evalDto.evaluatorId}: ${conflict.reason}`,
        );
      }

      const assignment = await this.evaluationRepository.saveAssignment({
        versionId: version.id,
        evaluatorId: evalDto.evaluatorId,
        profileId: evalDto.profileId,
        modalityId: evalDto.modalityId,
        suggestedByUserId: suggestedBy,
        suggestedAt: new Date(),
        statusId: AssignmentStatus.SUGGESTED,
      });
      assignments.push(assignment);
    }

    return assignments;
  }

  /**
   * HU-004: Confirmar asignaciones (Secretaria)
   */
  async confirmAssignments(assignmentIds: number[], confirmedBy: number) {
    const results: EvaluationAssignmentOrmEntity[] = [];
    for (const id of assignmentIds) {
      const assignment = await this.evaluationRepository.findAssignmentById(id);
      if (!assignment) continue;

      if (assignment.statusId !== AssignmentStatus.SUGGESTED) {
        throw new BadRequestException(
          `La asignación ${id} ya no está en estado SUGERIDO.`,
        );
      }

      const protocol = await this.protocolRepository.findById(
        assignment.version.protocolId,
      );
      const reviewType = protocol?.reviewType || ReviewType.PLENO;

      const deadline =
        this.deadlineService.calculateEvaluatorDeadline(reviewType);

      assignment.statusId = AssignmentStatus.ASSIGNED;
      assignment.confirmedByUserId = confirmedBy;
      assignment.confirmedAt = new Date();
      assignment.deadline = deadline;

      const saved = await this.evaluationRepository.saveAssignment(assignment);
      results.push(saved);

      // HU-004: Disparar notificación por email al evaluador
      if (saved.evaluator && protocol) {
        await this.emailService
          .sendEvaluationAssignment(
            saved.evaluator.institutionalEmail,
            saved.evaluator.fullName,
            protocol.ceishCode || 'S/C',
            deadline,
          )
          .catch((err) =>
            console.error('Error enviando email de asignación:', err),
          );
      }

      // Al confirmar la primera asignación, el protocolo pasa a 'EN EVALUACIÓN' (ID: 2)
      if (protocol && protocol.statusId !== 2) {
        await this.protocolRepository.update(protocol.id, { statusId: 2 });
      }
    }
    return results;
  }

  /**
   * Obtener todas las sugerencias pendientes de confirmación (Secretaria)
   */
  async getPendingSuggestions() {
    return this.evaluationRepository.findPendingSuggestions();
  }

  /**
   * Rechazar una sugerencia (Secretaria)
   */
  async rejectSuggestion(assignmentId: number) {
    const assignment =
      await this.evaluationRepository.findAssignmentById(assignmentId);
    if (!assignment)
      throw new NotFoundException(`Asignación ${assignmentId} no encontrada`);

    if (assignment.statusId !== AssignmentStatus.SUGGESTED) {
      throw new BadRequestException(
        'Solo se pueden rechazar asignaciones en estado SUGERIDO.',
      );
    }

    await this.evaluationRepository.deleteAssignment(assignmentId);
    return { message: `Sugerencia ${assignmentId} rechazada exitosamente.` };
  }

  /**
   * HU-005: Obtener asignaciones con alertas de plazo y sugerencia de Anexo
   */
  async getMyAssignments(evaluatorId: number) {
    const assignments =
      await this.evaluationRepository.findAssignmentsByEvaluatorId(evaluatorId);
    const now = new Date();

    return assignments
      .filter((a) => a.statusId === AssignmentStatus.ASSIGNED)
      .map((a) => {
        const deadline = a.deadline ? new Date(a.deadline) : null;
        let diffDays: number | null = null;
        let isUrgent = false;

        if (deadline) {
          const diffTime = deadline.getTime() - now.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          isUrgent = diffDays !== null && diffDays <= 2 && diffDays >= 0;
        }

        let annexSuggestion = 'Anexo 10 (Revisión Plena)';
        const reviewType = a.version?.protocol?.reviewType;

        if (reviewType === ReviewType.EXPEDITA)
          annexSuggestion = 'Anexo 9 (Revisión Expedita)';
        if (reviewType === ReviewType.ENSAYO_CLINICO)
          annexSuggestion = 'Anexo 11 (Ensayos Clínicos)';

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
    if (assignment.statusId === AssignmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Esta evaluación ya ha sido enviada anteriormente.',
      );
    }

    const reviewType =
      assignment.version?.protocol?.reviewType || ReviewType.PLENO;
    let ethicalAspects: any = {};
    let methodologicalAspects: any = {};
    let legalAspects: any = {};

    // 1. Validar y extraer datos según el tipo de revisión (Digitalización Refactorizada)
    switch (reviewType) {
      case ReviewType.EXPEDITA:
        if (!dto.annex9)
          throw new BadRequestException(
            'Debe completar el Anexo 9 para revisiones expeditas.',
          );
        ethicalAspects = {
          resultado: dto.annex9.eticaResult,
          plazo: dto.annex9.eticaPlazo,
        };
        methodologicalAspects = {
          resultado: dto.annex9.metodologiaResult,
          plazo: dto.annex9.metodologiaPlazo,
        };
        legalAspects = {
          resultado: dto.annex9.juridicaResult,
          plazo: dto.annex9.juridicaPlazo,
        };
        break;

      case ReviewType.PLENO:
        if (!dto.annex10)
          throw new BadRequestException(
            'Debe completar el Anexo 10 para revisiones en pleno.',
          );
        ethicalAspects = {
          resultado: dto.annex10.resultado,
          condiciones: dto.annex10.condicionesDescripcion,
        };
        break;

      case ReviewType.ENSAYO_CLINICO:
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

    // 2. Validación de Informe Consolidado (Obligatorio si no es APROBADO)
    const isApproved = dto.result === 'APROBADO';
    if (!isApproved && !dto.reportPath) {
      throw new BadRequestException(
        'Debe subir el Documento Consolidado (PDF) para sustentar el dictamen condicionado o no aprobado.',
      );
    }

    // 3. Guardar evaluación en BD (JSONB fields)
    const evaluation = await this.evaluationRepository.saveEvaluation({
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

    // 4. Actualizar estado de la asignación
    await this.evaluationRepository.saveAssignment({
      ...assignment,
      actualSubmissionDate: new Date(),
      recommendation: dto.result,
      evaluationReport: dto.observations,
      statusId: AssignmentStatus.COMPLETED,
    });

    // 5. Notificar a secretaría
    const protocol = await this.protocolRepository.findById(
      assignment.version.protocolId,
    );
    if (protocol && assignment.evaluator) {
      // Nota: Aquí se debería obtener la lista de secretarias de la BD
      await this.emailService
        .sendEvaluationSubmitted(
          'secretaria.ceish@espoch.edu.ec',
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
      (a) => a.statusId !== AssignmentStatus.COMPLETED,
    );

    if (pending.length === 0) {
      // Todas las evaluaciones están listas (2/2 o 5/5)
      // El protocolo pasa a 'EVALUADO' (Podría ser ID 3 o 4 según tu catálogo de estados)
      await this.protocolRepository.update(assignment.version.protocolId, {
        statusId: 3,
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
    } as any);
  }

  async updateProfile(id: number, dto: UpdateEvaluatorProfileDto) {
    const profile = await this.evaluationRepository.findProfileById(id);
    if (!profile)
      throw new NotFoundException('Perfil de evaluador no encontrado');

    await this.evaluationRepository.updateProfile(id, dto as any);
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
}
