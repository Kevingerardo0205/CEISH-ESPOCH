/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ResolutionsService, canReadResolution } from './resolutions.service';

/**
 * TSK-015-N17 (RF-17.6): regla de lectura de GET /resolutions/protocol/:id.
 * Pruebas unitarias con mocks; el comportamiento HTTP está en test/resolutions-permisos.e2e-spec.ts.
 */
describe('TSK-015-N17 — canReadResolution', () => {
  it('el investigador principal puede leer', () => {
    expect(canReadResolution(7, { id: 7, permissions: [] })).toBe(true);
  });

  it('quien tiene RESOLUCION_HISTORIAL puede leer aunque no sea el principal', () => {
    expect(
      canReadResolution(7, { id: 9, permissions: ['RESOLUCION_HISTORIAL'] }),
    ).toBe(true);
  });

  it('otro investigador sin permiso no puede leer', () => {
    expect(canReadResolution(7, { id: 9, permissions: [] })).toBe(false);
  });

  it('un evaluador sin RESOLUCION_HISTORIAL no puede leer', () => {
    expect(
      canReadResolution(7, { id: 9, permissions: ['EVALUACION_PLENO'] }),
    ).toBe(false);
  });

  it('sin permisos en el token no hay lectura por permiso', () => {
    expect(canReadResolution(7, { id: 9 })).toBe(false);
  });

  it('un protocolo sin investigador principal no concede lectura por identidad', () => {
    expect(canReadResolution(null, { id: 0, permissions: [] })).toBe(false);
    expect(canReadResolution(undefined, { id: 0, permissions: [] })).toBe(
      false,
    );
  });
});

describe('TSK-015-N17 — ResolutionsService.findByProtocolIdForReader', () => {
  const filas = [{ id: 1, protocolId: 7 }];
  let protocolRepository: { findById: jest.Mock };
  let resolutionRepo: { find: jest.Mock };
  let service: ResolutionsService;

  beforeEach(() => {
    protocolRepository = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 7, principalInvestigatorId: 7 }),
    };
    resolutionRepo = { find: jest.fn().mockResolvedValue(filas) };
    service = new ResolutionsService(
      resolutionRepo as any,
      protocolRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('devuelve el mismo array al investigador principal', async () => {
    const res = await service.findByProtocolIdForReader(7, {
      id: 7,
      permissions: [],
    });
    expect(res).toEqual(filas);
    expect(resolutionRepo.find).toHaveBeenCalledWith({
      where: { protocolId: 7 },
      relations: ['protocol', 'version'],
    });
  });

  it('404 «Protocolo no encontrado.» a otro investigador, sin consultar resoluciones', async () => {
    await expect(
      service.findByProtocolIdForReader(7, { id: 9, permissions: [] }),
    ).rejects.toThrow(new NotFoundException('Protocolo no encontrado.'));
    expect(resolutionRepo.find).not.toHaveBeenCalled();
  });

  it('404 igual para un protocolo inexistente', async () => {
    protocolRepository.findById.mockResolvedValue(null);
    await expect(
      service.findByProtocolIdForReader(999, {
        id: 7,
        permissions: ['RESOLUCION_HISTORIAL'],
      }),
    ).rejects.toThrow(new NotFoundException('Protocolo no encontrado.'));
  });

  it('400 en español si el id no es un entero positivo', async () => {
    await expect(
      service.findByProtocolIdForReader(NaN, { id: 7, permissions: [] }),
    ).rejects.toThrow(new BadRequestException('ID de protocolo inválido'));
    await expect(
      service.findByProtocolIdForReader(-1, { id: 7, permissions: [] }),
    ).rejects.toThrow(BadRequestException);
    expect(protocolRepository.findById).not.toHaveBeenCalled();
  });
});
