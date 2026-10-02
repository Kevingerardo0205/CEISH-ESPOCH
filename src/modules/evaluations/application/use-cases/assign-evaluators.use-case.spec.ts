/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call */
import 'reflect-metadata';
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
    // Lunes 2 de marzo de 2026 10:00:00 UTC
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
    // 8 días hábiles desde Mar 2 -> Jueves 12 de marzo a las 23:59:59.999 UTC
    expect(result[0].deadlineDate.toISOString()).toBe('2026-03-12T23:59:59.999Z');
    jest.useRealTimers();
  });

  it('should calculate exactly 15 business days deadline when reviewType is PLENO or omitted', async () => {
    jest.useFakeTimers();
    // Lunes 2 de marzo de 2026 10:00:00 UTC
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
    // 15 días hábiles desde Mar 2 -> Lunes 23 de marzo a las 23:59:59.999 UTC
    expect(result[0].deadlineDate.toISOString()).toBe('2026-03-23T23:59:59.999Z');
    jest.useRealTimers();
  });

  it('should calculate exact deadline when executed on Friday at 20:00 Ecuador time (America/Guayaquil UTC-5)', async () => {
    jest.useFakeTimers();
    // Viernes 6 de marzo de 2026 a las 20:00:00 Ecuador (UTC-5) = Sábado 7 de marzo 01:00:00 UTC
    jest.setSystemTime(new Date('2026-03-06T20:00:00-05:00'));

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
    // Debido a setUTCHours, al ejecutarse a las 20:00 ECT (01:00 UTC del sábado 7), el contador inicia el lunes 9 y suma 8 días hábiles -> Miércoles 18 de marzo 23:59:59.999 UTC
    expect(result[0].deadlineDate.toISOString()).toBe('2026-03-18T23:59:59.999Z');
    jest.useRealTimers();
  });
});
