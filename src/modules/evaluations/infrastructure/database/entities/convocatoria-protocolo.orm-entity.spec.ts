import { ConvocatoriaProtocoloOrmEntity } from './convocatoria-protocolo.orm-entity';
import { AgendaItemType } from '../../../../../shared/enums/agenda-section.enum';

describe('ConvocatoriaProtocoloOrmEntity (T003)', () => {
  it('should instantiate ConvocatoriaProtocoloOrmEntity with correct properties for evaluation item', () => {
    const entity = new ConvocatoriaProtocoloOrmEntity();
    entity.id = 'b2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    entity.convocatoriaId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    entity.tipoPuntoAgenda = AgendaItemType.EVALUACION_INICIAL;
    entity.protocoloId = 165;
    entity.versionId = 137;
    entity.orden = 1;
    entity.fechaPlazoNormativo = new Date('2026-10-20T17:00:00.000Z');
    entity.dictamenResultado = 'APROBADO';

    expect(entity.id).toBe('b2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22');
    expect(entity.convocatoriaId).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(entity.tipoPuntoAgenda).toBe(AgendaItemType.EVALUACION_INICIAL);
    expect(entity.protocoloId).toBe(165);
    expect(entity.versionId).toBe(137);
    expect(entity.orden).toBe(1);
    expect(entity.fechaPlazoNormativo).toEqual(
      new Date('2026-10-20T17:00:00.000Z'),
    );
    expect(entity.dictamenResultado).toBe('APROBADO');
  });

  it('should instantiate ConvocatoriaProtocoloOrmEntity for follow-up report item', () => {
    const entity = new ConvocatoriaProtocoloOrmEntity();
    entity.id = 'c3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    entity.convocatoriaId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    entity.tipoPuntoAgenda = AgendaItemType.INFORME_AVANCE;
    entity.informeSeguimientoId = 42;
    entity.orden = 2;

    expect(entity.tipoPuntoAgenda).toBe(AgendaItemType.INFORME_AVANCE);
    expect(entity.informeSeguimientoId).toBe(42);
    expect(entity.protocoloId).toBeUndefined();
    expect(entity.versionId).toBeUndefined();
    expect(entity.orden).toBe(2);
  });
});
