import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../../infrastructure/database/evaluation-response-detail.entity.orm';
import { AssignmentHistoryOrmEntity } from '../../infrastructure/database/entities/assignment-history.orm-entity';

export abstract class IEvaluationRepository {
  // Assignments
  abstract findAssignmentById(
    id: number,
  ): Promise<EvaluationAssignmentOrmEntity | null>;
  abstract saveAssignment(
    entity: Partial<EvaluationAssignmentOrmEntity>,
  ): Promise<EvaluationAssignmentOrmEntity>;
  abstract findAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract findActiveAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract findAssignmentsByEvaluatorId(
    evaluatorId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract findPendingSuggestions(): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract deleteAssignment(id: number): Promise<void>;

  // Transactional Assignments & Reassignments [RF-12.1, RF-12.3]
  abstract saveAssignmentsTransaction(
    assignments: Partial<EvaluationAssignmentOrmEntity>[],
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract executeReassignmentTransaction(params: {
    outgoingAssignmentId: number;
    outgoingStatusId: number;
    newAssignment: Partial<EvaluationAssignmentOrmEntity>;
    auditHistory: Partial<AssignmentHistoryOrmEntity>;
  }): Promise<{
    outgoingAssignment: EvaluationAssignmentOrmEntity;
    newAssignment: EvaluationAssignmentOrmEntity;
    auditHistory: AssignmentHistoryOrmEntity;
  }>;

  // Evaluators & Profiles
  abstract hasActiveProfile(
    userId: number | string,
    profileId: number,
  ): Promise<boolean>;
  abstract findEvaluatorsWithWorkload(
    profileId?: number,
  ): Promise<Record<string, unknown>[]>;
  abstract findProfiles(): Promise<EvaluatorProfileOrmEntity[]>;
  abstract findProfileById(
    id: number,
  ): Promise<EvaluatorProfileOrmEntity | null>;
  abstract saveProfile(
    entity: Partial<EvaluatorProfileOrmEntity>,
  ): Promise<EvaluatorProfileOrmEntity>;
  abstract updateProfile(
    id: number,
    entity: Partial<EvaluatorProfileOrmEntity>,
  ): Promise<void>;
  abstract deleteProfile(id: number): Promise<void>;

  // Versions
  abstract saveVersion(
    entity: Partial<ProtocolVersionOrmEntity>,
  ): Promise<ProtocolVersionOrmEntity>;
  abstract findVersionByProtocolId(
    protocolId: number,
    versionNumber?: number,
  ): Promise<ProtocolVersionOrmEntity | null>;

  // Detailed Evaluations
  abstract saveEvaluation(
    entity: Partial<EvaluationOrmEntity>,
  ): Promise<EvaluationOrmEntity>;
  abstract findEvaluationById(id: number): Promise<EvaluationOrmEntity | null>;
  abstract findEvaluationByAssignmentId(
    assignmentId: number,
  ): Promise<EvaluationOrmEntity | null>;
  abstract saveEvaluationCriteria(
    evaluationId: number,
    criteriaId: number,
    valor: boolean,
  ): Promise<void>;
  abstract saveEvaluationResponseDetails(
    details: EvaluationResponseDetailOrmEntity[],
  ): Promise<EvaluationResponseDetailOrmEntity[]>;
  abstract findEvaluationDetailsByEvaluationId(
    evaluationId: number,
  ): Promise<EvaluationResponseDetailOrmEntity[]>;
  abstract deleteEvaluationResponseDetails(evaluationId: number): Promise<void>;
}
