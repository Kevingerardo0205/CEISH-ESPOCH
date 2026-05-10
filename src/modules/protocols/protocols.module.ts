import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolController } from './infrastructure/controllers/protocol.controller';
import { ProtocolsService } from './application/services/protocols.service';
import { RequirementsService } from './application/services/requirements.service';
import { ProtocolOrmEntity } from './infrastructure/database/protocol.entity.orm';
import { StudyTypeOrmEntity } from './infrastructure/database/study-type.entity.orm';
import { RiskLevelOrmEntity } from './infrastructure/database/risk-level.entity.orm';
import { UserOrmEntity } from '../auth/infrastructure/database/user.entity.orm';
import { InvestigatorOrmEntity } from './infrastructure/database/investigator.entity.orm';
import { ParticipatingInstitutionOrmEntity } from './infrastructure/database/participating-institution.entity.orm';
import { ProtocolRequirementOrmEntity } from './infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolCodeGenerator } from './application/services/protocol-code-generator.service';
import { ProtocolDeadlineService } from './application/services/protocol-deadline.service';
import { ProtocolChecklistFactory } from './application/factories/protocol-checklist.factory';
import { IProtocolRepository } from './domain/ports/protocol.repository.port';
import { ProtocolTypeOrmRepository } from './infrastructure/repositories/protocol.typeorm.repository';
import { ReceptionModule } from '../reception/reception.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProtocolOrmEntity,
      StudyTypeOrmEntity,
      RiskLevelOrmEntity,
      UserOrmEntity,
      InvestigatorOrmEntity,
      ParticipatingInstitutionOrmEntity,
      ProtocolRequirementOrmEntity,
    ]),
    forwardRef(() => ReceptionModule),
  ],
  controllers: [ProtocolController],
  providers: [
    ProtocolsService,
    RequirementsService,
    ProtocolCodeGenerator,
    ProtocolDeadlineService,
    ProtocolChecklistFactory,
    {
      provide: IProtocolRepository,
      useClass: ProtocolTypeOrmRepository,
    },
  ],
  exports: [
    ProtocolsService,
    RequirementsService,


    IProtocolRepository,
    ProtocolCodeGenerator,
    ProtocolDeadlineService,
    ProtocolChecklistFactory,
  ],
})
export class ProtocolsModule {}
