import { EvaluatorProfile } from '../enums/evaluator-enums';

export function resolveEvaluatorProfile(
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
