import { SecuenciaConvocatoriaOrmEntity } from './secuencia-convocatoria.orm-entity';

describe('SecuenciaConvocatoriaOrmEntity', () => {
  it('should instantiate correctly with anioLectivo and ultimoSecuencial', () => {
    const entity = new SecuenciaConvocatoriaOrmEntity();
    entity.anioLectivo = 2026;
    entity.ultimoSecuencial = 9;
    const now = new Date();
    entity.updatedAt = now;

    expect(entity.anioLectivo).toBe(2026);
    expect(entity.ultimoSecuencial).toBe(9);
    expect(entity.updatedAt).toEqual(now);
  });
});
