import { QuotaEvaluatorValidatorService } from './quota-evaluator-validator.service';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';

describe('QuotaEvaluatorValidatorService (TSK-002-03 / TSK-002-04)', () => {
  it('should accept a valid list of exactly 4 unique profiles (1 Juridico, 1 Sociedad Civil, 1 Metodologico, 1 Salud)', () => {
    const validCandidates = [
      { evaluatorId: 'e1', profile: EvaluatorProfile.JURIDICO },
      { evaluatorId: 'e2', profile: EvaluatorProfile.SOCIEDAD_CIVIL },
      { evaluatorId: 'e3', profile: EvaluatorProfile.METODOLOGICO },
      { evaluatorId: 'e4', profile: EvaluatorProfile.SALUD },
    ];

    expect(() =>
      QuotaEvaluatorValidatorService.validateQuota(validCandidates),
    ).not.toThrow();
  });

  it('should throw error if candidates count is not exactly 4', () => {
    const invalidCandidates = [
      { evaluatorId: 'e1', profile: EvaluatorProfile.JURIDICO },
      { evaluatorId: 'e2', profile: EvaluatorProfile.SOCIEDAD_CIVIL },
      { evaluatorId: 'e3', profile: EvaluatorProfile.METODOLOGICO },
    ];

    expect(() =>
      QuotaEvaluatorValidatorService.validateQuota(invalidCandidates),
    ).toThrow(
      'La cuota de evaluación debe estar integrada por exactamente 4 evaluadores pares.',
    );
  });

  it('should throw error if there are duplicate profiles', () => {
    const duplicateCandidates = [
      { evaluatorId: 'e1', profile: EvaluatorProfile.JURIDICO },
      { evaluatorId: 'e2', profile: EvaluatorProfile.JURIDICO },
      { evaluatorId: 'e3', profile: EvaluatorProfile.METODOLOGICO },
      { evaluatorId: 'e4', profile: EvaluatorProfile.SALUD },
    ];

    expect(() =>
      QuotaEvaluatorValidatorService.validateQuota(duplicateCandidates),
    ).toThrow(
      'La cuota exige exactamente 1 evaluador por cada uno de los 4 perfiles obligatorios: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO y SALUD.',
    );
  });

  it('should throw error if a required profile is missing', () => {
    const missingProfileCandidates = [
      { evaluatorId: 'e1', profile: EvaluatorProfile.JURIDICO },
      { evaluatorId: 'e2', profile: EvaluatorProfile.SOCIEDAD_CIVIL },
      { evaluatorId: 'e3', profile: EvaluatorProfile.METODOLOGICO },
      { evaluatorId: 'e4', profile: EvaluatorProfile.METODOLOGICO },
    ];

    expect(() =>
      QuotaEvaluatorValidatorService.validateQuota(missingProfileCandidates),
    ).toThrow(
      'La cuota exige exactamente 1 evaluador por cada uno de los 4 perfiles obligatorios: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO y SALUD.',
    );
  });
});
