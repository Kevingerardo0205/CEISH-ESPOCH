import { BadRequestException } from '@nestjs/common';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { QuotaEvaluatorValidatorService } from '../../domain/services/quota-evaluator-validator.service';
import { RandomRiskSelectorService } from '../../domain/services/random-risk-selector.service';
import { BusinessDayCalculator } from '../../../../shared/services/deadline-calculator.service';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

// Internal type — carries the catalog profileId resolved by the adapter.
// Never appears in the public API contract; not a DTO class.
export interface ResolvedEvaluatorItem {
  evaluatorId: number | string;
  profile: EvaluatorProfile;
  profileId?: number;
}

// Internal command passed from the controller (without profileId) or from the adapter (with profileId).
export interface AssignEvaluatorsCommand {
  protocolId: number | string;
  versionId?: number;
  reviewType?: ReviewType;
  evaluators: ResolvedEvaluatorItem[];
}

export interface IEvaluationRepository {
  saveAssignments?(
    entities: EvaluationAssignmentEntity[],
  ): Promise<EvaluationAssignmentEntity[]>;
  saveAssignmentsTransaction?(
    assignments: Partial<EvaluationAssignmentOrmEntity>[],
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  findVersionById?(id: number): Promise<{ id: number; protocolId: number } | null>;
  findVersionByProtocolId?(
    protocolId: number,
  ): Promise<{ id: number; protocolId: number } | null>;
}

export interface IEventEmitter {
  emit(event: string, payload: Record<string, unknown>): void;
}

export class AssignEvaluatorsUseCase {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly eventEmitter: IEventEmitter,
  ) {}

