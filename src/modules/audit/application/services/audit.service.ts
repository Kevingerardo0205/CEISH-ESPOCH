import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogOrmEntity } from '../../infrastructure/database/audit-log.entity.orm';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly auditRepo: Repository<AuditLogOrmEntity>,
  ) {}

  async createLog(data: Partial<AuditLogOrmEntity>) {
    const log = this.auditRepo.create(data);
    return this.auditRepo.save(log);
  }
}
