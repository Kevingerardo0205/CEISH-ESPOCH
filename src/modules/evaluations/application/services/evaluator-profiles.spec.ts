import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EvaluationsService } from './evaluations.service';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';

/** Error de unicidad de Postgres tal como lo entrega TypeORM (QueryFailedError con code 23505). */
function uniqueViolation(): QueryFailedError {
  return new QueryFailedError('UPDATE ...', [], {
    code: '23505',
    message:
      'duplicate key value violates unique constraint "perfiles_evaluador_nombre_key"',
  } as unknown as Error);
}

describe('EvaluationsService — perfiles de evaluador (TSK-001.16)', () => {
  const current: EvaluatorProfileOrmEntity = {
    id: 9,
    name: 'Perfil inventado',
    description: 'Descripción inventada',
    priorityOrder: 4,
    isActive: true,
  };
  let repo: {
    saveProfile: jest.Mock;
    updateProfile: jest.Mock;
    findProfileById: jest.Mock;
  };
  let service: EvaluationsService;

  beforeEach(() => {
    repo = {
      saveProfile: jest
        .fn()
        .mockImplementation((p: Partial<EvaluatorProfileOrmEntity>) =>
          Promise.resolve({ id: 10, ...p }),
        ),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      findProfileById: jest.fn().mockResolvedValue(current),
    };
    // Solo createProfile y updateProfile: usan únicamente el repositorio de evaluaciones.
    const unused = undefined as never;
    service = new EvaluationsService(
      repo as unknown as IEvaluationRepository,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
    );
  });

  describe('createProfile', () => {
    it('guarda name, description y priorityOrder desde nombre, descripcion y ordenPrioridad', async () => {
      const saved = await service.createProfile({
        nombre: 'Perfil nuevo',
        descripcion: 'Texto',
        ordenPrioridad: 2,
      });
      expect(repo.saveProfile).toHaveBeenCalledWith({
        name: 'Perfil nuevo',
        description: 'Texto',
        priorityOrder: 2,
        isActive: true,
      });
      expect(saved.id).toBe(10);
    });

    it('sin ordenPrioridad guarda priorityOrder 0', async () => {
      await service.createProfile({ nombre: 'Perfil nuevo' });
      expect(repo.saveProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Perfil nuevo', priorityOrder: 0 }),
      );
    });

    it('un nombre duplicado (23505) responde 409 «Ya existe un perfil con ese nombre»', async () => {
      repo.saveProfile.mockRejectedValue(uniqueViolation());
      await expect(
        service.createProfile({ nombre: 'Repetido' }),
      ).rejects.toThrow(
        new ConflictException('Ya existe un perfil con ese nombre'),
      );
    });

    it('otro error de la base no se convierte en 409', async () => {
      const other = new Error('conexión perdida');
      repo.saveProfile.mockRejectedValue(other);
      await expect(service.createProfile({ nombre: 'X' })).rejects.toBe(other);
    });
  });

  describe('updateProfile', () => {
    it('con nombre cambia name y no envía los campos no recibidos', async () => {
      await service.updateProfile(9, { nombre: 'Nombre nuevo' });
      expect(repo.updateProfile).toHaveBeenCalledWith(9, {
        name: 'Nombre nuevo',
      });
    });

    it('mapea descripcion y ordenPrioridad a description y priorityOrder', async () => {
      await service.updateProfile(9, {
        descripcion: 'Otra',
        ordenPrioridad: 6,
      });
      expect(repo.updateProfile).toHaveBeenCalledWith(9, {
        description: 'Otra',
        priorityOrder: 6,
      });
    });

    it('ordenPrioridad 0 se aplica', async () => {
      await service.updateProfile(9, { ordenPrioridad: 0 });
      expect(repo.updateProfile).toHaveBeenCalledWith(9, { priorityOrder: 0 });
    });

    it('cuerpo vacío o con campos undefined: no llama a update y devuelve el perfil actual', async () => {
      await expect(service.updateProfile(9, {})).resolves.toBe(current);
      await expect(
        service.updateProfile(9, {
          nombre: undefined,
          descripcion: undefined,
          ordenPrioridad: undefined,
        }),
      ).resolves.toBe(current);
      expect(repo.updateProfile).not.toHaveBeenCalled();
    });

    it('un nombre duplicado (23505) responde 409 «Ya existe un perfil con ese nombre»', async () => {
      repo.updateProfile.mockRejectedValue(uniqueViolation());
      await expect(
        service.updateProfile(9, { nombre: 'Repetido' }),
      ).rejects.toThrow(
        new ConflictException('Ya existe un perfil con ese nombre'),
      );
    });

    it('perfil inexistente responde 404 sin llamar a update', async () => {
      repo.findProfileById.mockResolvedValue(null);
      await expect(
        service.updateProfile(99, { nombre: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.updateProfile).not.toHaveBeenCalled();
    });
  });
});
