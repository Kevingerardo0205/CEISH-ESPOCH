import { BadRequestException } from '@nestjs/common';
import { EvaluatorAssignmentAdapterService } from './evaluator-assignment-adapter.service';
import { AssignEvaluatorsUseCase } from '../use-cases/assign-evaluators.use-case';
import { AssignEvaluatorsDto } from '../dtos/evaluator-dtos';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

describe('EvaluatorAssignmentAdapterService (TSK-002-N52)', () => {
  let useCase: { execute: jest.Mock };
  let adapter: EvaluatorAssignmentAdapterService;

  const body: AssignEvaluatorsDto = {
    reviewType: ReviewType.EXPEDITA,
    evaluators: [
      { evaluatorId: 11, profile: EvaluatorProfile.SALUD },
      { evaluatorId: 15, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
    ],
  };

  beforeEach(() => {
    useCase = { execute: jest.fn().mockResolvedValue([]) };
    adapter = new EvaluatorAssignmentAdapterService(
      useCase as unknown as AssignEvaluatorsUseCase,
    );
  });

  it('N52-A-01: delega en el caso de uso con el protocolo de la ruta y quien asigna', async () => {
    await adapter.adaptAndAssign(50, body, 900);
    expect(useCase.execute).toHaveBeenCalledWith({
      protocolId: 50,
      versionId: undefined,
      reviewType: ReviewType.EXPEDITA,
      evaluators: body.evaluators,
      assignedByUserId: 900,
    });
  });

  it('N52-A-02: el mismo protocolId en el cuerpo y en la ruta se acepta', async () => {
    await adapter.adaptAndAssign(50, { ...body, protocolId: '50' }, 900);
    expect(useCase.execute).toHaveBeenCalledTimes(1);
  });

  it('N52-A-03: protocolId del cuerpo distinto al de la ruta → 400', async () => {
    await expect(
      adapter.adaptAndAssign(50, { ...body, protocolId: 51 }, 900),
    ).rejects.toThrow(
      new BadRequestException(
        'El protocolId del cuerpo (51) no coincide con el de la ruta (50).',
      ),
    );
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});
