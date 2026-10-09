import { LugarOrmEntity } from './lugar.orm-entity';

describe('LugarOrmEntity (T004)', () => {
  it('should instantiate LugarOrmEntity with correct properties', () => {
    const entity = new LugarOrmEntity();
    entity.id = 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22';
    entity.nombre = 'Sala de Sesiones CEISH - Edificio Central ESPOCH';
    entity.direccion = 'Panamericana Sur Km 1 1/2, Riobamba';
    entity.esVirtual = false;
    entity.enlaceReunion = 'https://zoom.us/j/123456789';
    entity.activo = true;

    expect(entity.id).toBe('b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22');
    expect(entity.nombre).toBe(
      'Sala de Sesiones CEISH - Edificio Central ESPOCH',
    );
    expect(entity.direccion).toBe('Panamericana Sur Km 1 1/2, Riobamba');
    expect(entity.esVirtual).toBe(false);
    expect(entity.enlaceReunion).toBe('https://zoom.us/j/123456789');
    expect(entity.activo).toBe(true);
  });
});
