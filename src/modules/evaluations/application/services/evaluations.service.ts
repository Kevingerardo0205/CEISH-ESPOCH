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
import {
  SubmitEvaluationDto,
  EvaluationResult,
} from '../dtos/submit-evaluation.dto';
import { AspectResult } from '../dtos/annexes/evaluation-forms.dto';
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

        // Criterios Técnicos PET: Consistencia de Resultados
        const hasObservations =
          dto.annex9.eticaResult === AspectResult.CON_OBSERVACIONES ||
          dto.annex9.metodologiaResult === AspectResult.CON_OBSERVACIONES ||
          dto.annex9.juridicaResult === AspectResult.CON_OBSERVACIONES;

        const hasNoAprobado =
          dto.annex9.eticaResult === AspectResult.NO_APROBADO ||
          dto.annex9.metodologiaResult === AspectResult.NO_APROBADO ||
          dto.annex9.juridicaResult === AspectResult.NO_APROBADO;

        if (hasNoAprobado && dto.result === EvaluationResult.APROBADO) {
          throw new BadRequestException(
            'El dictamen global no puede ser APROBADO si algún componente tiene resultado NO APROBADO.',
          );
        }

        if (hasObservations && dto.result === EvaluationResult.APROBADO) {
          throw new BadRequestException(
            'El dictamen global no puede ser APROBADO si algún componente tiene observaciones. Debe ser APROBADO_CON_OBSERVACIONES o PENDIENTE_SUBSANACION.',
          );
        }

        // Validación de observaciones obligatorias si un aspecto está CON_OBSERVACIONES
        if (
          dto.annex9.eticaResult === AspectResult.CON_OBSERVACIONES &&
          (!dto.annex9.eticaObservaciones ||
            !dto.annex9.eticaObservaciones.trim())
        ) {
          throw new BadRequestException(
            'Debe detallar las observaciones para la evaluación ética.',
          );
        }

        if (
          dto.annex9.metodologiaResult === AspectResult.CON_OBSERVACIONES &&
          (!dto.annex9.metodologiaObservaciones ||
            !dto.annex9.metodologiaObservaciones.trim())
        ) {
          throw new BadRequestException(
            'Debe detallar las observaciones para la evaluación metodológica.',
          );
        }

        if (
          dto.annex9.juridicaResult === AspectResult.CON_OBSERVACIONES &&
          (!dto.annex9.juridicaObservaciones ||
            !dto.annex9.juridicaObservaciones.trim())
        ) {
          throw new BadRequestException(
            'Debe detallar las observaciones para la evaluación jurídica.',
          );
        }

        ethicalAspects = {
          resultado: dto.annex9.eticaResult,
          plazo: dto.annex9.eticaPlazo,
          observaciones: dto.annex9.eticaObservaciones,
        };
        methodologicalAspects = {
          resultado: dto.annex9.metodologiaResult,
          plazo: dto.annex9.metodologiaPlazo,
          observaciones: dto.annex9.metodologiaObservaciones,
        };
        legalAspects = {
          resultado: dto.annex9.juridicaResult,
          plazo: dto.annex9.juridicaPlazo,
          observaciones: dto.annex9.juridicaObservaciones,
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
      (a) => a.statusId !== AssignmentStatus.COMPLETED,
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
        existing.statusId === AssignmentStatus.SUGGESTED ||
        existing.statusId === AssignmentStatus.ASSIGNED
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
          const version = await this.evaluationRepository.findVersionByProtocolId(
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
              if (a.statusId === AssignmentStatus.ASSIGNED) {
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
  async getSubmitProtocolInfo(protocolId: number, userId: number) {
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
        a.statusId === AssignmentStatus.COMPLETED ? 'COMPLETED' : 'PENDING',
      reviewType: protocol.reviewType || 'PLENO',
      isRiskEvaluator: riskEvaluatorIds.includes(a.evaluatorId),
      deadline: a.deadline,
      evaluationDate: a.actualSubmissionDate || null,
    }));
  }
}
