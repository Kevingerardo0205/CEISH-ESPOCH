import { RandomRiskSelectorService } from './random-risk-selector.service';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { EvaluatorCandidateInput } from './quota-evaluator-validator.service';

describe('RandomRiskSelectorService (TSK-002-05 / TSK-002-06)', () => {
  const fullQuotaCandidates: EvaluatorCandidateInput[] = [
    { evaluatorId: 'eval-juridico', profile: EvaluatorProfile.JURIDICO },
    { evaluatorId: 'eval-sociedad', profile: EvaluatorProfile.SOCIEDAD_CIVIL },
    {
      evaluatorId: 'eval-metodologico',
      profile: EvaluatorProfile.METODOLOGICO,
    },
    { evaluatorId: 'eval-salud', profile: EvaluatorProfile.SALUD },
  ];

  it('should select exactly 2 evaluators for Annex 10', () => {
    const selectedIds =
      RandomRiskSelectorService.selectAnnex10Evaluators(fullQuotaCandidates);
    expect(selectedIds).toHaveLength(2);
  });

  it('should NEVER select SOCIEDAD_CIVIL across 100 consecutive executions', () => {
    for (let i = 0; i < 100; i++) {
      const selectedIds =
        RandomRiskSelectorService.selectAnnex10Evaluators(fullQuotaCandidates);
      expect(selectedIds).not.toContain('eval-sociedad');
      expect(selectedIds).toHaveLength(2);
    }
  });

  it('should throw error if there are fewer than 2 eligible non-SOCIEDAD_CIVIL candidates', () => {
    const invalidCandidates: EvaluatorCandidateInput[] = [
      {
        evaluatorId: 'eval-sociedad1',
        profile: EvaluatorProfile.SOCIEDAD_CIVIL,
      },
      {
        evaluatorId: 'eval-sociedad2',
        profile: EvaluatorProfile.SOCIEDAD_CIVIL,
      },
      { evaluatorId: 'eval-juridico', profile: EvaluatorProfile.JURIDICO },
    ];

    expect(() =>
      RandomRiskSelectorService.selectAnnex10Evaluators(invalidCandidates),
    ).toThrow(
      'No existen suficientes evaluadores aptos para estratificación de riesgo.',
    );
  });
});
