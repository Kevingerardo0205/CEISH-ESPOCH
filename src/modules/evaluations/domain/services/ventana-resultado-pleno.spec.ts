import {
  evaluarVentanaResultadoPleno,
  ventanaResultadoPlenoAbierta,
} from './ventana-resultado-pleno';

/** TSK-015-N25: pruebas de la ventana de registro del resultado del pleno (RF-17.1). */
describe('ventana de resultado del pleno (TSK-015-N25)', () => {
  // 2026-11-26 17:00 en Ecuador (UTC-5) = 22:00 UTC del mismo día.
  const AHORA = new Date('2026-11-26T22:00:00Z');

  it('CANCELADA cierra la ventana aunque la fecha sea pasada', () => {
    expect(
      evaluarVentanaResultadoPleno({
        convocatoriaEstado: 'CANCELADA',
        fechaReunion: new Date('2026-11-20T15:00:00Z'),
        ahora: AHORA,
      }),
    ).toBe('CANCELADA');
  });

  it('sin fecha de reunión cierra la ventana (FECHA_NO_CELEBRADA)', () => {
    expect(
      evaluarVentanaResultadoPleno({
        convocatoriaEstado: 'PROGRAMADA',
        fechaReunion: null,
        ahora: AHORA,
      }),
    ).toBe('FECHA_NO_CELEBRADA');
  });

  it('fecha futura cierra la ventana (FECHA_NO_CELEBRADA)', () => {
    expect(
      evaluarVentanaResultadoPleno({
        convocatoriaEstado: 'PROGRAMADA',
        fechaReunion: new Date('2026-11-27T15:00:00Z'),
        ahora: AHORA,
      }),
    ).toBe('FECHA_NO_CELEBRADA');
  });

  it('la fecha de hoy con hora posterior a la petición sigue abierta', () => {
    // Reunión a las 23:00 ECT del 26 (04:00 UTC del 27) con petición a las 17:00 ECT del 26.
    expect(
      evaluarVentanaResultadoPleno({
        convocatoriaEstado: 'PROGRAMADA',
        fechaReunion: new Date('2026-11-27T04:00:00Z'),
        ahora: AHORA,
      }),
    ).toBeNull();
  });

  it('compara por día de Ecuador, no UTC: reunión del 25 a las 23:30 ECT con petición del 26 a las 00:30 ECT se permite', () => {
    // 25/11 23:30 ECT = 26/11 04:30 UTC; petición 26/11 00:30 ECT = 26/11 05:30 UTC.
    expect(
      ventanaResultadoPlenoAbierta({
        convocatoriaEstado: 'PROGRAMADA',
        fechaReunion: new Date('2026-11-26T04:30:00Z'),
        ahora: new Date('2026-11-26T05:30:00Z'),
      }),
    ).toBe(true);
  });

  it('ventanaResultadoPlenoAbierta es false cuando hay motivo de cierre', () => {
    expect(
      ventanaResultadoPlenoAbierta({
        convocatoriaEstado: 'CANCELADA',
        fechaReunion: new Date('2026-11-20T15:00:00Z'),
        ahora: AHORA,
      }),
    ).toBe(false);
  });
});
