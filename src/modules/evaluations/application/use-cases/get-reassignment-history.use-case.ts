import { NotFoundException } from '@nestjs/common';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { resolveEvaluatorProfile } from '../../../../shared/helpers/evaluator-profile.helper';
import { ReassignmentHistoryRawRow } from '../../domain/ports/evaluation.repository.port';

export interface ReassignmentHistoryEntryDto {
  id: number;
  assignmentId: number;
  previousEvaluatorId: number;
  previousEvaluatorName: string;
  newEvaluatorId: number;
  newEvaluatorName: string;
  evaluatorProfile: EvaluatorProfile;
  reassignmentReason: ReassignmentReason;
  reasonDescription: string;
  executedByUserId: number;
  executedByUserName?: string;
  executedAt: string;
}

export interface IHistoryQueryRepository {
  findReassignmentHistoryByProtocolId(
    protocolId: number,
  ): Promise<ReassignmentHistoryRawRow[]>;
  protocolExists(protocolId: number): Promise<boolean>;
}

export class GetReassignmentHistoryUseCase {
  constructor(private readonly repository: IHistoryQueryRepository) {}

  async execute(protocolId: number): Promise<ReassignmentHistoryEntryDto[]> {
    const rows =
      await this.repository.findReassignmentHistoryByProtocolId(protocolId);

    if (rows.length === 0) {
      const exists = await this.repository.protocolExists(protocolId);
      if (!exists) {
        throw new NotFoundException(
          `El protocolo con ID ${protocolId} no existe.`,
        );
      }
      return [];
    }

    return rows.map((row): ReassignmentHistoryEntryDto => {
      const evaluatorProfile = resolveEvaluatorProfile(row.profileName);
      if (!evaluatorProfile) {
        throw new NotFoundException(
          `Perfil de evaluador no reconocido '${row.profileName ?? 'nulo'}' en historial ID ${row.id}.`,
        );
      }
      return {
        id: row.id,
        assignmentId: row.assignmentId,
        previousEvaluatorId: row.previousEvaluatorId,
        previousEvaluatorName: row.previousEvaluatorName,
        newEvaluatorId: row.newEvaluatorId,
        newEvaluatorName: row.newEvaluatorName,
        evaluatorProfile,
        reassignmentReason: row.reassignmentReason as ReassignmentReason,
        reasonDescription: row.reasonDescription ?? '',
        executedByUserId: row.executedByUserId,
        executedByUserName: row.executedByUserName ?? undefined,
        executedAt:
          row.executedAt instanceof Date
            ? row.executedAt.toISOString()
            : String(row.executedAt),
      };
    });
  }
}
