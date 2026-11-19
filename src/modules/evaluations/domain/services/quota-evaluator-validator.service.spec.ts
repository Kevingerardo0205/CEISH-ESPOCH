import {
  EvaluatorCompositionError,
  QuotaEvaluatorValidatorService,
} from './quota-evaluator-validator.service';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

const P = EvaluatorProfile;

describe('QuotaEvaluatorValidatorService — composición por tipo de revisión (TSK-002-N52, RF-12.1 a–c)', () => {
  const validate = (
    reviewType: ReviewType.EXPEDITA | ReviewType.PLENO,
    candidates: Array<{ evaluatorId: number; profile: EvaluatorProfile }>,
  ): void =>
    QuotaEvaluatorValidatorService.validateComposition(reviewType, candidates);

  describe('EXPEDITA', () => {
    it('N52-V-01: acepta las 5 filas (Metodológico, Salud, Jurídico, Bioético, Sociedad civil)', () => {
      expect(() =>
        validate(ReviewType.EXPEDITA, [
          { evaluatorId: 1, profile: P.METODOLOGICO },
          { evaluatorId: 2, profile: P.SALUD },
          { evaluatorId: 3, profile: P.JURIDICO },
          { evaluatorId: 4, profile: P.BIOETICO },
          { evaluatorId: 5, profile: P.SOCIEDAD_CIVIL },
        ]),
      ).not.toThrow();
    });

    it('N52-V-02: acepta 2 filas (Sociedad civil + otro perfil)', () => {
      expect(() =>
        validate(ReviewType.EXPEDITA, [
          { evaluatorId: 1, profile: P.SALUD },
          { evaluatorId: 2, profile: P.SOCIEDAD_CIVIL },
        ]),
      ).not.toThrow();
    });

    it('N52-V-03: rechaza dos personas del mismo perfil', () => {
      expect(() =>
        validate(ReviewType.EXPEDITA, [
          { evaluatorId: 1, profile: P.SALUD },
          { evaluatorId: 2, profile: P.SALUD },
          { evaluatorId: 3, profile: P.SOCIEDAD_CIVIL },
        ]),
      ).toThrow(
        'En la revisión expedita solo se asigna una persona por perfil; SALUD está repetido.',
      );
    });
  });

  describe('PLENO', () => {
    it('N52-V-04: acepta varias personas del mismo perfil', () => {
      expect(() =>
        validate(ReviewType.PLENO, [
          { evaluatorId: 1, profile: P.SALUD },
          { evaluatorId: 2, profile: P.SALUD },
          { evaluatorId: 3, profile: P.METODOLOGICO },
          { evaluatorId: 4, profile: P.SOCIEDAD_CIVIL },
        ]),
      ).not.toThrow();
    });

    it('N52-V-05: acepta varias personas de Sociedad civil (o una sola, si se quitan las demás)', () => {
      expect(() =>
        validate(ReviewType.PLENO, [
          { evaluatorId: 1, profile: P.SOCIEDAD_CIVIL },
          { evaluatorId: 2, profile: P.SOCIEDAD_CIVIL },
          { evaluatorId: 3, profile: P.JURIDICO },
        ]),
      ).not.toThrow();
      expect(() =>
        validate(ReviewType.PLENO, [
          { evaluatorId: 1, profile: P.SOCIEDAD_CIVIL },
          { evaluatorId: 3, profile: P.JURIDICO },
        ]),
      ).not.toThrow();
    });
  });

  describe('reglas comunes', () => {
    it.each([ReviewType.EXPEDITA, ReviewType.PLENO] as const)(
      'N52-V-06 (%s): rechaza la asignación sin Sociedad civil',
      (reviewType) => {
        expect(() =>
          validate(reviewType, [
            { evaluatorId: 1, profile: P.SALUD },
            { evaluatorId: 2, profile: P.METODOLOGICO },
          ]),
        ).toThrow(
          'La asignación debe incluir al menos un evaluador de Sociedad civil.',
        );
      },
    );

    it.each([ReviewType.EXPEDITA, ReviewType.PLENO] as const)(
      'N52-V-07 (%s): rechaza menos de 2 evaluadores',
      (reviewType) => {
        expect(() =>
          validate(reviewType, [{ evaluatorId: 1, profile: P.SOCIEDAD_CIVIL }]),
        ).toThrow('Se deben asignar al menos 2 evaluadores.');
      },
    );

    it('N52-V-08: rechaza solo Sociedad civil (nadie define el riesgo)', () => {
      expect(() =>
        validate(ReviewType.PLENO, [
          { evaluatorId: 1, profile: P.SOCIEDAD_CIVIL },
          { evaluatorId: 2, profile: P.SOCIEDAD_CIVIL },
        ]),
      ).toThrow(
        'La asignación debe incluir al menos un evaluador que no sea de Sociedad civil.',
      );
    });

    it('N52-V-09: rechaza a la misma persona dos veces, aunque sea con otro perfil (§11 n.º 5)', () => {
      expect(() =>
        validate(ReviewType.PLENO, [
          { evaluatorId: 7, profile: P.SOCIEDAD_CIVIL },
          { evaluatorId: 7, profile: P.SALUD },
        ]),
      ).toThrow(
        'El evaluador con ID 7 aparece más de una vez; cada persona se asigna con un solo perfil.',
      );
    });

    it('N52-V-10: lanza un error de dominio (EvaluatorCompositionError), no un Error genérico', () => {
      let caught: unknown;
      try {
        validate(ReviewType.EXPEDITA, []);
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(EvaluatorCompositionError);
    });

    it('N52-V-11: rechaza un tipo de revisión distinto de EXPEDITA o PLENO', () => {
      expect(() =>
        QuotaEvaluatorValidatorService.validateComposition(
          ReviewType.ENSAYO_CLINICO as unknown as ReviewType.PLENO,
          [
            { evaluatorId: 1, profile: P.SALUD },
            { evaluatorId: 2, profile: P.SOCIEDAD_CIVIL },
          ],
        ),
      ).toThrow('El tipo de revisión debe ser EXPEDITA o PLENO.');
    });
  });
});
