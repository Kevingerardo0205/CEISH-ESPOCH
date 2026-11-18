import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import {
  EvaluatorProfile,
  toEvaluatorProfile,
} from '../../../../shared/enums/evaluator-enums';
import { BusinessDayCalculator } from '../../../../shared/services/deadline-calculator.service';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';

export interface IInheritEvaluatorsRepository {
  findActiveAssignmentsByProtocolId?(
    protocolId: number | string,
  ): Promise<EvaluationAssignmentEntity[]>;
  findActiveAssignmentsByVersionId?(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  saveAssignments?(
    assignments: EvaluationAssignmentEntity[],
  ): Promise<EvaluationAssignmentEntity[]>;
  saveAssignmentsTransaction?(
    assignments: Partial<EvaluationAssignmentOrmEntity>[],
  ): Promise<EvaluationAssignmentOrmEntity[]>;
}

export class InheritEvaluatorsUseCase {
  constructor(
    private readonly evaluationRepository: IInheritEvaluatorsRepository,
  ) {}

  /**
   * Hereda automáticamente los 4 evaluadores pares de v1.0 a v2.0/v3.0 [RF-12.5]
   */
  public async execute(
    previousVersionOrProtocolId: number | string,
    newVersionOrProtocolId: number | string,
    standardFullDays: number = 15,
    holidays: string[] = [],
  ): Promise<EvaluationAssignmentEntity[]> {
    let activeAssignments: (
      EvaluationAssignmentEntity | EvaluationAssignmentOrmEntity
    )[] = [];

    if (
      typeof previousVersionOrProtocolId === 'number' &&
      this.evaluationRepository.findActiveAssignmentsByVersionId
    ) {
      activeAssignments =
        await this.evaluationRepository.findActiveAssignmentsByVersionId(
          previousVersionOrProtocolId,
        );
    } else if (this.evaluationRepository.findActiveAssignmentsByProtocolId) {
      activeAssignments =
        await this.evaluationRepository.findActiveAssignmentsByProtocolId(
          previousVersionOrProtocolId,
        );
    }

    if (activeAssignments.length !== 4) {
      throw new Error(
        'El protocolo de origen debe contar exactamente con 4 evaluadores pares activos para continuar.',
      );
    }

    const newDeadline = BusinessDayCalculator.calculateDeadlineDateString({
      startDate: new Date(),
      businessDaysToAdd: standardFullDays,
      holidays,
    });

    // Enrich: resolve profile from catalog name (relation always loaded for ORM entities)
    // and preserve originalProfileId for ORM persistence.
    // Bioético (id 7) se hereda como cualquier otro perfil (TSK-002-N50).
    const enriched = activeAssignments.map((old, index) => {
      const ormEntity = old as EvaluationAssignmentOrmEntity;
      const profileFromDomain = (old as Partial<EvaluationAssignmentEntity>)
        .evaluatorProfile;
      const profileFromName =
        toEvaluatorProfile(ormEntity.profile?.name) ?? undefined;
      const profileMaybe: EvaluatorProfile | undefined =
        profileFromDomain ?? profileFromName;

      if (!profileMaybe) {
        throw new Error(
          `No se pudo determinar el perfil del evaluador ${index + 1} (profileId=${ormEntity.profileId ?? 'desconocido'}, nombre='${ormEntity.profile?.name ?? 'sin nombre'}'). Verifique la asignación.`,
        );
      }

      const profile: EvaluatorProfile = profileMaybe;

      const generatedId =
        typeof newVersionOrProtocolId === 'number'
          ? undefined
          : `asg-${String(newVersionOrProtocolId).substring(0, 8)}-v2-${index + 1}`;

      return {
        assignment: new EvaluationAssignmentEntity({
          id: generatedId,
          protocolId: newVersionOrProtocolId,
          evaluatorId: old.evaluatorId,
          evaluatorProfile: profile,
          isAssignedForAnnex10: old.isAssignedForAnnex10 ?? false,
          deadlineDate: newDeadline,
          status: AssignmentStatus.ASSIGNED,
        }),
        originalProfileId: ormEntity.profileId,
      };
    });

    const inheritedAssignments = enriched.map((e) => e.assignment);

    if (this.evaluationRepository.saveAssignments) {
      return await this.evaluationRepository.saveAssignments(
        inheritedAssignments,
      );
    } else if (this.evaluationRepository.saveAssignmentsTransaction) {
      const ormPayloads = enriched.map(
        ({ assignment, originalProfileId }, idx) => {
          if (!originalProfileId) {
            throw new Error(
              `No se pudo determinar profileId para el evaluador ${idx + 1} en herencia. Verifique la asignación original.`,
            );
          }
          return {
            versionId:
              typeof newVersionOrProtocolId === 'number'
                ? newVersionOrProtocolId
                : 1,
            evaluatorId:
              typeof assignment.evaluatorId === 'number'
                ? assignment.evaluatorId
                : parseInt(`${assignment.evaluatorId}`, 10) || 1,
            profileId: originalProfileId,
            statusId: AssignmentStatus.ASSIGNED,
            isAssignedForAnnex10: assignment.isAssignedForAnnex10,
            deadline: assignment.deadlineDate,
          };
        },
      );

      const savedOrm =
        await this.evaluationRepository.saveAssignmentsTransaction(ormPayloads);

      return savedOrm.map(
        (orm, idx) =>
          new EvaluationAssignmentEntity({
            id: orm.id,
            protocolId: newVersionOrProtocolId,
            evaluatorId: orm.evaluatorId,
            evaluatorProfile: inheritedAssignments[idx].evaluatorProfile,
            isAssignedForAnnex10: orm.isAssignedForAnnex10 ?? false,
            deadlineDate: orm.deadline ?? newDeadline,
            status: orm.statusId,
          }),
      );
    }

    return inheritedAssignments;
  }
}
