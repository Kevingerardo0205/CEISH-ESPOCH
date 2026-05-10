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

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly emailService: IEmailServicePort,
  ) {}

  /**
   * HU-004: Dashboard de carga por evaluador
   */
  async getEvaluatorsDashboard(profileId?: number) {
    const evaluators =
      await this.evaluationRepository.findEvaluatorsWithWorkload(profileId);
    return evaluators.sort((a, b) => a.currentLoad - b.currentLoad);
  }

  /**
   * HU-004: Sugerir evaluadores (Presidenta)
   */
  async suggestEvaluators(dto: AssignEvaluatorsDto, suggestedBy: number) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol)
      throw new NotFoundException(`Protocol ${dto.protocolId} not found`);

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

    const assignments: EvaluationAssignmentOrmEntity[] = [];
    for (const evalDto of dto.evaluators) {
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

    const annexData = dto.annex9 || dto.annex10 || dto.annex11;
    if (!annexData) {
      throw new BadRequestException(
        'Debe proporcionar los datos del Anexo de evaluación.',
      );
    }

    const evaluation = await this.evaluationRepository.saveEvaluation({
      assignmentId: dto.assignmentId,
      ethicalAspects: (annexData as any).etica || annexData,
      methodologicalAspects: (annexData as any).metodologia,
      legalAspects: (annexData as any).legal,
      result: dto.result,
      observations: dto.observations,
      reportPath: dto.reportPath,
      evaluatedByUserId: evaluatorId,
    });

    await this.evaluationRepository.saveAssignment({
      ...assignment,
      actualSubmissionDate: new Date(),
      recommendation: dto.result,
      evaluationReport: dto.observations,
      statusId: AssignmentStatus.COMPLETED,
    });

    // HU-005: Notificar a secretaria enviando email
    // Usamos el email sugerido en los logs previos admin@espoch.edu.ec o similar si se tiene parametrizado
    const protocol = await this.protocolRepository.findById(
      assignment.version.protocolId,
    );
    if (protocol && assignment.evaluator) {
      await this.emailService
        .sendEvaluationSubmitted(
          'admin@ceish.com', // En producción esto vendría de un Config o de los usuarios con rol secretaria
          assignment.evaluator.fullName,
          protocol.ceishCode || 'S/C',
        )
        .catch((err) =>
          console.error('Error enviando email de evaluación entregada:', err),
        );
    }

    const allAssignments =
      await this.evaluationRepository.findAssignmentsByVersionId(
        assignment.versionId,
      );
    const pending = allAssignments.filter(
      (a) => a.statusId !== AssignmentStatus.COMPLETED,
    );

    if (pending.length === 0) {
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
