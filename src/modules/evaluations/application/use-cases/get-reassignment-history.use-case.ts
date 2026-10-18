import { NotFoundException } from '@nestjs/common';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
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

function resolveProfile(
  name: string | null | undefined,
): EvaluatorProfile | null {
  if (!name) return null;
  const norm = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (norm.includes('JURIDIC')) return EvaluatorProfile.JURIDICO;
  if (norm.includes('SOCIEDAD')) return EvaluatorProfile.SOCIEDAD_CIVIL;
  if (norm.includes('METODOL')) return EvaluatorProfile.METODOLOGICO;
  if (norm.includes('SALUD')) return EvaluatorProfile.SALUD;
  return null;
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
      const evaluatorProfile = resolveProfile(row.profileName);
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
