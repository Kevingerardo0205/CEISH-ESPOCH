import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogOrmEntity } from './infrastructure/database/audit-log.entity.orm';
import { AuditService } from './application/services/audit.service';
import { UserOrmEntity } from '../auth/infrastructure/database/user.entity.orm';
import { AuditController } from './infrastructure/controllers/audit.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity, UserOrmEntity])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
