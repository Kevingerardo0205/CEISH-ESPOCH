import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationAssignmentOrmEntity } from './infrastructure/database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from './infrastructure/database/evaluator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from './infrastructure/database/evaluator-profile-user.entity.orm';
import { ProtocolVersionOrmEntity } from './infrastructure/database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from './infrastructure/database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from './infrastructure/database/evaluation-response-detail.entity.orm';
import { SessionOrmEntity } from './infrastructure/database/session.entity.orm';

import { MinutesOrmEntity } from './infrastructure/database/minutes.entity.orm';
import { UserOrmEntity } from '../auth/infrastructure/database/user.entity.orm';
import { EvaluationsService } from './application/services/evaluations.service';
import { ConflictOfInterestService } from './application/services/conflict-of-interest.service';
import { EvaluationConsolidationService } from './application/services/evaluation-consolidation.service';
import { EvaluationsController } from './infrastructure/controllers/evaluations.controller';
import { IEvaluationRepository } from './domain/ports/evaluation.repository.port';
import { EvaluationTypeOrmRepository } from './infrastructure/repositories/evaluation.typeorm.repository';
import { ProtocolsModule } from '../protocols/protocols.module';
import { forwardRef } from '@nestjs/common';
import { InvestigatorOrmEntity } from '../protocols/infrastructure/database/investigator.entity.orm';
import { InvestigatorProfileOrmEntity } from '../auth/infrastructure/database/investigator-profile.entity.orm';
import { ProtocolOrmEntity } from '../protocols/infrastructure/database/protocol.entity.orm';
import { PeerRiskAssignmentOrmEntity } from './infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../protocols/infrastructure/database/risk-level.entity.orm';
import { RevisionModalityOrmEntity } from './infrastructure/database/revision-modality.entity.orm';
import { ResolutionTypeOrmEntity } from '../resolutions/infrastructure/database/resolution-type.entity.orm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationAssignmentOrmEntity,
      EvaluatorProfileOrmEntity,
      EvaluatorProfileUserOrmEntity,
      ProtocolVersionOrmEntity,
      EvaluationOrmEntity,
      EvaluationResponseDetailOrmEntity,
      SessionOrmEntity,

      MinutesOrmEntity,
      UserOrmEntity,
      InvestigatorOrmEntity,
      InvestigatorProfileOrmEntity,
      ProtocolOrmEntity,
      PeerRiskAssignmentOrmEntity,
      RiskLevelOrmEntity,
      RevisionModalityOrmEntity,
      ResolutionTypeOrmEntity,
    ]),

    forwardRef(() => ProtocolsModule),
  ],
  controllers: [EvaluationsController],
  providers: [
    EvaluationsService,
    ConflictOfInterestService,
    EvaluationConsolidationService,
    {
      provide: IEvaluationRepository,
      useClass: EvaluationTypeOrmRepository,
    },
  ],
  exports: [
    EvaluationsService,
    ConflictOfInterestService,
    EvaluationConsolidationService,
    IEvaluationRepository,
  ],
})
export class EvaluationsModule {}
