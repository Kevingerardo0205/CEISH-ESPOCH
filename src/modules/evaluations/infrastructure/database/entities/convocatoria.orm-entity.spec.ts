import {
  ConvocatoriaOrmEntity,
  SessionType,
  ConvocatoriaStatus,
} from './convocatoria.orm-entity';

describe('ConvocatoriaOrmEntity (T002)', () => {
  it('should instantiate ConvocatoriaOrmEntity with correct properties', () => {
    const entity = new ConvocatoriaOrmEntity();
    entity.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    entity.numeroConvocatoria = '001-2026';
    entity.anioLectivo = 2026;
    entity.tipoSession = SessionType.ORDINARIA;
    entity.fechaReunion = new Date('2026-10-15T09:00:00.000Z');
    entity.fechaEntregaEvaluacion = new Date('2026-10-08T23:59:59.000Z');
    entity.lugarId = 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22';
    entity.estado = ConvocatoriaStatus.PROGRAMADA;
    entity.ordenDiaPdfPath = '/storage/pdf/001-2026.pdf';

    expect(entity.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(entity.numeroConvocatoria).toBe('001-2026');
    expect(entity.anioLectivo).toBe(2026);
    expect(entity.tipoSession).toBe(SessionType.ORDINARIA);
    expect(entity.fechaReunion).toEqual(new Date('2026-10-15T09:00:00.000Z'));
    expect(entity.fechaEntregaEvaluacion).toEqual(
      new Date('2026-10-08T23:59:59.000Z'),
    );
    expect(entity.lugarId).toBe('b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22');
    expect(entity.estado).toBe(ConvocatoriaStatus.PROGRAMADA);
    expect(entity.ordenDiaPdfPath).toBe('/storage/pdf/001-2026.pdf');
  });
});
