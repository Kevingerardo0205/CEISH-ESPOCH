import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
import { PeerRiskAssignmentOrmEntity } from '../../infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { AssignPeerEvaluatorsDto } from '../dtos/assign-peer-evaluators.dto';
import { SubmitPeerRiskDto } from '../dtos/submit-peer-risk.dto';

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
  ) {}

  /**
   * HU-004: Dashboard de carga por evaluador y protocolos pendientes
   */
  async getEvaluatorsDashboard(profileId?: number) {
    const evaluators =
      await this.evaluationRepository.findEvaluatorsWithWorkload(profileId);

    // Solo se listan en el dashboard de la Presidenta si la recepción está COMPLETA y el nivel de riesgo ha sido consolidado
    const protocols = await this.protocolOrmRepository.find({
      where: {
        receptionStatus: ReceptionStatus.COMPLETO,
        isRiskLevelDesignated: true,
      },
      relations: ['studyType'],
      order: { receptionDate: 'DESC' },
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

  /**
   * Obtener protocolos completados que requieren asignación de pares evaluadores (Secretaría)
   */
  async getProtocolsPendingPeerAssignment() {
    return this.protocolOrmRepository.find({
      where: {
        receptionStatus: ReceptionStatus.COMPLETO,
        isRiskLevelDesignated: false,
        isTimelineTermsAccepted: true,
      },
      relations: ['studyType', 'principalInvestigatorRecord'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Asignar exactamente 2 evaluadores pares a un protocolo (Secretaría)
   */
  async assignPeerEvaluators(protocolId: number, dto: AssignPeerEvaluatorsDto) {
    const protocol = await this.protocolOrmRepository.findOne({
      where: { id: protocolId },
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
    if (evaluatorIds.length !== 2) {
      throw new BadRequestException(
        'Debe asignar exactamente 2 evaluadores pares.',
      );
    }
    if (evaluatorIds[0] === evaluatorIds[1]) {
      throw new BadRequestException(
        'Los dos evaluadores pares deben ser distintos.',
      );
    }

    // Validar conflicto de interés para ambos evaluadores (Fase 1)
    for (const evaluatorId of evaluatorIds) {
      const conflict = await this.conflictService.checkConflict(
        protocolId,
        evaluatorId,
      );
      if (conflict.hasConflict && conflict.critical) {
        throw new ConflictException(
          `Conflicto Ético Crítico con el Evaluador ${evaluatorId}: ${conflict.reason}`,
        );
      }
    }

    // Eliminar asignaciones previas si existen (por si es una re-asignación)
    await this.peerRiskRepository.delete({ protocolId });

    // Guardar las nuevas asignaciones
    const assignments = evaluatorIds.map((evaluatorId) => {
      const assignment = new PeerRiskAssignmentOrmEntity();
      assignment.protocolId = protocolId;
      assignment.evaluatorId = evaluatorId;
      return assignment;
    });

    await this.peerRiskRepository.save(assignments);

    return { message: 'Pares evaluadores asignados exitosamente.' };
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
        'protocol.principalInvestigatorRecord',
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
    assignment.submittedAt = new Date();
    await this.peerRiskRepository.save(assignment);

    // Verificar si el otro par ya respondió
    const peerAssignments = await this.peerRiskRepository.find({
      where: { protocolId: assignment.protocolId },
      relations: ['proposedRiskLevel'],
    });

    const allSubmitted = peerAssignments.every((a) => a.submittedAt !== null);

    if (allSubmitted && peerAssignments.length === 2) {
      // Ambos han respondido, realizamos la consolidación
      const [p1, p2] = peerAssignments;

      let finalRiskLevelId: number;

      if (p1.proposedRiskLevelId === p2.proposedRiskLevelId) {
        // Coinciden en el riesgo
        finalRiskLevelId = p1.proposedRiskLevelId!;
      } else {
        // Discrepancia: Seleccionar el de mayor nivel de riesgo
        // Ordenamos por nivel de gravedad (usando ranking de IDs basados en los códigos conocidos)
        // 8 (ENSAYO_CLINICO) > 7 (RIESGO_MAYOR) > 6 (RIESGO_MODERADO) > 5 (RIESGO_MINIMO) > 4 (SIN_RIESGO)
        const rank = (id: number) => {
          if (id === 8) return 5;
          if (id === 7) return 4;
          if (id === 6) return 3;
          if (id === 5) return 2;
          if (id === 4) return 1;
          return 0;
        };

        const r1 = rank(p1.proposedRiskLevelId!);
        const r2 = rank(p2.proposedRiskLevelId!);

        finalRiskLevelId =
          r1 >= r2 ? p1.proposedRiskLevelId! : p2.proposedRiskLevelId!;
      }

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

        await this.protocolOrmRepository.save(protocol);
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
}
