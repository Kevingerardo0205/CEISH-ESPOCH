import { PLAZO_RESOLUCION_FIRMADA_HORAS } from './deadline-rules';

/** TSK-015-N15 — RF-17.3 (spec-003 v1.6.5): plazo de 96 horas corridas para subir la carta firmada. */
describe('TSK-015-N15 — PLAZO_RESOLUCION_FIRMADA_HORAS', () => {
  it('vale 96 horas corridas', () => {
    expect(PLAZO_RESOLUCION_FIRMADA_HORAS).toBe(96);
  });
});
