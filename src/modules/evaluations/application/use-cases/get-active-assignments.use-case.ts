import { NotFoundException } from '@nestjs/common';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { ActiveVersionRow } from '../../domain/ports/evaluation.repository.port';
import { resolveEvaluatorProfile } from '../../../../shared/helpers/evaluator-profile.helper';

// Deuda técnica: toda la asignación (assign-evaluators.use-case.ts:127-143,
// evaluations.service.ts:856-858, EvaluatorAssignmentAdapterService) está fijada
// a numero_version=1. Si se habilitan evaluaciones de versiones posteriores,
// escritor y lector deben cambiarse juntos.

export interface IActiveAssignmentsQueryRepository {
  findProtocolWithVersion1(
    protocolId: number,
  ): Promise<ActiveVersionRow | null>;
  findActiveAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
}

export interface ActiveAssignmentItemDto {
  assignmentId: number;
  evaluatorId: number;
  evaluatorFullName: string;
  evaluatorProfile:
    'JURIDICO' | 'SOCIEDAD_CIVIL' | 'METODOLOGICO' | 'SALUD' | null;
  status: 'SUGGESTED' | 'ASSIGNED' | 'COMPLETED';
  isAssignedForAnnex10: boolean;
  /** ISO-8601 completo (con hora). */
  assignedAt: string | null;
  /** Fecha de calendario YYYY-MM-DD sin hora; el cliente debe interpretarla como fecha local. */
  deadlineDate: string | null;
  /** ISO-8601 completo (con hora). */
  submittedAt: string | null;
}

export interface ActiveAssignmentsDto {
  protocolId: number;
  ceishCode: string | null;
  versionId: number | null;
  versionNumber: number | null;
  assignments: ActiveAssignmentItemDto[];
}

const STATUS_MAP: Partial<
  Record<number, 'SUGGESTED' | 'ASSIGNED' | 'COMPLETED'>
> = {
  [AssignmentStatus.SUGGESTED]: 'SUGGESTED',
  [AssignmentStatus.ASSIGNED]: 'ASSIGNED',
  [AssignmentStatus.COMPLETED]: 'COMPLETED',
};

export class GetActiveAssignmentsUseCase {
  constructor(private readonly repository: IActiveAssignmentsQueryRepository) {}

  async execute(protocolId: number): Promise<ActiveAssignmentsDto> {
    const protocolRow =
      await this.repository.findProtocolWithVersion1(protocolId);
    if (!protocolRow) {
      throw new NotFoundException(
        `El protocolo con ID ${protocolId} no existe.`,
      );
    }

    if (!protocolRow.versionId) {
      return {
        protocolId,
        ceishCode: protocolRow.ceishCode,
        versionId: null,
        versionNumber: null,
        assignments: [],
      };
    }

    const raw = await this.repository.findActiveAssignmentsByVersionId(
      protocolRow.versionId,
    );

    const mapped: ActiveAssignmentItemDto[] = raw
      .map((a): ActiveAssignmentItemDto => {
        const profile = resolveEvaluatorProfile(a.profile?.name);
        return {
          assignmentId: a.id,
          evaluatorId: a.evaluatorId,
          evaluatorFullName: a.evaluator?.fullName ?? '',
          evaluatorProfile: profile,
          status: STATUS_MAP[a.statusId] as
            'SUGGESTED' | 'ASSIGNED' | 'COMPLETED',
          isAssignedForAnnex10: a.isAssignedForAnnex10,
          assignedAt:
            a.assignedAt instanceof Date
              ? a.assignedAt.toISOString()
              : a.assignedAt
                ? String(a.assignedAt)
                : null,
          deadlineDate: a.deadline ?? null,
          submittedAt: a.actualSubmissionDate
            ? a.actualSubmissionDate instanceof Date
              ? a.actualSubmissionDate.toISOString()
              : String(a.actualSubmissionDate)
            : null,
        };
      })
      .sort((x, y) => {
        const tx = x.assignedAt ? new Date(x.assignedAt).getTime() : Infinity;
        const ty = y.assignedAt ? new Date(y.assignedAt).getTime() : Infinity;
        if (tx !== ty) return tx - ty;
        return x.assignmentId - y.assignmentId;
      });

    return {
      protocolId,
      ceishCode: protocolRow.ceishCode,
      versionId: protocolRow.versionId,
      versionNumber: protocolRow.versionNumber,
      assignments: mapped,
    };
  }
}
