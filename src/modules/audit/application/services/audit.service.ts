import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLogOrmEntity } from '../../infrastructure/database/audit-log.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

interface AuditQuery {
  search?: string;
  action?: string | string[];
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly auditRepo: Repository<AuditLogOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  async createLog(data: Partial<AuditLogOrmEntity>) {
    const log = this.auditRepo.create(data);
    return this.auditRepo.save(log);
  }

  async findAll(query: unknown) {
    const q = query as AuditQuery;
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (q.search) {
      qb.andWhere('(log.action ILIKE :search OR log.ipAddress ILIKE :search)', {
        search: `%${q.search}%`,
      });
    }

    if (q.action && q.action.length > 0) {
      const actions = Array.isArray(q.action) ? q.action : [q.action];
      qb.andWhere('log.action IN (:...actions)', { actions });
    }

    if (q.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(q.startDate),
      });
    }
    if (q.endDate) {
      qb.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(q.endDate),
      });
    }

    const logs = await qb.getMany();

    const userIds = logs.map((l) => l.userId).filter(Boolean);
    if (userIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(userIds) },
        relations: ['roles'],
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return logs.map((log) => ({
        ...log,
        userName: log.userId
          ? userMap.get(log.userId)?.fullName || 'Usuario Desconocido'
          : 'Sistema',
        userRole: log.userId
          ? userMap.get(log.userId)?.roles?.[0]?.name || 'N/A'
          : 'SISTEMA',
      }));
    }

    return logs.map((log) => ({
      ...log,
      userName: 'Sistema',
      userRole: 'SISTEMA',
    }));
  }

  async findProtocolTrail(protocolId: number) {
    const logs = await this.auditRepo.find({
      where: { recordId: protocolId },
      order: { createdAt: 'DESC' },
    });

    const userIds = logs.map((l) => l.userId).filter(Boolean);
    if (userIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(userIds) },
        relations: ['roles'],
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return logs.map((log) => ({
        ...log,
        userName: log.userId
          ? userMap.get(log.userId)?.fullName || 'Usuario Desconocido'
          : 'Sistema',
        userRole: log.userId
          ? userMap.get(log.userId)?.roles?.[0]?.name || 'N/A'
          : 'SISTEMA',
      }));
    }

    return logs.map((log) => ({
      ...log,
      userName: 'Sistema',
      userRole: 'SISTEMA',
    }));
  }
}
