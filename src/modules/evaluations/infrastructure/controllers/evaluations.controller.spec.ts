/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { EvaluationsController } from './evaluations.controller';

function makeController(reassignExecute: jest.Mock): EvaluationsController {
  return new EvaluationsController(
    {} as any, // evaluationsService
    {} as any, // consolidationService
    {} as any, // assignEvaluatorsUseCase
    { execute: reassignExecute } as any, // reassignEvaluatorUseCase
    {} as any, // submitEvaluationUseCase
    {} as any, // assignmentAdapterService
    {} as any, // getReassignmentHistoryUseCase
    {} as any, // getActiveAssignmentsUseCase
  );
}

describe('EvaluationsController.reassignEvaluator (TSK-002-N11)', () => {
  let reassignMock: jest.Mock;
  let controller: EvaluationsController;

  beforeEach(() => {
    reassignMock = jest.fn().mockResolvedValue({ success: true });
    controller = makeController(reassignMock);
  });

  it('N11-U-01: req.user undefined → lanza UnauthorizedException sin llamar al caso de uso', async () => {
    await expect(
      controller.reassignEvaluator({} as any, { user: undefined } as any),
    ).rejects.toThrow(UnauthorizedException);

    expect(reassignMock).not.toHaveBeenCalled();
  });

  it('N11-U-02: req.user.id null → lanza UnauthorizedException sin llamar al caso de uso', async () => {
    await expect(
      controller.reassignEvaluator({} as any, { user: { id: null } } as any),
    ).rejects.toThrow(UnauthorizedException);

    expect(reassignMock).not.toHaveBeenCalled();
  });

  it('N11-U-03: req.user.id válido (número) → invoca el caso de uso con ese id exacto', async () => {
    const result = await controller.reassignEvaluator(
      {} as any,
      { user: { id: 42 } } as any,
    );

    expect(reassignMock).toHaveBeenCalledTimes(1);
    const [, adminUserId] = reassignMock.mock.calls[0] as [unknown, number];
    expect(adminUserId).toBe(42);
    expect(result).toEqual({ success: true });
  });
});
