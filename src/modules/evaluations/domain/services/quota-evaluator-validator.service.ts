import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

export interface EvaluatorCandidateInput {
  evaluatorId: string | number;
  profile: EvaluatorProfile;
}

/** Tipos de revisión con los que la Presidente puede asignar (RF-12.REV). */
export type AssignableReviewType = ReviewType.EXPEDITA | ReviewType.PLENO;

/** Error de dominio de la composición; el caso de uso lo convierte en 400. */
export class EvaluatorCompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluatorCompositionError';
  }
}

/** Perfiles de las filas de la revisión expedita (RF-12.1 a). */
export const EXPEDITED_REVIEW_PROFILES: readonly EvaluatorProfile[] = [
  EvaluatorProfile.METODOLOGICO,
  EvaluatorProfile.SALUD,
  EvaluatorProfile.JURIDICO,
  EvaluatorProfile.BIOETICO,
  EvaluatorProfile.SOCIEDAD_CIVIL,
];

/** Mínimo de evaluadores, sin parámetro (RF-12.1 c). */
export const MIN_ASSIGNED_EVALUATORS = 2;

export class QuotaEvaluatorValidatorService {
  /**
   * Valida la composición de la asignación según el tipo de revisión [RF-12.1 a–c]:
   * - EXPEDITA: solo los perfiles de sus filas y una persona por perfil.
   * - PLENO: cualquier perfil, varias personas por perfil.
   * - En los dos: al menos una persona de Sociedad civil, al menos 2 evaluadores,
   *   al menos uno que no sea Sociedad civil y sin personas repetidas
   *   (cada persona entra con un solo perfil, §11 n.º 5).
   */
  public static validateComposition(
    reviewType: AssignableReviewType,
    candidates: EvaluatorCandidateInput[],
  ): void {
    if (reviewType !== ReviewType.EXPEDITA && reviewType !== ReviewType.PLENO) {
      throw new EvaluatorCompositionError(
        'El tipo de revisión debe ser EXPEDITA o PLENO.',
      );
    }

    if (!candidates || candidates.length < MIN_ASSIGNED_EVALUATORS) {
      throw new EvaluatorCompositionError(
        `Se deben asignar al menos ${MIN_ASSIGNED_EVALUATORS} evaluadores.`,
      );
    }

    const seenEvaluators = new Set<string>();
    for (const candidate of candidates) {
      const key = String(candidate.evaluatorId);
      if (seenEvaluators.has(key)) {
        throw new EvaluatorCompositionError(
          `El evaluador con ID ${key} aparece más de una vez; cada persona se asigna con un solo perfil.`,
        );
      }
      seenEvaluators.add(key);
    }

    const civilSocietyCount = candidates.filter(
      (c) => c.profile === EvaluatorProfile.SOCIEDAD_CIVIL,
    ).length;
    if (civilSocietyCount === 0) {
      throw new EvaluatorCompositionError(
        'La asignación debe incluir al menos un evaluador de Sociedad civil.',
      );
    }
    if (civilSocietyCount === candidates.length) {
      throw new EvaluatorCompositionError(
        'La asignación debe incluir al menos un evaluador que no sea de Sociedad civil.',
      );
    }

    if (reviewType === ReviewType.EXPEDITA) {
      const usedProfiles = new Set<EvaluatorProfile>();
      for (const candidate of candidates) {
        if (!EXPEDITED_REVIEW_PROFILES.includes(candidate.profile)) {
          throw new EvaluatorCompositionError(
            `El perfil ${candidate.profile} no es una fila de la revisión expedita.`,
          );
        }
        if (usedProfiles.has(candidate.profile)) {
          throw new EvaluatorCompositionError(
            `En la revisión expedita solo se asigna una persona por perfil; ${candidate.profile} está repetido.`,
          );
        }
        usedProfiles.add(candidate.profile);
      }
    }
  }
}
