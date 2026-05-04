import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';

export abstract class IEvaluationRepository {
  // Assignments
  abstract findAssignmentById(id: number): Promise<EvaluationAssignmentOrmEntity | null>;
  abstract saveAssignment(entity: Partial<EvaluationAssignmentOrmEntity>): Promise<EvaluationAssignmentOrmEntity>;
  abstract findAssignmentsByVersionId(versionId: number): Promise<EvaluationAssignmentOrmEntity[]>;
  abstract findAssignmentsByEvaluatorId(evaluatorId: number): Promise<EvaluationAssignmentOrmEntity[]>;
  
  // Evaluators & Profiles
  abstract findEvaluatorsWithWorkload(profileId?: number): Promise<any[]>;
  abstract findProfiles(): Promise<EvaluatorProfileOrmEntity[]>;
  
  // Versions
  abstract saveVersion(entity: Partial<ProtocolVersionOrmEntity>): Promise<ProtocolVersionOrmEntity>;
  abstract findVersionByProtocolId(protocolId: number, versionNumber?: number): Promise<ProtocolVersionOrmEntity | null>;

  // Detailed Evaluations
  abstract saveEvaluation(entity: Partial<EvaluationOrmEntity>): Promise<EvaluationOrmEntity>;
  abstract findEvaluationByAssignmentId(assignmentId: number): Promise<EvaluationOrmEntity | null>;
}
