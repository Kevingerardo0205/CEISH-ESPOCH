/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call */
import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignEvaluatorsUseCase } from './assign-evaluators.use-case';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignEvaluatorsDto } from '../dtos/evaluator-dtos';

describe('AssignEvaluatorsUseCase (TSK-002-09)', () => {
  let repositoryMock: any;
  let eventEmitterMock: any;
  let useCase: AssignEvaluatorsUseCase;

  beforeEach(() => {
    repositoryMock = {
      saveAssignments: jest
        .fn()
        .mockImplementation(async (entities) => entities),
    };
    eventEmitterMock = {
      emit: jest.fn(),
    };
    useCase = new AssignEvaluatorsUseCase(repositoryMock, eventEmitterMock);
  });

  it('should successfully validate quota, pick 2 Annex 10 randomly, save 4 assignments (numeric IDs) and emit email notification events', async () => {
    const dto: AssignEvaluatorsDto = {
      protocolId: 10,
      versionId: 2,
      evaluators: [
        {
          evaluatorId: 101,
          profile: EvaluatorProfile.JURIDICO,
        },
        {
          evaluatorId: 102,
          profile: EvaluatorProfile.SOCIEDAD_CIVIL,
        },
        {
          evaluatorId: 103,
          profile: EvaluatorProfile.METODOLOGICO,
        },
        {
          evaluatorId: 104,
          profile: EvaluatorProfile.SALUD,
        },
      ],
    };

    const savedEntities = await useCase.execute(dto, 15, []);

    // 1. Guarda exactamente 4 asignaciones en el repositorio
    expect(repositoryMock.saveAssignments).toHaveBeenCalledTimes(1);
    expect(savedEntities).toHaveLength(4);

    // 2. Exactamente 2 tienen la bandera isAssignedForAnnex10 = true
    const annex10Count = savedEntities.filter(
      (e) => e.isAssignedForAnnex10,
    ).length;
    expect(annex10Count).toBe(2);

    // 3. El de SOCIEDAD_CIVIL nunca tiene la bandera isAssignedForAnnex10
    const sociedadCivilEntity = savedEntities.find(
      (e) => e.evaluatorProfile === EvaluatorProfile.SOCIEDAD_CIVIL,
    );
    expect(sociedadCivilEntity?.isAssignedForAnnex10).toBe(false);

    // 4. Dispara el evento de notificación para cada evaluador
    expect(eventEmitterMock.emit).toHaveBeenCalledWith(
      'evaluator.assigned',
      expect.anything(),
    );
  });

  it('should support persisting via saveAssignmentsTransaction', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest
        .fn()
        .mockImplementation(async (payloads) =>
          payloads.map((p: any, idx: number) => ({
            id: idx + 1,
            versionId: p.versionId,
            evaluatorId: p.evaluatorId,
            isAssignedForAnnex10: p.isAssignedForAnnex10,
            deadline: p.deadline,
            statusId: p.statusId,
          })),
        ),
      findVersionById: jest.fn().mockResolvedValue({ id: 1, protocolId: 25 }),
    };

    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );

    const dto: AssignEvaluatorsDto = {
      protocolId: 25,
      versionId: 1,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await transactionalUseCase.execute(dto, 15, []);

    expect(
      transactionRepoMock.saveAssignmentsTransaction,
    ).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe(1);
  });

  it('should calculate exactly 8 business days deadline when reviewType is EXPEDITA (crossing weekend)', async () => {
    jest.useFakeTimers();
    // Lunes 2 de marzo de 2026 10:00:00 UTC (05:00 ECT)
    jest.setSystemTime(new Date('2026-03-02T10:00:00.000Z'));

    const dto: AssignEvaluatorsDto = {
      protocolId: 50,
      versionId: 1,
      reviewType: 'EXPEDITA' as any,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await useCase.execute(dto);
    expect(result).toHaveLength(4);
    // 8 días hábiles desde Mar 2 -> Jueves 12 de marzo (2026-03-12)
    expect(result[0].deadlineDate).toBe('2026-03-12');
    jest.useRealTimers();
  });

  it('should calculate exactly 15 business days deadline when reviewType is PLENO or omitted', async () => {
    jest.useFakeTimers();
    // Lunes 2 de marzo de 2026 10:00:00 UTC (05:00 ECT)
    jest.setSystemTime(new Date('2026-03-02T10:00:00.000Z'));

    const dto: AssignEvaluatorsDto = {
      protocolId: 51,
      versionId: 1,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await useCase.execute(dto);
    expect(result).toHaveLength(4);
    // 15 días hábiles desde Mar 2 -> Lunes 23 de marzo (2026-03-23)
    expect(result[0].deadlineDate).toBe('2026-03-23');
    jest.useRealTimers();
  });

  it('should calculate exact deadline when executed on Thursday at 20:00 Ecuador time (America/Guayaquil UTC-5)', async () => {
    jest.useFakeTimers();
    // Jueves 5 de marzo de 2026 a las 20:00:00 Ecuador (UTC-5)
    jest.setSystemTime(new Date('2026-03-05T20:00:00-05:00'));

    const dto: AssignEvaluatorsDto = {
      protocolId: 52,
      versionId: 1,
      reviewType: 'EXPEDITA' as any,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await useCase.execute(dto);
    expect(result).toHaveLength(4);
    // 8 días hábiles desde Jueves 5 -> Martes 17 de marzo (2026-03-17)
    expect(result[0].deadlineDate).toBe('2026-03-17');
    jest.useRealTimers();
  });

  it('should calculate exact deadline when executed on Friday at 20:00 Ecuador time (America/Guayaquil UTC-5)', async () => {
    jest.useFakeTimers();
    // Viernes 6 de marzo de 2026 a las 20:00:00 Ecuador (UTC-5)
    jest.setSystemTime(new Date('2026-03-06T20:00:00-05:00'));

    const dto: AssignEvaluatorsDto = {
      protocolId: 53,
      versionId: 1,
      reviewType: 'EXPEDITA' as any,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await useCase.execute(dto);
    expect(result).toHaveLength(4);
    // 8 días hábiles desde Viernes 6 -> Miércoles 18 de marzo (2026-03-18)
    expect(result[0].deadlineDate).toBe('2026-03-18');
    jest.useRealTimers();
  });

  it('should resolve versionId via findVersionByProtocolId when dto.versionId is absent', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest
        .fn()
        .mockImplementation(async (payloads: any[]) =>
          payloads.map((p, idx) => ({
            id: idx + 1,
            versionId: p.versionId,
            evaluatorId: p.evaluatorId,
            isAssignedForAnnex10: p.isAssignedForAnnex10,
            deadline: p.deadline,
            statusId: p.statusId,
          })),
        ),
      findVersionByProtocolId: jest
        .fn()
        .mockResolvedValue({ id: 42, protocolId: 25 }),
    };

    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );

    const dto = {
      protocolId: 25,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const result = await transactionalUseCase.execute(dto, 15, []);

    expect(transactionRepoMock.findVersionByProtocolId).toHaveBeenCalledWith(25);
    expect(result).toHaveLength(4);
    const callPayloads =
      transactionRepoMock.saveAssignmentsTransaction.mock.calls[0][0] as any[];
    expect(callPayloads[0].versionId).toBe(42);
  });

  it('should throw BadRequestException when findVersionByProtocolId returns null (no resolvable version)', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionByProtocolId: jest.fn().mockResolvedValue(null),
    };

    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );

    const dto = {
      protocolId: 99,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when explicit versionId does not exist in the repository', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionById: jest.fn().mockResolvedValue(null),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: 25,
      versionId: 9999,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when versionId belongs to a different protocol', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionById: jest.fn().mockResolvedValue({ id: 5, protocolId: 99 }),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: 25,
      versionId: 5,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when protocolId is a non-numeric string ("abc")', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionByProtocolId: jest.fn(),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: 'abc',
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when protocolId is a mixed string ("12abc")', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionByProtocolId: jest.fn(),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: '12abc',
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when an evaluatorId is a non-numeric string ("abc")', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionByProtocolId: jest
        .fn()
        .mockResolvedValue({ id: 42, protocolId: 25 }),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: 25,
      evaluators: [
        { evaluatorId: 'abc', profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(transactionRepoMock.saveAssignmentsTransaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when ORM returns an evaluatorId not present in the profile map', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest
        .fn()
        .mockImplementation(async (payloads: any[]) =>
          payloads.map((p, idx) => ({
            id: idx + 1,
            versionId: p.versionId,
            evaluatorId: 9999, // unexpected id — not in dto.evaluators
            isAssignedForAnnex10: p.isAssignedForAnnex10,
            deadline: p.deadline,
            statusId: p.statusId,
          })),
        ),
      findVersionByProtocolId: jest
        .fn()
        .mockResolvedValue({ id: 42, protocolId: 25 }),
    };
    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );
    const dto = {
      protocolId: 25,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };
    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should propagate NotFoundException thrown by findVersionByProtocolId when protocol does not exist', async () => {
    const transactionRepoMock = {
      saveAssignmentsTransaction: jest.fn(),
      findVersionByProtocolId: jest
        .fn()
        .mockRejectedValue(
          new NotFoundException('Protocolo con ID 999 no encontrado'),
        ),
    };

    const transactionalUseCase = new AssignEvaluatorsUseCase(
      transactionRepoMock,
      eventEmitterMock,
    );

    const dto = {
      protocolId: 999,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    await expect(transactionalUseCase.execute(dto)).rejects.toThrow(
      NotFoundException,
    );
  });
});
