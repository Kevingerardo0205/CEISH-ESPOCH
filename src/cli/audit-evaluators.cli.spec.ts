import {
  AuditEvaluatorsCli,
  IAuditCliRepository,
  AuditSuccessOutput,
  AuditErrorOutput,
} from './audit-evaluators.cli';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../shared/enums/evaluator-enums';

describe('AuditEvaluatorsCli (TSK-002-17)', () => {
  let repositoryMock: IAuditCliRepository;
  let cli: AuditEvaluatorsCli;

  beforeEach(() => {
    repositoryMock = {
      findAssignmentsByProtocolId: jest.fn().mockResolvedValue([
        {
          evaluatorId: 'eval-1',
          evaluatorProfile: EvaluatorProfile.JURIDICO,
          isAssignedForAnnex10: true,
          status: 'ASSIGNED',
        },
        {
          evaluatorId: 'eval-2',
          evaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
          isAssignedForAnnex10: false,
          status: 'ASSIGNED',
        },
        {
          evaluatorId: 'eval-3',
          evaluatorProfile: EvaluatorProfile.METODOLOGICO,
          isAssignedForAnnex10: true,
          status: 'ASSIGNED',
        },
        {
          evaluatorId: 'eval-4',
          evaluatorProfile: EvaluatorProfile.SALUD,
          isAssignedForAnnex10: false,
          status: 'ASSIGNED',
        },
      ]),
      findHistoryByProtocolId: jest.fn().mockResolvedValue([
        {
          previousEvaluatorId: 'eval-old',
          reassignmentReason: ReassignmentReason.CONFLICTO_INTERES,
          newEvaluatorId: 'eval-1',
          executedAt: new Date('2026-09-22T20:00:00Z'),
        },
      ]),
    };
    cli = new AuditEvaluatorsCli(repositoryMock);
  });

  it('should format audit report JSON with exit code 0 when quota is complete', async () => {
    const result = await cli.execute('123e4567-e89b-12d3-a456-426614174000');

    expect(result.exitCode).toBe(0);
    const output = result.output as AuditSuccessOutput;
    expect(output.status).toBe('success');
    expect(output.isQuotaComplete).toBe(true);
    expect(output.activeProfiles).toHaveLength(4);
    expect(output.annex10AssignedCount).toBe(2);
    expect(output.annex10ExcludesSociedadCivil).toBe(true);
    expect(output.totalReassignmentsCount).toBe(1);
  });

  it('should return exit code 1 with error details when protocolId is missing or empty', async () => {
    const result = await cli.execute('');

    expect(result.exitCode).toBe(1);
    const output = result.output as AuditErrorOutput;
    expect(output.status).toBe('error');
    expect(output.code).toBe('MISSING_PROTOCOL_ID');
  });
});
