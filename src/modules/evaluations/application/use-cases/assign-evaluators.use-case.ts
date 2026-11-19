import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import {
  AssignableReviewType,
  EvaluatorCandidateInput,
  EvaluatorCompositionError,
  QuotaEvaluatorValidatorService,
} from '../../domain/services/quota-evaluator-validator.service';
import {
  EvaluatorProfile,
  toEvaluatorProfile,
} from '../../../../shared/enums/evaluator-enums';
import {
  AssignmentPreconditionFailure,
  IEvaluationRepository,
} from '../../domain/ports/evaluation.repository.port';
import {
  BusinessDayCalculator,
  toCalendarDateString,
} from '../../../../shared/services/deadline-calculator.service';
import {
  SP_PLAZO_REVISION_OFICIO,
  SystemParamsService,
} from '../../../sistema/application/services/system-params.service';

/** Comando interno de asignación por la PRESIDENTE (TSK-002-N52). */
export interface AssignEvaluatorsCommand {
  protocolId: number | string;
  versionId?: number;
  reviewType: AssignableReviewType;
  evaluators: EvaluatorCandidateInput[];
  assignedByUserId: number;
}

export type AssignEvaluatorsRepository = Pick<
  IEvaluationRepository,
  | 'findEvaluatorCandidates'
  | 'createAssignmentsForActiveVersion'
  | 'findEnrichmentInfo'
>;

export interface IEventEmitter {
  emit(event: string, payload: Record<string, unknown>): void;
}

const PRECONDITION_MESSAGES: Record<AssignmentPreconditionFailure, string> = {
  PROTOCOL_NOT_FOUND: 'El protocolo no existe.',
  NO_ACTIVE_VERSION: 'El protocolo no tiene una versión activa para asignar.',
  VERSION_MISMATCH:
    'La versión indicada no es la versión activa del protocolo.',
  RECEPTION_NOT_COMPLETE:
    'La recepción de la versión activa del protocolo no está completa.',
  TERMS_NOT_ACCEPTED:
    'El investigador aún no ha aceptado el sometimiento a los tiempos del CEISH.',
  ALREADY_ASSIGNED:
    'La versión activa del protocolo ya tiene evaluadores asignados.',
};

export class AssignEvaluatorsUseCase {
  private readonly logger = new Logger(AssignEvaluatorsUseCase.name);

  constructor(
    private readonly evaluationRepository: AssignEvaluatorsRepository,
    private readonly eventEmitter: IEventEmitter,
    private readonly systemParams: Pick<SystemParamsService, 'get'>,
  ) {}

