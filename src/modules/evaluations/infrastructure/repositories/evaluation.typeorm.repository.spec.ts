/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EvaluationTypeOrmRepository } from './evaluation.typeorm.repository';
import { EvaluationAssignmentOrmEntity } from '../database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../database/protocol-version.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { EvaluationOrmEntity } from '../database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../database/evaluation-response-detail.entity.orm';
import { AssignmentHistoryOrmEntity } from '../database/entities/assignment-history.orm-entity';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';

describe('EvaluationTypeOrmRepository (TSK-002-08)', () => {
  let repository: EvaluationTypeOrmRepository;
  let assignmentRepoMock: jest.Mocked<
    Repository<EvaluationAssignmentOrmEntity>
  >;
  let profileRepoMock: jest.Mocked<Repository<EvaluatorProfileOrmEntity>>;
  let versionRepoMock: jest.Mocked<Repository<ProtocolVersionOrmEntity>>;
  let userRepoMock: jest.Mocked<Repository<UserOrmEntity>>;
  let evaluationRepoMock: jest.Mocked<Repository<EvaluationOrmEntity>>;
  let detailRepoMock: jest.Mocked<
    Repository<EvaluationResponseDetailOrmEntity>
  >;
  let dataSourceMock: jest.Mocked<DataSource>;
  let queryRunnerMock: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
      manager: {
        create: jest
          .fn()
          .mockImplementation((entityClass, data) => ({ ...data })),
        save: jest
          .fn()
          .mockImplementation((entityClass, data) => Promise.resolve(data)),
        findOne: jest.fn(),
      },
    } as any;

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    } as any;

    assignmentRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    profileRepoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    versionRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    userRepoMock = {
      createQueryBuilder: jest.fn(),
    } as any;

    evaluationRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    } as any;

    detailRepoMock = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    repository = new EvaluationTypeOrmRepository(
      assignmentRepoMock,
      profileRepoMock,
      versionRepoMock,
      userRepoMock,
      evaluationRepoMock,
      detailRepoMock,
      dataSourceMock,
    );
  });

  describe('saveAssignmentsTransaction', () => {
    it('should save all assignments atomically in a transaction', async () => {
      const assignments = [
        {
          versionId: 10,
          evaluatorId: 1,
          profileId: 1,
          statusId: AssignmentStatus.ASSIGNED,
        },
        {
          versionId: 10,
          evaluatorId: 2,
          profileId: 2,
          statusId: AssignmentStatus.ASSIGNED,
        },
      ];

      (queryRunnerMock.manager.save as jest.Mock).mockResolvedValueOnce(
        assignments,
      );

      const result = await repository.saveAssignmentsTransaction(assignments);

      expect(dataSourceMock.createQueryRunner).toHaveBeenCalled();
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.save).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should rollback transaction and release runner when saving fails', async () => {
      const assignments = [
        {
          versionId: 10,
          evaluatorId: 1,
          profileId: 1,
          statusId: AssignmentStatus.ASSIGNED,
        },
      ];

      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error('DB Connection error'),
      );

      await expect(
        repository.saveAssignmentsTransaction(assignments),
      ).rejects.toThrow('DB Connection error');

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });

  describe('executeReassignmentTransaction', () => {
    it('should update outgoing assignment, create replacement, and record audit history atomically', async () => {
      const outgoingAssignment = {
        id: 100,
        versionId: 5,
        evaluatorId: 12,
        profileId: 1,
        statusId: AssignmentStatus.ASSIGNED,
      };

      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        outgoingAssignment,
      );
      (queryRunnerMock.manager.save as jest.Mock).mockImplementation(
        (entityClass, data) => {
          if (entityClass === EvaluationAssignmentOrmEntity) {
            return Promise.resolve({ ...data, id: data.id || 200 });
          }
          if (entityClass === AssignmentHistoryOrmEntity) {
            return Promise.resolve({ ...data, id: 1 });
          }
          return Promise.resolve(data);
        },
      );

      const params = {
        outgoingAssignmentId: 100,
        outgoingStatusId: AssignmentStatus.REASIGNED_VENCIMIENTO,
        newAssignment: {
          versionId: 5,
          evaluatorId: 15,
          profileId: 1,
          statusId: AssignmentStatus.ASSIGNED,
          isAssignedForAnnex10: true,
        },
        auditHistory: {
          previousEvaluatorId: 12,
          profileId: 1,
          reason: 'VENCIMIENTO',
          justification: 'Superó 15 días hábiles sin respuesta',
          newEvaluatorId: 15,
          executedBy: 1,
        },
      };

      const result = await repository.executeReassignmentTransaction(params);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.findOne).toHaveBeenCalledWith(
        EvaluationAssignmentOrmEntity,
        { where: { id: 100 } },
      );
      expect(result.outgoingAssignment.statusId).toBe(
        AssignmentStatus.REASIGNED_VENCIMIENTO,
      );
      expect(result.newAssignment.evaluatorId).toBe(15);
      expect(result.auditHistory.previousAssignmentId).toBe(100);
      expect(result.auditHistory.newAssignmentId).toBe(200);
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException and rollback if outgoing assignment does not exist', async () => {
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        null,
      );

      const params = {
        outgoingAssignmentId: 999,
        outgoingStatusId: AssignmentStatus.REASIGNED_COI,
        newAssignment: { versionId: 5, evaluatorId: 15 },
        auditHistory: {
          previousEvaluatorId: 12,
          newEvaluatorId: 15,
          reason: 'COI',
          executedBy: 1,
        },
      };

      await expect(
        repository.executeReassignmentTransaction(params),
      ).rejects.toThrow(NotFoundException);

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should rollback transaction if error occurs during reassignment steps', async () => {
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce({
        id: 100,
        statusId: AssignmentStatus.ASSIGNED,
      });
      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error('FK violation'),
      );

      const params = {
        outgoingAssignmentId: 100,
        outgoingStatusId: AssignmentStatus.REASIGNED_COI,
        newAssignment: { versionId: 5, evaluatorId: 15 },
        auditHistory: {
          previousEvaluatorId: 12,
          newEvaluatorId: 15,
          reason: 'COI',
          executedBy: 1,
        },
      };

      await expect(
        repository.executeReassignmentTransaction(params),
      ).rejects.toThrow('FK violation');

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });

  describe('findActiveAssignmentsByVersionId', () => {
    it('should query assignments excluding reassigned statuses', async () => {
      const activeAssignments = [
        { id: 1, versionId: 10, statusId: AssignmentStatus.ASSIGNED },
        { id: 2, versionId: 10, statusId: AssignmentStatus.COMPLETED },
      ] as EvaluationAssignmentOrmEntity[];

      assignmentRepoMock.find.mockResolvedValueOnce(activeAssignments);

      const result = await repository.findActiveAssignmentsByVersionId(10);

      expect(assignmentRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            versionId: 10,
          }),
          relations: ['evaluator', 'profile', 'version', 'version.protocol'],
        }),
      );
      expect(result).toEqual(activeAssignments);
    });
  });

  describe('basic queries', () => {
    it('should find assignment by id with relations', async () => {
      const assignment = { id: 1 } as EvaluationAssignmentOrmEntity;
      assignmentRepoMock.findOne.mockResolvedValueOnce(assignment);

      const result = await repository.findAssignmentById(1);
      expect(assignmentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['evaluator', 'profile', 'version', 'version.protocol'],
      });
      expect(result).toBe(assignment);
    });

    it('should find pending suggestions', async () => {
      assignmentRepoMock.find.mockResolvedValueOnce([]);
      const result = await repository.findPendingSuggestions();
      expect(assignmentRepoMock.find).toHaveBeenCalledWith({
        where: { statusId: AssignmentStatus.SUGGESTED },
        relations: ['evaluator', 'profile', 'version', 'version.protocol'],
      });
      expect(result).toEqual([]);
    });

    it('should delete assignment by id', async () => {
      assignmentRepoMock.delete.mockResolvedValueOnce({ raw: [], affected: 1 });
      await repository.deleteAssignment(5);
      expect(assignmentRepoMock.delete).toHaveBeenCalledWith(5);
    });
  });
});
