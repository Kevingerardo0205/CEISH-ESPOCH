import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AssignEvaluatorsDto, ReassignEvaluatorDto } from './evaluator-dtos';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';

describe('Evaluator DTOs Validation (TSK-002-09)', () => {
  describe('AssignEvaluatorsDto', () => {
    it('should pass validation with a valid 4-evaluator payload (numeric IDs)', async () => {
      const payload = {
        protocolId: 10,
        evaluators: [
          {
            evaluatorId: 1,
            profile: EvaluatorProfile.JURIDICO,
          },
          {
            evaluatorId: 2,
            profile: EvaluatorProfile.SOCIEDAD_CIVIL,
          },
          {
            evaluatorId: 3,
            profile: EvaluatorProfile.METODOLOGICO,
          },
          {
            evaluatorId: 4,
            profile: EvaluatorProfile.SALUD,
          },
        ],
      };

      const dto = plainToInstance(AssignEvaluatorsDto, payload);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with a valid 4-evaluator payload (string IDs)', async () => {
      const payload = {
        protocolId: '123e4567-e89b-12d3-a456-426614174000',
        evaluators: [
          {
            evaluatorId: '123e4567-e89b-12d3-a456-426614174001',
            profile: EvaluatorProfile.JURIDICO,
          },
          {
            evaluatorId: '123e4567-e89b-12d3-a456-426614174002',
            profile: EvaluatorProfile.SOCIEDAD_CIVIL,
          },
          {
            evaluatorId: '123e4567-e89b-12d3-a456-426614174003',
            profile: EvaluatorProfile.METODOLOGICO,
          },
          {
            evaluatorId: '123e4567-e89b-12d3-a456-426614174004',
            profile: EvaluatorProfile.SALUD,
          },
        ],
      };

      const dto = plainToInstance(AssignEvaluatorsDto, payload);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation if protocolId is missing or empty', async () => {
      const payload = {
        protocolId: '',
        evaluators: [],
      };

      const dto = plainToInstance(AssignEvaluatorsDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'protocolId')).toBe(true);
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
