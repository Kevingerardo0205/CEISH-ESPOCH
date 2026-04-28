import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolController } from './infrastructure/controllers/protocol.controller';
import { ProtocolsService } from './application/services/protocols.service';
import { ProtocolOrmEntity } from './infrastructure/database/protocol.entity.orm';
import { StudyTypeOrmEntity } from './infrastructure/database/study-type.entity.orm';
import { RiskLevelOrmEntity } from './infrastructure/database/risk-level.entity.orm';
import { UserOrmEntity } from '../auth/infrastructure/database/user.entity.orm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProtocolOrmEntity, 
      StudyTypeOrmEntity, 
      RiskLevelOrmEntity, 
      UserOrmEntity
    ])
  ],
  controllers: [ProtocolController],
  providers: [ProtocolsService],
  exports: [ProtocolsService],
})
export class ProtocolsModule {}