  /**
   * Caso de uso para la asignación atómica de evaluadores pares [RF-12.1, RF-12.2, RF-12.6]
   */
  public async execute(
    dto: AssignEvaluatorsCommand,
    standardFullDays?: number,
    holidays: string[] = [],
  ): Promise<EvaluationAssignmentEntity[]> {
    // 1. Validar la cuota exacta de 4 perfiles obligatorios (1 de cada uno)
    QuotaEvaluatorValidatorService.validateQuota(dto.evaluators);

    // 2. Seleccionar aleatoriamente a 2 evaluadores para Anexo 10 (Excluyendo Sociedad Civil)
    const annex10EvaluatorIds =
      RandomRiskSelectorService.selectAnnex10Evaluators(dto.evaluators);
    const annex10Set = new Set(annex10EvaluatorIds);

    // NOTA NORMATIVA: Según el PET (líneas 726, 819) y la normativa CEISH, una revisión EXPEDITA
    // requiere únicamente 1 o 2 miembros evaluadores (habitualmente perfil metodológico y salud/ético).
    // Actualmente, la interfaz del frontend envía y requiere la selección de los 4 evaluadores
    // obligatorios para todos los flujos. Por compatibilidad con la interfaz, hoy se asignan los 4
    // evaluadores con el plazo normativo reducido (8 días hábiles), quedando pendiente la decisión
    // del comité para un eventual flujo de asignación parcial de 1-2 miembros en revisiones expeditas.
    // 3. Determinar días hábiles según reviewType (8 para EXPEDITA, 15 para PLENO / por defecto)
    const daysToAdd =
      standardFullDays ?? (dto.reviewType === ReviewType.EXPEDITA ? 8 : 15);

    // 4. Calcular la fecha límite de entrega respetando días hábiles (YYYY-MM-DD para columnas PostgreSQL date)
    const deadlineDate = BusinessDayCalculator.calculateDeadlineDateString({
      startDate: new Date(),
      businessDaysToAdd: daysToAdd,
      holidays,
    });

    // 4. Instanciar las entidades puras de dominio
    const assignmentEntities = dto.evaluators.map((item, index) => {
      const generatedId =
        typeof dto.protocolId === 'number'
          ? typeof item.evaluatorId === 'number'
            ? undefined
            : `asg-${dto.protocolId}-${index + 1}`
          : `asg-${String(dto.protocolId).substring(0, 8)}-${index + 1}`;
      const isAssignedForAnnex10 = annex10Set.has(item.evaluatorId);

      return new EvaluationAssignmentEntity({
        id: generatedId,
        protocolId: dto.protocolId,
        evaluatorId: item.evaluatorId,
        evaluatorProfile: item.profile,
        isAssignedForAnnex10,
        deadlineDate,
      });
    });

    // 5. Persistir atómicamente en la base de datos
    let savedEntities: EvaluationAssignmentEntity[];
    if (this.evaluationRepository.saveAssignments) {
      savedEntities =
        await this.evaluationRepository.saveAssignments(assignmentEntities);
    } else if (this.evaluationRepository.saveAssignmentsTransaction) {
      // b) Strict protocolId: must be a positive integer (rejects "abc", "12abc", 0, -1)
      const rawProtocolId = dto.protocolId;
      if (
        (typeof rawProtocolId === 'string' && !/^\d+$/.test(rawProtocolId)) ||
        (typeof rawProtocolId === 'number' &&
          (!Number.isInteger(rawProtocolId) || rawProtocolId <= 0))
      ) {
        throw new BadRequestException(
          `protocolId debe ser un entero positivo; se recibió "${String(rawProtocolId)}".`,
        );
      }
      const numericProtocolId =
        typeof rawProtocolId === 'number'
          ? rawProtocolId
          : parseInt(rawProtocolId, 10);

      // a) Validate explicitly supplied versionId before any DB write
      if (dto.versionId !== undefined && this.evaluationRepository.findVersionById) {
        const existing = await this.evaluationRepository.findVersionById(
          dto.versionId,
        );
        if (existing === null) {
          throw new BadRequestException(
            `La versión con ID ${dto.versionId} no existe.`,
          );
        }
        if (existing.protocolId !== numericProtocolId) {
          throw new BadRequestException(
            `La versión ${dto.versionId} no pertenece al protocolo ${numericProtocolId}.`,
          );
        }
      }

      let resolvedVersionId: number | undefined = dto.versionId;
      if (resolvedVersionId === undefined) {
        if (!this.evaluationRepository.findVersionByProtocolId) {
          throw new BadRequestException(
            'No se puede resolver la versión del protocolo: falta versionId o soporte de findVersionByProtocolId.',
          );
        }
        const found =
          await this.evaluationRepository.findVersionByProtocolId(
            numericProtocolId,
          );
        if (found === null) {
          throw new BadRequestException(
            `No existe versión activa resoluble para el protocolo con ID ${numericProtocolId}.`,
          );
        }
        resolvedVersionId = found.id;
      }
      const ormPayloads = assignmentEntities.map((entity, index) => {
        const dtoItem = dto.evaluators[index];
        return {
          versionId: resolvedVersionId,
          evaluatorId:
            typeof entity.evaluatorId === 'number'
              ? entity.evaluatorId
              : parseInt(`${entity.evaluatorId}`, 10) || 1,
          profileId: dtoItem?.profileId,
          statusId: AssignmentStatus.ASSIGNED,
          isAssignedForAnnex10: entity.isAssignedForAnnex10,
          deadline: entity.deadlineDate,
        };
      });
      const ormEntities =
        await this.evaluationRepository.saveAssignmentsTransaction(ormPayloads);

      const profileMap = new Map(
        dto.evaluators.map((e) => [e.evaluatorId, e.profile]),
      );
      savedEntities = ormEntities.map(
        (orm) =>
          new EvaluationAssignmentEntity({
            id: orm.id,
            protocolId: dto.protocolId,
            evaluatorId: orm.evaluatorId,
            evaluatorProfile:
              profileMap.get(orm.evaluatorId) ?? EvaluatorProfile.SALUD,
            isAssignedForAnnex10: orm.isAssignedForAnnex10 ?? false,
            deadlineDate: orm.deadline ?? deadlineDate,
            status: orm.statusId,
          }),
      );
    } else {
      savedEntities = assignmentEntities;
    }

    // 6. Notificar asincrónicamente con Deep-Linking por cada evaluador asignado
    for (const entity of savedEntities) {
      this.eventEmitter.emit('evaluator.assigned', {
        assignmentId: entity.id,
        protocolId: entity.protocolId,
        evaluatorId: entity.evaluatorId,
        evaluatorProfile: entity.evaluatorProfile,
        isAssignedForAnnex10: entity.isAssignedForAnnex10,
        deadlineDate: entity.deadlineDate,
      });
    }

    return savedEntities;
  }
}