  /**
   * Asignación de evaluadores pares por la PRESIDENTE
   * [RF-12.1 a–e, RF-12.2a, RF-12.REV, RF-12.6, RF-12.7 c.1].
   */
  public async execute(
    command: AssignEvaluatorsCommand,
  ): Promise<EvaluationAssignmentEntity[]> {
    const protocolId = this.toPositiveInt(
      command.protocolId,
      'El ID del protocolo debe ser un entero positivo',
    );

    // 1. Composición por tipo de revisión (dominio puro) → 400
    try {
      QuotaEvaluatorValidatorService.validateComposition(
        command.reviewType,
        command.evaluators,
      );
    } catch (err: unknown) {
      if (err instanceof EvaluatorCompositionError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    // 2. Cada evaluador: activo, con rol EVALUADOR y con el perfil enviado → perfil_id del catálogo
    const items = command.evaluators.map((e) => ({
      evaluatorId: this.toPositiveInt(
        e.evaluatorId,
        'El ID del evaluador debe ser un entero positivo',
      ),
      profile: e.profile,
    }));
    const candidates = await this.evaluationRepository.findEvaluatorCandidates(
      items.map((i) => i.evaluatorId),
    );
    const candidateById = new Map(candidates.map((c) => [c.userId, c]));

    const resolved = items.map((item) => {
      const candidate = candidateById.get(item.evaluatorId);
      if (!candidate) {
        throw new BadRequestException(
          `El evaluador con ID ${item.evaluatorId} no existe.`,
        );
      }
      if (!candidate.isActive) {
        throw new BadRequestException(
          `El evaluador con ID ${item.evaluatorId} no está activo.`,
        );
      }
      if (!candidate.hasEvaluatorRole) {
        throw new BadRequestException(
          `El usuario con ID ${item.evaluatorId} no tiene el rol EVALUADOR activo.`,
        );
      }
      const catalogProfile = candidate.profiles.find(
        (p) => toEvaluatorProfile(p.profileName) === item.profile,
      );
      if (!catalogProfile) {
        throw new BadRequestException(
          `El evaluador con ID ${item.evaluatorId} no tiene activo el perfil ${item.profile}.`,
        );
      }
      return {
        evaluatorId: item.evaluatorId,
        profile: item.profile,
        profileId: catalogProfile.profileId,
        // RF-12.2a: Anexo 10 para todos menos Sociedad civil (sin sorteo)
        isAssignedForAnnex10: item.profile !== EvaluatorProfile.SOCIEDAD_CIVIL,
      };
    });

    // 3. Comprobaciones del protocolo y guardado en una transacción con bloqueo
    const reviewBusinessDays = this.systemParams.get(SP_PLAZO_REVISION_OFICIO);
    const result =
      await this.evaluationRepository.createAssignmentsForActiveVersion({
        protocolId,
        expectedVersionId: command.versionId,
        reviewType: command.reviewType,
        assignedByUserId: command.assignedByUserId,
        evaluators: resolved.map((r) => ({
          evaluatorId: r.evaluatorId,
          profileId: r.profileId,
          isAssignedForAnnex10: r.isAssignedForAnnex10,
        })),
        computeReviewDeadline: (assignedAt: Date): Date =>
          BusinessDayCalculator.calculateDetailedDeadline({
            startDate: assignedAt,
            businessDaysToAdd: reviewBusinessDays,
            holidays: [],
          }).deadlineInstant,
      });

    if (!result.ok) {
      const message = PRECONDITION_MESSAGES[result.reason];
      if (result.reason === 'PROTOCOL_NOT_FOUND') {
        throw new NotFoundException(message);
      }
      if (result.reason === 'VERSION_MISMATCH') {
        throw new BadRequestException(message);
      }
      throw new ConflictException(message);
    }

    const profileByEvaluator = new Map(
      resolved.map((r) => [r.evaluatorId, r.profile]),
    );
    const saved = result.assignments.map((orm) => {
      const profile = profileByEvaluator.get(Number(orm.evaluatorId));
      if (profile === undefined) {
        throw new Error(
          `No se encontró el perfil del evaluador con ID ${orm.evaluatorId}.`,
        );
      }
      return new EvaluationAssignmentEntity({
        id: orm.id,
        protocolId,
        evaluatorId: orm.evaluatorId,
        evaluatorProfile: profile,
        isAssignedForAnnex10: orm.isAssignedForAnnex10 ?? false,
        deadlineDate: orm.deadline ?? null,
        status: orm.statusId,
      });
    });

    // 4. Oficio al asignar, esté o no en convocatoria (RF-12.6). Un fallo no deshace la asignación.
    const reviewDeadlineDate = toCalendarDateString(result.reviewDeadline);
    for (const entity of saved) {
      await this.emitAssigned(entity, protocolId, {
        reviewBusinessDays,
        reviewDeadlineDate,
      });
    }

    return saved;
  }

  private async emitAssigned(
    entity: EvaluationAssignmentEntity,
    protocolId: number,
    review: { reviewBusinessDays: number; reviewDeadlineDate: string },
  ): Promise<void> {
    const evaluatorId = Number(entity.evaluatorId);
    const payload: Record<string, unknown> = {
      assignmentId: entity.id,
      protocolId,
      evaluatorId,
      evaluatorProfile: entity.evaluatorProfile,
      isAssignedForAnnex10: entity.isAssignedForAnnex10,
      deadlineDate: entity.deadlineDate,
      reviewBusinessDays: review.reviewBusinessDays,
      reviewDeadlineDate: review.reviewDeadlineDate,
    };

    try {
      const info = await this.evaluationRepository.findEnrichmentInfo(
        evaluatorId,
        protocolId,
      );
      if (info) {
        payload.evaluatorEmail = info.evaluatorEmail;
        payload.evaluatorFullName = info.evaluatorFullName;
        payload.protocolCode = info.ceishCode;
        payload.protocolTitle = info.protocolTitle ?? null;
      }
    } catch (err: unknown) {
      this.logger.warn(
        `[N17] Error al enriquecer evento evaluadorId=${evaluatorId}, protocolId=${protocolId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    try {
      this.eventEmitter.emit('evaluator.assigned', payload);
    } catch (err: unknown) {
      this.logger.error(
        `[N52] Error al emitir el oficio assignmentId=${String(entity.id)}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private toPositiveInt(raw: number | string, message: string): number {
    const value =
      typeof raw === 'number'
        ? raw
        : /^\d+$/.test(String(raw).trim())
          ? parseInt(String(raw).trim(), 10)
          : NaN;
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${message}; se recibió "${String(raw)}".`);
    }
    return value;
  }
}
