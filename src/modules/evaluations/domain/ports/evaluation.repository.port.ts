import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';

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
  abstract findAssignmentsByEvaluatorId(
    evaluatorId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract findPendingSuggestions(): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract deleteAssignment(id: number): Promise<void>;

  // Evaluators & Profiles
  abstract findEvaluatorsWithWorkload(profileId?: number): Promise<any[]>;
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
  abstract findEvaluationByAssignmentId(
    assignmentId: number,
  ): Promise<EvaluationOrmEntity | null>;
}
