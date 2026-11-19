import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../../infrastructure/database/evaluation-response-detail.entity.orm';
import { AssignmentHistoryOrmEntity } from '../../infrastructure/database/entities/assignment-history.orm-entity';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

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

  // Convocatoria deadline [TSK-002-N41]
  abstract findActiveConvocatoriaDeadline(
    versionId: number,
  ): Promise<Date | null>;

  // Convocatoria filter [TSK-002-N42] — reusable by N43 for single-id guard
  abstract filterVersionIdsInActiveConvocatoria(
    versionIds: number[],
  ): Promise<number[]>;

  // Legacy convocatoria filter [TSK-002-N42] — peerRiskRepository lacks version_id; filters by protocolo_id
  abstract filterProtocolIdsInActiveConvocatoria(
    protocolIds: number[],
  ): Promise<number[]>;

  // Active assignments [RF-12.4]
  // Deuda: toda la asignación (assign-evaluators.use-case.ts:127-143,
  // evaluations.service.ts:856-858, EvaluatorAssignmentAdapterService) está fijada
  // a numero_version=1. Si se habilitan evaluaciones de versiones posteriores,
  // escritor y lector deben cambiarse juntos.
  abstract findProtocolWithVersion1(
    protocolId: number,
  ): Promise<ActiveVersionRow | null>;

  abstract findEnrichmentInfo(
    evaluatorId: number,
    protocolId: number,
  ): Promise<EvaluatorEnrichmentInfo | null>;

  // Asignación por la PRESIDENTE [RF-12.1 d/e, RF-12.7 c.1, TSK-002-N52]
  abstract findEvaluatorCandidates(
    userIds: number[],
  ): Promise<EvaluatorCandidateRow[]>;
  abstract createAssignmentsForActiveVersion(
    params: CreateAssignmentsForActiveVersionParams,
  ): Promise<CreateAssignmentsResult>;
}

/** Datos de un usuario para comprobar que puede evaluar (RF-12.1 d). */
export interface EvaluatorCandidateRow {
  userId: number;
  isActive: boolean;
  hasEvaluatorRole: boolean;
  /** Perfiles activos de la persona en catalogos.evaluadores_perfil. */
  profiles: Array<{ profileId: number; profileName: string }>;
}

/** Motivos por los que no se puede asignar (el caso de uso los traduce a 400/404/409). */
export type AssignmentPreconditionFailure =
  | 'PROTOCOL_NOT_FOUND'
  | 'NO_ACTIVE_VERSION'
  | 'VERSION_MISMATCH'
  | 'RECEPTION_NOT_COMPLETE'
  | 'TERMS_NOT_ACCEPTED'
  | 'ALREADY_ASSIGNED';

export interface CreateAssignmentsForActiveVersionParams {
  protocolId: number;
  /** Si llega, debe ser la versión activa del protocolo. */
  expectedVersionId?: number;
  reviewType: ReviewType.EXPEDITA | ReviewType.PLENO;
  assignedByUserId: number;
  evaluators: Array<{
    evaluatorId: number;
    profileId: number;
    isAssignedForAnnex10: boolean;
  }>;
  /** Calcula la fecha límite del plazo de evaluación desde NOW() de la base. */
  computeReviewDeadline: (assignedAt: Date) => Date;
}

export type CreateAssignmentsResult =
  | {
      ok: true;
      versionId: number;
      assignedAt: Date;
      reviewDeadline: Date;
      /** Fecha de entrega de la convocatoria vigente si ya está agendado (RF-12.7 b). */
      convocatoriaDeadline: Date | null;
      assignments: EvaluationAssignmentOrmEntity[];
    }
  | { ok: false; reason: AssignmentPreconditionFailure };

export interface ActiveVersionRow {
  ceishCode: string | null;
  versionId: number | null;
  versionNumber: number | null;
}

export interface EvaluatorEnrichmentInfo {
  evaluatorEmail: string;
  evaluatorFullName: string;
  ceishCode: string | null;
  /** Título del protocolo para el oficio (RF-12.6, TSK-002-N52). */
  protocolTitle?: string | null;
}
