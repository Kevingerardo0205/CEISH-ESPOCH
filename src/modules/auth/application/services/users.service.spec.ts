import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { AUDIT_MESSAGES } from '../../../../shared/constants/audit-messages.constant';

describe('UsersService - Temporal Roles (Phase 1)', () => {
  let service: UsersService;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  const mockUserRepository = {};
  const mockEmailService = {};

  beforeEach(async () => {
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        query: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue(null),
      },
    };

    dataSource = {
      getRepository: jest.fn(),
      query: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: IUserRepository, useValue: mockUserRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: IEmailServicePort, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('suspendTemporaryRole', () => {
    it('should format audit motif without typos using AUDIT_MESSAGES constant', async () => {
      const mockRole = { id: 10, code: 'SECRETARIA', name: 'Secretaría' };
      const mockRepo = {
        find: jest.fn().mockResolvedValue([mockRole]),
      };

      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
      (dataSource.query as jest.Mock).mockResolvedValue([
        [
          {
            usuario_id: 1,
            rol_id: 10,
            fecha_inicio: new Date(),
            fecha_fin: new Date(),
            motivo_delegacion: `${AUDIT_MESSAGES.SUSPENSION_TEMPORAL_PREFIX} Fin de suplencia`,
          },
        ],
      ]);

      const result = await service.suspendTemporaryRole(
        1,
        'SECRETARIA',
        'Fin de suplencia',
      );

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE catalogos.usuarios_roles'),
        [
          `${AUDIT_MESSAGES.SUSPENSION_TEMPORAL_PREFIX} Fin de suplencia`,
          1,
          10,
        ],
      );
      expect(result).toBeDefined();
    });

    it('should use default revocation reason if no reason is provided', async () => {
      const mockRole = { id: 10, code: 'SECRETARIA', name: 'Secretaría' };
      const mockRepo = {
        find: jest.fn().mockResolvedValue([mockRole]),
      };

      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
      (dataSource.query as jest.Mock).mockResolvedValue([
        [{ usuario_id: 1, rol_id: 10 }],
      ]);

      await service.suspendTemporaryRole(1, 'SECRETARIA');

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE catalogos.usuarios_roles'),
        [
          `${AUDIT_MESSAGES.SUSPENSION_TEMPORAL_PREFIX} ${AUDIT_MESSAGES.DEFAULT_REVOCATION_REASON}`,
          1,
          10,
        ],
      );
    });

    it('should throw NotFoundException if role code is not found', async () => {
      const mockRepo = {
        find: jest.fn().mockResolvedValue([]),
      };

      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      await expect(
        service.suspendTemporaryRole(1, 'INVALID_ROLE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser Invitation Flow', () => {
    it('should generate OTP and send invitation email when no password is provided', async () => {
      const mockSavedUser = {
        id: 50,
        institutionalEmail: 'nuevo.usuario@espoch.edu.ec',
        fullName: 'Nuevo Usuario Test',
      };
      const mockRepo = {
        create: jest.fn().mockReturnValue(mockSavedUser),
        save: jest.fn().mockResolvedValue(mockSavedUser),
        find: jest
          .fn()
          .mockResolvedValue([{ id: 1, code: 'EVALUADOR', name: 'Evaluador' }]),
        findOne: jest.fn().mockResolvedValue(null),
      };

      (mockUserRepository as any).findByEmail = jest
        .fn()
        .mockResolvedValue(null);
      (mockUserRepository as any).findById = jest
        .fn()
        .mockResolvedValue(mockSavedUser);
      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);
      (mockEmailService as any).sendAccountInvitation = jest
        .fn()
        .mockResolvedValue(undefined);

      // findOne: 1.ª llamada = cédula (null → sin conflicto), 2.ª = userId en updateUserRoles
      const qrMgr = (
        (dataSource.createQueryRunner as jest.Mock)() as {
          manager: { findOne: jest.Mock };
        }
      ).manager;
      qrMgr.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSavedUser);

      const result = await service.createUser({
        nationalId: '0601234567',
        fullName: 'Nuevo Usuario Test',
        email: 'nuevo.usuario@espoch.edu.ec',
        roles: ['EVALUADOR'],
      });

      expect(
        (mockEmailService as any).sendAccountInvitation,
      ).toHaveBeenCalledWith(
        'nuevo.usuario@espoch.edu.ec',
        expect.any(String),
        'Nuevo Usuario Test',
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateUserRoles vigencia', () => {
    it('updateUserRoles sin validFrom envía null y deja que la BD ponga NOW()', async () => {
      const writeQueries: Array<{ sql: string; params: unknown[] }> = [];

      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 9, code: 'EVALUADOR', name: 'Evaluador' }]),
      };
      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const qrMgr = (
        (dataSource.createQueryRunner as jest.Mock)() as {
          manager: { findOne: jest.Mock; query: jest.Mock };
        }
      ).manager;
      qrMgr.findOne.mockResolvedValue({ id: 77 });
      qrMgr.query.mockImplementation((sql: string, params?: unknown[]) => {
        if (
          sql.includes('INSERT INTO catalogos.usuarios_roles') ||
          sql.includes('SET fecha_inicio = COALESCE')
        ) {
          writeQueries.push({ sql, params: params ?? [] });
        }
        return Promise.resolve([]);
      });

      await service.updateUserRoles(77, ['EVALUADOR']);

      const insert = writeQueries.find((q) =>
        q.sql.includes('INSERT INTO catalogos.usuarios_roles'),
      );
      expect(insert).toBeDefined();
      expect(insert!.sql).toContain('COALESCE(');
      expect(insert!.sql).toContain('NOW()');
      expect(insert!.params[2]).toBeNull();
    });

    it('updateUserRoles sin validFrom usa COALESCE en UPDATE cuando el rol ya existe', async () => {
      const writeQueries: Array<{ sql: string; params: unknown[] }> = [];

      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 9, code: 'EVALUADOR', name: 'Evaluador' }]),
      };
      (dataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const qrMgr = (
        (dataSource.createQueryRunner as jest.Mock)() as {
          manager: { findOne: jest.Mock; query: jest.Mock };
        }
      ).manager;
      qrMgr.findOne.mockResolvedValue({ id: 77 });
      qrMgr.query.mockImplementation((sql: string, params?: unknown[]) => {
        if (sql.includes('SET fecha_inicio = COALESCE')) {
          writeQueries.push({ sql, params: params ?? [] });
        }
        // Simular fila existente para la SELECT previa al UPDATE
        if (sql.includes('SELECT usuario_id FROM catalogos.usuarios_roles')) {
          return Promise.resolve([{ usuario_id: 77 }]);
        }
        return Promise.resolve([]);
      });

      await service.updateUserRoles(77, ['EVALUADOR']);

      const update = writeQueries.find((q) =>
        q.sql.includes('SET fecha_inicio = COALESCE'),
      );
      expect(update).toBeDefined();
      expect(update!.sql).toContain('COALESCE(');
      expect(update!.sql).toContain('NOW()');
      expect(update!.params[0]).toBeNull();
    });
  });
});
