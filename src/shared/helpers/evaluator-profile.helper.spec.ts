import { resolveEvaluatorProfile } from './evaluator-profile.helper';
import { EvaluatorProfile } from '../enums/evaluator-enums';

describe('resolveEvaluatorProfile', () => {
  it('devuelve null para nombre null', () => {
    expect(resolveEvaluatorProfile(null)).toBeNull();
  });

  it('devuelve null para nombre undefined', () => {
    expect(resolveEvaluatorProfile(undefined)).toBeNull();
  });

  it('devuelve null para cadena vacía', () => {
    expect(resolveEvaluatorProfile('')).toBeNull();
  });

  it('reconoce "Jurídico" con tilde → JURIDICO', () => {
    expect(resolveEvaluatorProfile('Jurídico')).toBe(EvaluatorProfile.JURIDICO);
  });

  it('reconoce "JURIDICO" sin tilde → JURIDICO', () => {
    expect(resolveEvaluatorProfile('JURIDICO')).toBe(EvaluatorProfile.JURIDICO);
  });

  it('reconoce "Salud" → SALUD', () => {
    expect(resolveEvaluatorProfile('Salud')).toBe(EvaluatorProfile.SALUD);
  });

  it('reconoce "Metodológico" con tilde → METODOLOGICO', () => {
    expect(resolveEvaluatorProfile('Metodológico')).toBe(
      EvaluatorProfile.METODOLOGICO,
    );
  });

  it('reconoce "Sociedad Civil" con espacio → SOCIEDAD_CIVIL', () => {
    expect(resolveEvaluatorProfile('Sociedad Civil')).toBe(
      EvaluatorProfile.SOCIEDAD_CIVIL,
    );
  });

  it('devuelve null para nombre desconocido', () => {
    expect(resolveEvaluatorProfile('Desconocido')).toBeNull();
  });
});
