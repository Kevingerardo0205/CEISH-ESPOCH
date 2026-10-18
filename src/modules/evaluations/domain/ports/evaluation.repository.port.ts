import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../../infrastructure/database/evaluation-response-detail.entity.orm';
import { AssignmentHistoryOrmEntity } from '../../infrastructure/database/entities/assignment-history.orm-entity';

export interface ReassignmentHistoryRawRow {
  id: number;
  assignmentId: number;
  previousEvaluatorId: number;
  previousEvaluatorName: string;
  newEvaluatorId: number;
  newEvaluatorName: string;
  profileName: string | null;
  reassignmentReason: string;
  reasonDescription: string | null;
  executedByUserId: number;
  executedByUserName: string | null;
  executedAt: Date;
}

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
  abstract findVersionById(
    id: number,
  ): Promise<ProtocolVersionOrmEntity | null>;
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

  // Reassignment history [RF-12.3]
  abstract findReassignmentHistoryByProtocolId(
    protocolId: number,
  ): Promise<ReassignmentHistoryRawRow[]>;
  abstract protocolExists(protocolId: number): Promise<boolean>;

  // Active assignments [RF-12.4]
  // Deuda: toda la asignación (assign-evaluators.use-case.ts:127-143,
  // evaluations.service.ts:856-858, EvaluatorAssignmentAdapterService) está fijada
  // a numero_version=1. Si se habilitan evaluaciones de versiones posteriores,
  // escritor y lector deben cambiarse juntos.
  abstract findProtocolWithVersion1(
    protocolId: number,
  ): Promise<ActiveVersionRow | null>;
}

export interface ActiveVersionRow {
  ceishCode: string | null;
  versionId: number | null;
  versionNumber: number | null;
}
