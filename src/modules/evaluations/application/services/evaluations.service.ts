import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { AssignEvaluatorsDto } from '../dtos/assign-evaluator.dto';
import { SubmitEvaluationDto } from '../dtos/submit-evaluation.dto';
import { CreateEvaluatorProfileDto, UpdateEvaluatorProfileDto } from '../dtos/evaluator-profile-crud.dto';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
    private readonly deadlineService: ProtocolDeadlineService,
  ) {}

  /**
   * Dashboard de carga por evaluador
   */
  async getEvaluatorsDashboard(profileId?: number) {
    const evaluators = await this.evaluationRepository.findEvaluatorsWithWorkload(profileId);
    return evaluators.sort((a, b) => a.currentLoad - b.currentLoad);
  }

  /**
   * HU-005: Obtener asignaciones con alertas de plazo y sugerencia de Anexo
   */
  async getMyAssignments(evaluatorId: number) {
    const assignments = await this.evaluationRepository.findAssignmentsByEvaluatorId(evaluatorId);
    const now = new Date();
    
    return assignments.map(a => {
      const deadline = new Date(a.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // PET 4.2 Formulario según tipo
      let annexSuggestion = 'Anexo 10 (Revisión Plena)';
      const reviewType = a.version?.protocol?.reviewType;
      
      if (reviewType === ReviewType.EXPEDITA) annexSuggestion = 'Anexo 9 (Revisión Expedita)';
      if (reviewType === ReviewType.ENSAYO_CLINICO) annexSuggestion = 'Anexo 11 (Ensayos Clínicos)';

      return {
        ...a,
        isUrgent: diffDays <= 2 && diffDays >= 0,
        daysRemaining: diffDays,
        annexToUse: annexSuggestion
      };
    });
  }

  /**
   * Asignar evaluadores a un protocolo (HU-004)
   */
  async assignEvaluators(dto: AssignEvaluatorsDto, assignedBy: number) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol) throw new NotFoundException(`Protocol ${dto.protocolId} not found`);

    let version = await this.evaluationRepository.findVersionByProtocolId(dto.protocolId, 1);
    if (!version) {
      version = await this.evaluationRepository.saveVersion({
        protocolId: dto.protocolId,
        versionNumber: 1,
        submissionDate: protocol.receptionDate || new Date(),
      });
    }

    const reviewType = protocol.reviewType || ReviewType.PLENO;
    const deadline = this.deadlineService.calculateEvaluatorDeadline(reviewType);

    const assignments: EvaluationAssignmentOrmEntity[] = [];
    for (const evalDto of dto.evaluators) {
      const assignment = await this.evaluationRepository.saveAssignment({
        versionId: version.id,
        evaluatorId: evalDto.evaluatorId,
        profileId: evalDto.profileId,
        modalityId: evalDto.modalityId,
        assignedByUserId: assignedBy,
        deadline: deadline,
        assignedAt: new Date(),
        statusId: 1, // ASIGNADO
      });
      assignments.push(assignment);
    }

    return assignments;
  }

  /**
   * HU-005: Registrar evaluación, recomendación y adjunto
   */
  async submitEvaluation(dto: SubmitEvaluationDto, evaluatorId: number) {
    const assignment = await this.evaluationRepository.findAssignmentById(dto.assignmentId);
    
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.evaluatorId !== evaluatorId) {
      throw new BadRequestException('No tiene permisos para evaluar esta asignación.');
    }

    // 1. Guardar detalle de evaluación (HU-005: Incluye ruta de PDF)
    const evaluation = await this.evaluationRepository.saveEvaluation({
      assignmentId: dto.assignmentId,
      ethicalAspects: dto.ethicalAspects,
      methodologicalAspects: dto.methodologicalAspects,
      legalAspects: dto.legalAspects,
      result: dto.result,
      observations: dto.observations,
      reportPath: dto.reportPath,
      evaluatedByUserId: evaluatorId,
    });

    // 2. Actualizar la asignación (PET 4.2.5: Notificar a secretaria cambiando estado)
    await this.evaluationRepository.saveAssignment({
      ...assignment,
      actualSubmissionDate: new Date(),
      recommendation: dto.result,
      evaluationReport: dto.observations, // Resumen de texto
      statusId: 2, // EVALUADO (Notifica visualmente a secretaria)
    });

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
    if (!profile) throw new NotFoundException('Perfil de evaluador no encontrado');

    await this.evaluationRepository.updateProfile(id, dto as any);
    return this.evaluationRepository.findProfileById(id);
  }

  async deleteProfile(id: number) {
    const profile = await this.evaluationRepository.findProfileById(id);
    if (!profile) throw new NotFoundException('Perfil de evaluador no encontrado');

    await this.evaluationRepository.deleteProfile(id);
    return { message: 'Perfil de evaluador eliminado exitosamente (soft-delete)' };
  }
}
