import { ProtocolStage } from '../../../protocols/domain/enums/protocol-stage.enum';
import { IPendingItemsRepository } from '../../domain/ports/pending-items.repository.port';
import {
  DeadlineGroup,
  PendingAction,
  PendingRow,
} from '../../domain/pending-item';
import { PendingItemsService } from './pending-items.service';

// Miércoles 4 nov 2026, 10:00 en Ecuador.
const NOW = new Date('2026-11-04T15:00:00.000Z');

function row(overrides: Partial<PendingRow>): PendingRow {
  return {
    action: PendingAction.VALIDAR,
    protocolId: 1,
    ceishCode: null,
    title: 'ZZ_TEST',
    protocolStatusId: null,
    protocolStatusStage: null,
    receptionStatusId: 15,
    receptionStatusStage: ProtocolStage.RECEPCION,
    resolutionEmitted: false,
    deadline: null,
    ...overrides,
  };
}

const ROWS: PendingRow[] = [
  row({ protocolId: 10, ceishCode: 'B-001', action: PendingAction.VALIDAR }),
  row({
    protocolId: 11,
    ceishCode: 'A-001',
    action: PendingAction.ASIGNAR,
    receptionStatusId: 10,
    receptionStatusStage: ProtocolStage.ASIGNACION,
  }),
  row({
    protocolId: 12,
    ceishCode: 'Z-001',
    action: PendingAction.REASIGNAR,
    protocolStatusId: 13,
    protocolStatusStage: ProtocolStage.EVALUACION,
    receptionStatusId: 10,
    receptionStatusStage: ProtocolStage.ASIGNACION,
    deadline: new Date('2026-10-21T04:59:59.999Z'),
  }),
  row({
    protocolId: 13,
    ceishCode: 'C-001',
    action: PendingAction.REASIGNAR,
    protocolStatusId: 13,
    protocolStatusStage: ProtocolStage.EVALUACION,
    deadline: new Date('2026-11-04T14:00:00.000Z'), // hoy, ya pasó
  }),
  // Plazos futuros: hoy no los produce la consulta, pero el servicio los clasifica.
  row({
    protocolId: 14,
    ceishCode: 'D-001',
    deadline: new Date('2026-11-05T04:00:00.000Z'), // hoy 23:00
  }),
  row({
    protocolId: 15,
    ceishCode: 'E-001',
    deadline: new Date('2026-11-07T15:00:00.000Z'), // sábado
  }),
  row({
    protocolId: 16,
    ceishCode: 'F-001',
    deadline: new Date('2026-11-12T15:00:00.000Z'), // jueves siguiente
  }),
];

function serviceWith(rows: PendingRow[]): PendingItemsService {
  const repo: IPendingItemsRepository = {
    findSnapshot: jest.fn().mockResolvedValue({ now: NOW, rows }),
  };
  return new PendingItemsService(repo);
}

describe('PendingItemsService (spec-003 RF-ALR.f)', () => {
  it('ordena VENCIDO, HOY, SEMANA, PROXIMO, SIN_PLAZO; luego fechaPlazo y ceishCode', async () => {
    const { items } = await serviceWith(ROWS).getPending('todos');
    expect(items.map((i) => [i.protocolId, i.estadoPlazo])).toEqual([
      [12, DeadlineGroup.VENCIDO],
      [13, DeadlineGroup.VENCIDO],
      [14, DeadlineGroup.HOY],
      [15, DeadlineGroup.SEMANA],
      [16, DeadlineGroup.PROXIMO],
      [11, DeadlineGroup.SIN_PLAZO], // A-001 antes que B-001
      [10, DeadlineGroup.SIN_PLAZO],
    ]);
  });

  it('totales no dependen del filtro; todos incluye PROXIMO y SIN_PLAZO', async () => {
    const service = serviceWith(ROWS);
    const expected = { todos: 7, vencidos: 2, hoy: 1, semana: 1 };
    for (const filtro of ['todos', 'vencidos', 'hoy', 'semana'] as const) {
      const { totales } = await service.getPending(filtro);
      expect(totales).toEqual(expected);
    }
  });

  it.each([
    ['vencidos', [12, 13]],
    ['hoy', [14]],
    ['semana', [15]],
  ] as const)('filtro %s → solo ese grupo', async (filtro, ids) => {
    const { items } = await serviceWith(ROWS).getPending(filtro);
    expect(items.map((i) => i.protocolId)).toEqual(ids);
  });

  it('etapa y etapaOrden salen de resolveProtocolStage; textos por acción', async () => {
    const { items } = await serviceWith(ROWS.slice(0, 3)).getPending('todos');
    const byId = Object.fromEntries(items.map((i) => [i.protocolId, i]));
    expect(byId[10]).toMatchObject({
      etapa: 'RECEPCION',
      etapaOrden: 1,
      accion: 'VALIDAR',
      accionTexto: 'Validar documentos',
      estadoActual: 'Recepción por validar',
      fechaPlazo: null,
    });
    expect(byId[11]).toMatchObject({
      etapa: 'ASIGNACION',
      etapaOrden: 2,
      accion: 'ASIGNAR',
      accionTexto: 'Asignar evaluadores',
      estadoActual: 'Recepción completa · sin evaluadores',
    });
    expect(byId[12]).toMatchObject({
      etapa: 'EVALUACION',
      etapaOrden: 3,
      accion: 'REASIGNAR',
      accionTexto: 'Reasignar evaluador',
      estadoActual: 'En evaluación · dictamen vencido',
      fechaPlazo: '2026-10-21T04:59:59.999Z',
    });
  });

  it('fechaReferencia es la fecha de Ecuador de NOW() de la base', async () => {
    const repo: IPendingItemsRepository = {
      findSnapshot: jest.fn().mockResolvedValue({
        now: new Date('2026-11-05T04:30:00.000Z'), // 23:30 del 4 en Ecuador
        rows: [],
      }),
    };
    const result = await new PendingItemsService(repo).getPending();
    expect(result).toEqual({
      fechaReferencia: '2026-11-04',
      totales: { todos: 0, vencidos: 0, hoy: 0, semana: 0 },
      items: [],
    });
  });
});
