import { evaluarReunionRealizada } from './reunion-realizada';

/** TSK-015-N27-6 (RF-17.2 v1.6.9): reunión realizada, por instante, sin hora ni días. */
describe('evaluarReunionRealizada', () => {
  const AHORA = new Date('2026-11-27T15:00:00.000Z');
  const ABIERTA = 'PROGRAMADA';

  it('reunión futura (un segundo después de ahora) → NO_REALIZADA', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: ABIERTA,
        fechaReunion: new Date('2026-11-27T15:00:01.000Z'),
        ahora: AHORA,
      }),
    ).toBe('NO_REALIZADA');
  });

  it('reunión exactamente en el instante de ahora → realizada (null)', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: ABIERTA,
        fechaReunion: new Date(AHORA.getTime()),
        ahora: AHORA,
      }),
    ).toBeNull();
  });

  it('reunión anterior a ahora (mismo día, horas antes) → realizada (null)', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: ABIERTA,
        fechaReunion: new Date('2026-11-27T10:00:00.000Z'),
        ahora: AHORA,
      }),
    ).toBeNull();
  });

  it('sin fecha de reunión → SIN_FECHA', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: ABIERTA,
        fechaReunion: null,
        ahora: AHORA,
      }),
    ).toBe('SIN_FECHA');
  });

  it('sin hora registrada: `convocatorias.hora` no interviene; decide fecha_reunion', () => {
    // La entrada no lleva hora: una fecha pasada ya cuenta como realizada.
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: ABIERTA,
        fechaReunion: new Date('2026-11-26T05:00:00.000Z'),
        ahora: AHORA,
      }),
    ).toBeNull();
  });

  it('convocatoria cancelada → CANCELADA, aunque la fecha ya haya pasado', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: 'CANCELADA',
        fechaReunion: new Date('2026-11-01T05:00:00.000Z'),
        ahora: AHORA,
      }),
    ).toBe('CANCELADA');
  });

  it('cancelada tiene prioridad sobre sin fecha', () => {
    expect(
      evaluarReunionRealizada({
        convocatoriaEstado: 'CANCELADA',
        fechaReunion: null,
        ahora: AHORA,
      }),
    ).toBe('CANCELADA');
  });
});
