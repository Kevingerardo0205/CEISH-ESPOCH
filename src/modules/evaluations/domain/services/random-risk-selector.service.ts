import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { EvaluatorCandidateInput } from './quota-evaluator-validator.service';

export class RandomRiskSelectorService {
  /**
   * Selecciona automáticamente de forma aleatoria a 2 evaluadores para diligenciar el Anexo 10
   * Excluye estrictamente al evaluador con perfil SOCIEDAD_CIVIL [RF-12.2]
   */
  public static selectAnnex10Evaluators<
    T extends string | number = string | number,
  >(candidates: { evaluatorId: T; profile: EvaluatorProfile }[]): T[] {
    const eligibleCandidates = candidates.filter(
      (c) => c.profile !== EvaluatorProfile.SOCIEDAD_CIVIL,
    );

    if (eligibleCandidates.length < 2) {
      throw new Error(
        'No existen suficientes evaluadores aptos para estratificación de riesgo.',
      );
    }

    const shuffled = [...eligibleCandidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return [shuffled[0].evaluatorId, shuffled[1].evaluatorId];
  }
}
