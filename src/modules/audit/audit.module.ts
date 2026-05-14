import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/database/audit-log.entity.orm';
import { AuditService } from './application/services/audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
