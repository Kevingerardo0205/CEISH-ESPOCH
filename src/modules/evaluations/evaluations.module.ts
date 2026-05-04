import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationAssignmentOrmEntity } from './infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from './infrastructure/database/evaluator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from './infrastructure/database/evaluator-profile-user.entity.orm';
import { ProtocolVersionOrmEntity } from './infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from './infrastructure/database/evaluation.entity.orm';
import { SessionOrmEntity } from './infrastructure/database/session.entity.orm';
import { MinutesOrmEntity } from './infrastructure/database/minutes.entity.orm';
import { UserOrmEntity } from '../auth/infrastructure/database/user.entity.orm';
import { EvaluationsService } from './application/services/evaluations.service';
import { EvaluationsController } from './infrastructure/controllers/evaluations.controller';
import { IEvaluationRepository } from './domain/ports/evaluation.repository.port';
import { EvaluationTypeOrmRepository } from './infrastructure/repositories/evaluation.typeorm.repository';
import { ProtocolsModule } from '../protocols/protocols.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationAssignmentOrmEntity,
      EvaluatorProfileOrmEntity,
      EvaluatorProfileUserOrmEntity,
      ProtocolVersionOrmEntity,
      EvaluationOrmEntity,
      SessionOrmEntity,
      MinutesOrmEntity,
      UserOrmEntity,
    ]),
    forwardRef(() => ProtocolsModule),
  ],
  controllers: [EvaluationsController],
  providers: [
    EvaluationsService,
    {
      provide: IEvaluationRepository,
      useClass: EvaluationTypeOrmRepository,
    },
  ],
  exports: [EvaluationsService, IEvaluationRepository],
})
export class EvaluationsModule {}
