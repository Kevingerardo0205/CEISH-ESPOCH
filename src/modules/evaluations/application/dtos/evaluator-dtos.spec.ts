import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AssignEvaluatorsDto,
  LEGACY_EVALUATOR_IDS_MESSAGE,
  ReassignEvaluatorDto,
} from './evaluator-dtos';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';

describe('Evaluator DTOs Validation (TSK-002-09)', () => {
  describe('AssignEvaluatorsDto (TSK-002-N52)', () => {
    const errorsOf = async (payload: Record<string, unknown>) =>
      validate(plainToInstance(AssignEvaluatorsDto, payload));
    const messages = (
      errors: Awaited<ReturnType<typeof validate>>,
      property: string,
    ): string[] =>
      Object.values(
        errors.find((e) => e.property === property)?.constraints ?? {},
      );

    const evaluators = [
      { evaluatorId: 1, profile: EvaluatorProfile.SALUD },
      { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
    ];

    it('N52-D-01: pasa con reviewType y 2 evaluadores (sin protocolId: lo da la ruta)', async () => {
      expect(
        await errorsOf({ reviewType: ReviewType.EXPEDITA, evaluators }),
      ).toHaveLength(0);
    });

    it('N52-D-02: pasa con PLENO, protocolId y más de 4 evaluadores (sin máximo)', async () => {
      const many = [1, 2, 3, 4, 5, 6].map((id) => ({
        evaluatorId: id,
        profile:
          id === 6 ? EvaluatorProfile.SOCIEDAD_CIVIL : EvaluatorProfile.SALUD,
      }));
      expect(
        await errorsOf({
          protocolId: 10,
          reviewType: ReviewType.PLENO,
          evaluators: many,
        }),
      ).toHaveLength(0);
    });

    it('N52-D-03: sin reviewType → error en español', async () => {
      const errors = await errorsOf({ evaluators });
      expect(messages(errors, 'reviewType')).toContain(
        'El tipo de revisión es obligatorio y debe ser EXPEDITA o PLENO.',
      );
    });

    it('N52-D-04: ENSAYO_CLINICO no es opción al asignar (RF-12.REV)', async () => {
      const errors = await errorsOf({
        reviewType: ReviewType.ENSAYO_CLINICO,
        evaluators,
      });
      expect(messages(errors, 'reviewType')).toContain(
        'El tipo de revisión es obligatorio y debe ser EXPEDITA o PLENO.',
      );
    });

    it('N52-D-05: un solo evaluador → error de mínimo 2', async () => {
      const errors = await errorsOf({
        reviewType: ReviewType.EXPEDITA,
        evaluators: [evaluators[1]],
      });
      expect(messages(errors, 'evaluators')).toContain(
        'Se deben asignar al menos 2 evaluadores.',
      );
    });

    it('N52-D-06: el formato antiguo { evaluatorIds } se rechaza con el mensaje en español', async () => {
      const errors = await errorsOf({ evaluatorIds: [1, 2, 3, 4] });
      expect(messages(errors, 'evaluatorIds')).toEqual([
        LEGACY_EVALUATOR_IDS_MESSAGE,
      ]);
    });

    it('N52-D-07: protocolId vacío → error', async () => {
      const errors = await errorsOf({
        protocolId: '',
        reviewType: ReviewType.EXPEDITA,
        evaluators,
      });
      expect(messages(errors, 'protocolId')).toContain(
        'El ID del protocolo es obligatorio.',
      );
    });
  });

  describe('ReassignEvaluatorDto', () => {
    it('should pass validation with valid reassignment payload', async () => {
      const payload = {
        currentAssignmentId: '123e4567-e89b-12d3-a456-426614174000',
        replacementEvaluatorId: '123e4567-e89b-12d3-a456-426614174001',
        replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
        reason: ReassignmentReason.CONFLICTO_INTERES,
        reasonDescription: 'El evaluador es coinvestigador en la publicación.',
      };

      const dto = plainToInstance(ReassignEvaluatorDto, payload);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation if reassignment reason is invalid', async () => {
      const payload = {
        currentAssignmentId: '123e4567-e89b-12d3-a456-426614174000',
        replacementEvaluatorId: '123e4567-e89b-12d3-a456-426614174001',
        replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
        reason: 'INVALID_REASON',
      };

      const dto = plainToInstance(ReassignEvaluatorDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
