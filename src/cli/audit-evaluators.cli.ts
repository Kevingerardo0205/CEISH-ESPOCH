import { EvaluatorProfile } from '../shared/enums/evaluator-enums';

export interface CliAssignmentItem {
  evaluatorId: string | number;
  evaluatorProfile: EvaluatorProfile;
  isAssignedForAnnex10: boolean;
  status: string | number;
}

export interface CliHistoryItem {
  previousEvaluatorId?: string | number;
  reassignmentReason?: string;
  newEvaluatorId?: string | number;
  executedAt?: Date;
}

export interface AuditSuccessOutput {
  status: 'success';
  protocolId: string;
  isQuotaComplete: boolean;
  activeProfiles: EvaluatorProfile[];
  annex10AssignedCount: number;
  annex10ExcludesSociedadCivil: boolean;
  totalReassignmentsCount: number;
  reassignmentsHistory: CliHistoryItem[];
}

export interface AuditErrorOutput {
  status: 'error';
  code: string;
  message: string;
}

export interface AuditCliResult {
  exitCode: number;
  output: AuditSuccessOutput | AuditErrorOutput;
}

export interface IAuditCliRepository {
  findAssignmentsByProtocolId(protocolId: string): Promise<CliAssignmentItem[]>;
  findHistoryByProtocolId(protocolId: string): Promise<CliHistoryItem[]>;
}

export class AuditEvaluatorsCli {
  constructor(private readonly repository: IAuditCliRepository) {}

  /**
   * Ejecución de auditoría desde consola para la cuota de evaluadores y reasignaciones [RF-12.1, RF-12.3]
   */
  public async execute(protocolId: string): Promise<AuditCliResult> {
    if (!protocolId || protocolId.trim() === '') {
      return {
        exitCode: 1,
        output: {
          status: 'error',
          code: 'MISSING_PROTOCOL_ID',
          message: 'Debe proporcionar un ID de protocolo válido.',
        },
      };
    }

    try {
      const assignments =
        await this.repository.findAssignmentsByProtocolId(protocolId);
      const history = await this.repository.findHistoryByProtocolId(protocolId);

      const activeAssignments = assignments.filter(
        (a) =>
          a.status === 'ASSIGNED' ||
          a.status === 'SUBMITTED' ||
          a.status === 6 ||
          a.status === 7,
      );

      const activeProfiles: EvaluatorProfile[] = activeAssignments.map(
        (a) => a.evaluatorProfile,
      );
      const isQuotaComplete =
        activeAssignments.length === 4 && new Set(activeProfiles).size === 4;

      const annex10Assigned = activeAssignments.filter(
        (a) => a.isAssignedForAnnex10,
      );
      const sociedadCivilAnnex10 = annex10Assigned.find(
        (a) => a.evaluatorProfile === EvaluatorProfile.SOCIEDAD_CIVIL,
      );

      return {
        exitCode: 0,
        output: {
          status: 'success',
          protocolId,
          isQuotaComplete,
          activeProfiles,
          annex10AssignedCount: annex10Assigned.length,
          annex10ExcludesSociedadCivil: !sociedadCivilAnnex10,
          totalReassignmentsCount: history.length,
          reassignmentsHistory: history,
        },
      };
    } catch (error: unknown) {
      const err = error as Error | undefined;
      return {
        exitCode: 1,
        output: {
          status: 'error',
          code: 'CLI_EXECUTION_FAILED',
          message: err?.message ?? 'Error desconocido al auditar evaluadores.',
        },
      };
    }
  }
}
