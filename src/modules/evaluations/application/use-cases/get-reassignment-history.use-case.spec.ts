import { NotFoundException } from '@nestjs/common';
import {
  GetReassignmentHistoryUseCase,
  IHistoryQueryRepository,
  ReassignmentHistoryEntryDto,
} from './get-reassignment-history.use-case';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { ReassignmentHistoryRawRow } from '../../domain/ports/evaluation.repository.port';

function makeRow(
  overrides: Partial<ReassignmentHistoryRawRow> = {},
): ReassignmentHistoryRawRow {
  return {
    id: 1,
    assignmentId: 10,
    previousEvaluatorId: 100,
    previousEvaluatorName: 'Dr. Anterior',
    newEvaluatorId: 200,
    newEvaluatorName: 'Dra. Nueva',
    profileName: 'Jurídico',
    reassignmentReason: 'VENCIMIENTO',
    reasonDescription: 'Plazo vencido',
    executedByUserId: 300,
    executedByUserName: 'Secretaria',
    executedAt: new Date('2026-06-01T10:00:00Z'),
    ...overrides,
  };
}

function makeRepo(
  rows: ReassignmentHistoryRawRow[] = [],
  exists = true,
): IHistoryQueryRepository {
  return {
    findReassignmentHistoryByProtocolId: jest.fn().mockResolvedValue(rows),
    protocolExists: jest.fn().mockResolvedValue(exists),
  };
}

describe('GetReassignmentHistoryUseCase', () => {
  it('devuelve un array vacío cuando el protocolo existe pero no tiene historial', async () => {
    const repo = makeRepo([], true);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const result = await uc.execute(1);
    expect(result).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.protocolExists).toHaveBeenCalledWith(1);
  });

  it('lanza NotFoundException cuando el protocolo no existe', async () => {
    const repo = makeRepo([], false);
    const uc = new GetReassignmentHistoryUseCase(repo);
    await expect(uc.execute(99)).rejects.toThrow(NotFoundException);
    await expect(uc.execute(99)).rejects.toThrow(/protocolo/i);
  });

  it('no consulta protocolExists cuando hay filas (optimización)', async () => {
    const repo = makeRepo([makeRow()]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    await uc.execute(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.protocolExists).not.toHaveBeenCalled();
  });

  it('mapea correctamente los campos de una fila', async () => {
    const row = makeRow({ profileName: 'Jurídico' });
    const repo = makeRepo([row]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const [entry]: ReassignmentHistoryEntryDto[] = await uc.execute(1);

    expect(entry.id).toBe(1);
    expect(entry.assignmentId).toBe(10);
    expect(entry.previousEvaluatorId).toBe(100);
    expect(entry.previousEvaluatorName).toBe('Dr. Anterior');
    expect(entry.newEvaluatorId).toBe(200);
    expect(entry.newEvaluatorName).toBe('Dra. Nueva');
    expect(entry.evaluatorProfile).toBe(EvaluatorProfile.JURIDICO);
    expect(entry.reassignmentReason).toBe(ReassignmentReason.VENCIMIENTO);
    expect(entry.reasonDescription).toBe('Plazo vencido');
    expect(entry.executedByUserId).toBe(300);
    expect(entry.executedByUserName).toBe('Secretaria');
    expect(entry.executedAt).toBe('2026-06-01T10:00:00.000Z');
  });

  it('normaliza todos los perfiles del catálogo correctamente', async () => {
    const profiles: Array<[string, EvaluatorProfile]> = [
      ['Salud', EvaluatorProfile.SALUD],
      ['Metodológico', EvaluatorProfile.METODOLOGICO],
      ['Sociedad Civil', EvaluatorProfile.SOCIEDAD_CIVIL],
      ['Jurídico', EvaluatorProfile.JURIDICO],
      ['JURIDICO', EvaluatorProfile.JURIDICO],
      ['SALUD', EvaluatorProfile.SALUD],
    ];
    for (const [name, expected] of profiles) {
      const repo = makeRepo([makeRow({ profileName: name })]);
      const uc = new GetReassignmentHistoryUseCase(repo);
      const [entry] = await uc.execute(1);
      expect(entry.evaluatorProfile).toBe(expected);
    }
  });

  it('mapea reasonDescription a cadena vacía cuando la BD devuelve null', async () => {
    const repo = makeRepo([makeRow({ reasonDescription: null })]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const [entry] = await uc.execute(1);
    expect(entry.reasonDescription).toBe('');
  });

  it('mapea executedByUserName a undefined cuando la BD devuelve null', async () => {
    const repo = makeRepo([makeRow({ executedByUserName: null })]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const [entry] = await uc.execute(1);
    expect(entry.executedByUserName).toBeUndefined();
  });

  it('lanza NotFoundException cuando el profileName es nulo en el historial', async () => {
    const repo = makeRepo([makeRow({ profileName: null })]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    await expect(uc.execute(1)).rejects.toThrow(NotFoundException);
  });

  it('convierte executedAt como string ISO cuando no es instancia de Date', async () => {
    const dateStr = '2026-08-15T12:00:00.000Z';
    const repo = makeRepo([
      makeRow({ executedAt: dateStr as unknown as Date }),
    ]);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const [entry] = await uc.execute(1);
    expect(entry.executedAt).toBe(dateStr);
  });

  it('devuelve múltiples entradas preservando el orden devuelto por el repositorio', async () => {
    const rows = [
      makeRow({
        id: 2,
        assignmentId: 20,
        reassignmentReason: 'CONFLICTO_INTERES',
      }),
      makeRow({ id: 1, assignmentId: 10, reassignmentReason: 'VENCIMIENTO' }),
    ];
    const repo = makeRepo(rows);
    const uc = new GetReassignmentHistoryUseCase(repo);
    const result = await uc.execute(1);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(1);
  });
});
