import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
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

    const newDeadline = BusinessDayCalculator.calculateDeadline({
      startDate: new Date(),
      businessDaysToAdd: standardFullDays,
      holidays,
    });

    const profileIdToEnumMap: Record<number, EvaluatorProfile> = {
      1: EvaluatorProfile.JURIDICO,
      2: EvaluatorProfile.SOCIEDAD_CIVIL,
      3: EvaluatorProfile.METODOLOGICO,
      4: EvaluatorProfile.SALUD,
    };

    const inheritedAssignments = activeAssignments.map((old, index) => {
      const generatedId =
        typeof newVersionOrProtocolId === 'number'
          ? undefined
          : `asg-${String(newVersionOrProtocolId).substring(0, 8)}-v2-${index + 1}`;

      const profile =
        (old as EvaluationAssignmentEntity).evaluatorProfile ??
        ((old as EvaluationAssignmentOrmEntity).profile
          ?.name as EvaluatorProfile) ??
        ((old as EvaluationAssignmentOrmEntity).profileId
          ? profileIdToEnumMap[
              (old as EvaluationAssignmentOrmEntity).profileId!
            ]
          : EvaluatorProfile.SALUD);

      return new EvaluationAssignmentEntity({
        id: generatedId,
        protocolId: newVersionOrProtocolId,
        evaluatorId: old.evaluatorId,
        evaluatorProfile: profile,
        isAssignedForAnnex10: old.isAssignedForAnnex10 ?? false,
        deadlineDate: newDeadline,
        status: AssignmentStatus.ASSIGNED,
      });
    });

    if (this.evaluationRepository.saveAssignments) {
      return await this.evaluationRepository.saveAssignments(
        inheritedAssignments,
      );
    } else if (this.evaluationRepository.saveAssignmentsTransaction) {
      const profileEnumToIdMap: Record<string, number> = {
        [EvaluatorProfile.JURIDICO]: 1,
        [EvaluatorProfile.SOCIEDAD_CIVIL]: 2,
        [EvaluatorProfile.METODOLOGICO]: 3,
        [EvaluatorProfile.SALUD]: 4,
      };

      const ormPayloads = inheritedAssignments.map((entity) => ({
        versionId:
          typeof newVersionOrProtocolId === 'number'
            ? newVersionOrProtocolId
            : 1,
        evaluatorId:
          typeof entity.evaluatorId === 'number'
            ? entity.evaluatorId
            : parseInt(`${entity.evaluatorId}`, 10) || 1,
        profileId: profileEnumToIdMap[entity.evaluatorProfile] ?? 1,
        statusId: AssignmentStatus.ASSIGNED,
        isAssignedForAnnex10: entity.isAssignedForAnnex10,
        deadline: entity.deadlineDate,
      }));

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
