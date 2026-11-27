import { AssignmentStatus } from '../enums/assignment-status.enum';
import { EvaluatorDictamen } from '../enums/evaluator-dictamen.enum';
import {
  AsignacionParaResultado,
  calcularResultadoPleno,
} from './calcular-resultado-pleno';

const COMPLETA = AssignmentStatus.COMPLETED;
const A = EvaluatorDictamen.APROBADO;
const C = EvaluatorDictamen.APROBADO_CON_OBSERVACIONES;
const R = EvaluatorDictamen.RECHAZADO;

/** n asignaciones completadas con el dictamen dado. */
function completas(n: number, resultadoId: number): AsignacionParaResultado[] {
  return Array.from({ length: n }, () => ({ estadoId: COMPLETA, resultadoId }));
}

describe('calcularResultadoPleno (TSK-015-N27-3, RF-17.1 v1.6.8)', () => {
  it('todos 1 → APROBADO_DEFINITIVO', () => {
    const r = calcularResultadoPleno(completas(3, A));
    expect(r.estado).toBe('CALCULADO');
    expect(r.resultado).toBe('APROBADO_DEFINITIVO');
  });

  it('todos 3 → NO_APROBADO', () => {
    const r = calcularResultadoPleno(completas(3, R));
    expect(r.estado).toBe('CALCULADO');
    expect(r.resultado).toBe('NO_APROBADO');
  });

  it('todos 2 → APROBADO_CON_CONDICION (regla de cualquier otro caso)', () => {
    const r = calcularResultadoPleno(completas(2, C));
    expect(r.estado).toBe('CALCULADO');
    expect(r.resultado).toBe('APROBADO_CON_CONDICION');
  });

  it('3x1 + 1x2 → APROBADO_CON_CONDICION', () => {
    const r = calcularResultadoPleno([...completas(3, A), ...completas(1, C)]);
    expect(r.resultado).toBe('APROBADO_CON_CONDICION');
  });

  it('3x1 + 1x3 → APROBADO_CON_CONDICION (mezcla, no NO_APROBADO)', () => {
    const r = calcularResultadoPleno([...completas(3, A), ...completas(1, R)]);
    expect(r.resultado).toBe('APROBADO_CON_CONDICION');
    expect(r.resumen).toEqual({
      aprobado: 3,
      conCondicion: 0,
      noAprobado: 1,
      pendientes: 0,
    });
  });

  it('3x3 + 1x1 → APROBADO_CON_CONDICION (mezcla, no NO_APROBADO)', () => {
    const r = calcularResultadoPleno([...completas(3, R), ...completas(1, A)]);
    expect(r.resultado).toBe('APROBADO_CON_CONDICION');
  });

  it('lista vacía → PENDIENTE', () => {
    const r = calcularResultadoPleno([]);
    expect(r).toEqual({
      estado: 'PENDIENTE',
      resultado: null,
      resumen: { aprobado: 0, conCondicion: 0, noAprobado: 0, pendientes: 0 },
    });
  });

  it('alguna completada sin resultado_id → PENDIENTE', () => {
    const r = calcularResultadoPleno([
      ...completas(2, A),
      { estadoId: COMPLETA, resultadoId: null },
    ]);
    expect(r.estado).toBe('PENDIENTE');
    expect(r.resultado).toBeNull();
    expect(r.resumen.pendientes).toBe(1);
  });

  it('valor de resultado_id fuera de 1/2/3 → PENDIENTE', () => {
    const r = calcularResultadoPleno([{ estadoId: COMPLETA, resultadoId: 9 }]);
    expect(r.estado).toBe('PENDIENTE');
  });

  it('alguna activa no completada (6, asignada) → PENDIENTE aunque las demás tengan dictamen', () => {
    const r = calcularResultadoPleno([
      ...completas(2, A),
      { estadoId: AssignmentStatus.ASSIGNED, resultadoId: null },
    ]);
    expect(r.estado).toBe('PENDIENTE');
    expect(r.resumen.pendientes).toBe(1);
  });

  it('sugerida (5) cuenta como activa y bloquea → PENDIENTE', () => {
    const r = calcularResultadoPleno([
      ...completas(2, A),
      { estadoId: AssignmentStatus.SUGGESTED, resultadoId: null },
    ]);
    expect(r.estado).toBe('PENDIENTE');
    expect(r.resumen.pendientes).toBe(1);
  });

  it('reasignadas (26, 27) y archivadas (8) se ignoran', () => {
    const r = calcularResultadoPleno([
      ...completas(3, A),
      { estadoId: AssignmentStatus.REASIGNED_VENCIMIENTO, resultadoId: R },
      { estadoId: AssignmentStatus.REASIGNED_COI, resultadoId: null },
      { estadoId: AssignmentStatus.ARCHIVED, resultadoId: null },
    ]);
    expect(r.estado).toBe('CALCULADO');
    expect(r.resultado).toBe('APROBADO_DEFINITIVO');
    expect(r.resumen).toEqual({
      aprobado: 3,
      conCondicion: 0,
      noAprobado: 0,
      pendientes: 0,
    });
  });

  it('solo reasignadas → PENDIENTE (no hay activas)', () => {
    const r = calcularResultadoPleno([
      { estadoId: AssignmentStatus.REASIGNED_COI, resultadoId: R },
    ]);
    expect(r.estado).toBe('PENDIENTE');
  });

  it('el resumen cuenta por dictamen sin identidad de evaluador', () => {
    const r = calcularResultadoPleno([
      ...completas(1, A),
      ...completas(2, C),
      ...completas(1, R),
    ]);
    expect(r.resumen).toEqual({
      aprobado: 1,
      conCondicion: 2,
      noAprobado: 1,
      pendientes: 0,
    });
    expect(Object.keys(r.resumen).sort()).toEqual(
      ['aprobado', 'conCondicion', 'noAprobado', 'pendientes'].sort(),
    );
  });
});
