import { MeetingPlaceFullModel } from '../../domain/entities/meeting.entity';
import { toPlaceDto } from './meeting-place.mapper';

describe('toPlaceDto', () => {
  const base: MeetingPlaceFullModel = {
    id: 'uuid-001',
    name: 'Sala A',
    address: 'Piso 3',
    isVirtual: false,
    meetingLink: null,
    isActive: true,
  };

  it('mapea todas las claves en inglés camelCase', () => {
    const dto = toPlaceDto(base);
    expect(Object.keys(dto)).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'address',
        'isVirtual',
        'meetingLink',
        'isActive',
      ]),
    );
  });

  it('no filtra propiedades ORM (nombre, esVirtual, activo, etc.)', () => {
    const dto = toPlaceDto(base) as unknown as Record<string, unknown>;
    expect(dto).not.toHaveProperty('nombre');
    expect(dto).not.toHaveProperty('esVirtual');
    expect(dto).not.toHaveProperty('activo');
    expect(dto).not.toHaveProperty('direccion');
    expect(dto).not.toHaveProperty('enlaceReunion');
  });

  it('preserva address y meetingLink nulos', () => {
    const dto = toPlaceDto({ ...base, address: null, meetingLink: null });
    expect(dto.address).toBeNull();
    expect(dto.meetingLink).toBeNull();
  });

  it('devuelve isActive=false cuando el lugar está inactivo', () => {
    const dto = toPlaceDto({ ...base, isActive: false });
    expect(dto.isActive).toBe(false);
  });

  it('devuelve isVirtual y meetingLink para lugar virtual', () => {
    const dto = toPlaceDto({
      ...base,
      isVirtual: true,
      meetingLink: 'https://meet.example.com/ceish',
    });
    expect(dto.isVirtual).toBe(true);
    expect(dto.meetingLink).toBe('https://meet.example.com/ceish');
  });
});
