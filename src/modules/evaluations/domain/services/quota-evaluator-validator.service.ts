import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';

export interface EvaluatorCandidateInput {
  evaluatorId: string | number;
  profile: EvaluatorProfile;
}

export class QuotaEvaluatorValidatorService {
  /**
   * Valida que la lista de candidatos a evaluadores cumpla estrictamente
   * la cuota de 4 miembros: 1 JURIDICO, 1 SOCIEDAD_CIVIL, 1 METODOLOGICO y 1 SALUD.
   * [RF-12.1]
   */
  public static validateQuota(candidates: EvaluatorCandidateInput[]): void {
    if (!candidates || candidates.length !== 4) {
      throw new Error(
        'La cuota de evaluación debe estar integrada por exactamente 4 evaluadores pares.',
      );
    }

    const profilesSet = new Set<EvaluatorProfile>(
      candidates.map((candidate) => candidate.profile),
    );

    const requiredProfiles: EvaluatorProfile[] = [
      EvaluatorProfile.JURIDICO,
      EvaluatorProfile.SOCIEDAD_CIVIL,
      EvaluatorProfile.METODOLOGICO,
      EvaluatorProfile.SALUD,
    ];

    const hasAllProfiles = requiredProfiles.every((profile) =>
      profilesSet.has(profile),
    );

    if (profilesSet.size !== 4 || !hasAllProfiles) {
      throw new Error(
        'La cuota exige exactamente 1 evaluador por cada uno de los 4 perfiles obligatorios: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO y SALUD.',
      );
    }
  }
}
