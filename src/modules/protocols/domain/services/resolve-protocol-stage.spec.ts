import { ProtocolStage } from '../enums/protocol-stage.enum';
import {
  resolveProtocolStage,
  StageSourceStatus,
} from './resolve-protocol-stage';

const S = ProtocolStage;

/** Tabla E3 (spec-001 RF-EST.1 v3.5.5), tal como la siembra la migración. */
const CATALOG: Record<number, ProtocolStage | null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
  9: S.RECEPCION,
  10: S.ASIGNACION,
  11: S.RECEPCION,
  12: S.RECEPCION,
  13: S.EVALUACION,
  14: S.RESOLUCION,
  15: S.RECEPCION,
  16: S.EVALUACION,
  17: S.RESOLUCION,
  18: S.RESOLUCION,
  19: S.RESOLUCION,
  20: S.RECEPCION,
  21: S.RECEPCION,
  22: null,
  23: null,
  24: null,
  25: S.RESOLUCION,
  26: null,
  27: null,
};

const status = (id: number): StageSourceStatus => ({
  id,
  stage: CATALOG[id],
});

const EXPECTED_ORDER: Record<ProtocolStage, number> = {
  RECEPCION: 1,
  ASIGNACION: 2,
  EVALUACION: 3,
  RESOLUCION: 4,
  SEGUIMIENTO: 5,
  RENOVACION: 6,
};

describe('resolveProtocolStage (RF-EST.1, TSK-001.2)', () => {
  describe('tabla E3: estado del protocolo sin resolución emitida', () => {
    it.each(Object.entries(CATALOG).map(([id, stage]) => [Number(id), stage]))(
      'estado %i → etapa %s',
      (id, stage) => {
        const result = resolveProtocolStage(status(id), null, false);
        expect(result.stage).toBe(stage);
        expect(result.order).toBe(stage ? EXPECTED_ORDER[stage] : null);
      },
    );
  });

  describe('E2: orden = posición de la etapa', () => {
    it.each([
      [9, 1],
      [10, 2],
      [13, 3],
      [16, 3],
      [14, 4],
      [25, 4],
      [21, 1],
    ])('estado %i → orden %i', (id, order) => {
      expect(resolveProtocolStage(status(id), null, false).order).toBe(order);
    });
  });

  describe('E1: precedencia protocolo → recepción → RECEPCION', () => {
    it('el estado del protocolo manda sobre el de la recepción', () => {
      // APROBADO con resolución + recepción COMPLETO → SEGUIMIENTO, no ASIGNACION
      expect(resolveProtocolStage(status(17), status(10), true)).toEqual({
        stage: S.SEGUIMIENTO,
        order: 5,
      });
      // EN_EVALUACION + recepción COMPLETO → EVALUACION
      expect(resolveProtocolStage(status(13), status(10), false)).toEqual({
        stage: S.EVALUACION,
        order: 3,
      });
      // EN_CONTROL_DOCUMENTAL + recepción EN_REVISION_SECRETARIA → RECEPCION (del protocolo)
      expect(resolveProtocolStage(status(21), status(15), false)).toEqual({
        stage: S.RECEPCION,
        order: 1,
      });
    });

    it('protocolo NULL → etapa del estado de la recepción', () => {
      expect(resolveProtocolStage(null, status(10), false)).toEqual({
        stage: S.ASIGNACION,
        order: 2,
      });
      expect(resolveProtocolStage(undefined, status(9), false)).toEqual({
        stage: S.RECEPCION,
        order: 1,
      });
      expect(resolveProtocolStage(null, status(11), false)).toEqual({
        stage: S.RECEPCION,
        order: 1,
      });
    });

    it('protocolo NULL y sin recepción → RECEPCION', () => {
      expect(resolveProtocolStage(null, null, false)).toEqual({
        stage: S.RECEPCION,
        order: 1,
      });
      expect(resolveProtocolStage(undefined, undefined, false)).toEqual({
        stage: S.RECEPCION,
        order: 1,
      });
    });
  });

  describe('E4: APROBADO según resolución emitida', () => {
    it('APROBADO sin resolución emitida → RESOLUCION (4)', () => {
      expect(resolveProtocolStage(status(17), status(10), false)).toEqual({
        stage: S.RESOLUCION,
        order: 4,
      });
    });

    it('APROBADO con resolución emitida → SEGUIMIENTO (5)', () => {
      expect(resolveProtocolStage(status(17), null, true)).toEqual({
        stage: S.SEGUIMIENTO,
        order: 5,
      });
    });

    it('la resolución emitida no cambia otros estados', () => {
      expect(resolveProtocolStage(status(18), null, true).stage).toBe(
        S.RESOLUCION,
      );
      expect(resolveProtocolStage(status(21), null, true).stage).toBe(
        S.RECEPCION,
      );
      // APROBADO de DOCUMENTO (id 1) no es el APROBADO del protocolo
      expect(resolveProtocolStage(status(1), null, true).stage).toBeNull();
    });
  });
});
