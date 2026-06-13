import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionOrmEntity } from './infrastructure/database/resolution.entity.orm';
import { ResolutionTypeOrmEntity } from './infrastructure/database/resolution-type.entity.orm';
import { ResolutionsService } from './application/services/resolutions.service';
import { ResolutionsController } from './infrastructure/controllers/resolutions.controller';
import { ProtocolsModule } from '../protocols/protocols.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { ReceptionOrmEntity } from '../reception/infrastructure/database/reception.entity.orm';
import { ProtocolRequirementOrmEntity } from '../protocols/infrastructure/database/protocol-requirement.entity.orm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResolutionOrmEntity,
      ResolutionTypeOrmEntity,
      ReceptionOrmEntity,
      ProtocolRequirementOrmEntity,
    ]),
    ProtocolsModule,
    EvaluationsModule,
  ],
  controllers: [ResolutionsController],
  providers: [ResolutionsService],
  exports: [ResolutionsService],
})
export class ResolutionsModule {}
