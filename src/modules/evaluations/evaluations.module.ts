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

import { ConvocatoriaOrmEntity } from './infrastructure/database/entities/convocatoria.orm-entity';
import { ConvocatoriaProtocoloOrmEntity } from './infrastructure/database/entities/convocatoria-protocolo.orm-entity';
import { LugarOrmEntity } from './infrastructure/database/entities/lugar.orm-entity';
import { AssignmentHistoryOrmEntity } from './infrastructure/database/entities/assignment-history.orm-entity';
import { SecuenciaConvocatoriaOrmEntity } from './infrastructure/database/entities/secuencia-convocatoria.orm-entity';
import { RiskProposalOrmEntity } from './infrastructure/database/entities/risk-proposal.orm-entity';

import { EvaluationsService } from './application/services/evaluations.service';
import { ConflictOfInterestService } from './application/services/conflict-of-interest.service';
import { EvaluationConsolidationService } from './application/services/evaluation-consolidation.service';
import { CallsService } from './application/services/calls.service';
import { CreateMeetingUseCase } from './application/services/create-meeting.use-case';
import { CalculateMeetingDatesService } from './application/services/calculate-meeting-dates.service';
import { AssignEvaluatorsUseCase } from './application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from './application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from './application/use-cases/submit-evaluation.use-case';
import { InheritEvaluatorsUseCase } from './application/use-cases/inherit-evaluators.use-case';
import { MailerNotificationAdapter } from './infrastructure/adapters/mailer-notification.adapter';

import { EvaluationsController } from './infrastructure/controllers/evaluations.controller';
import { CallsController } from './infrastructure/controllers/calls.controller';
import { MeetingsController } from './infrastructure/controllers/meetings.controller';

import { IEvaluationRepository } from './domain/ports/evaluation.repository.port';
import { EvaluationTypeOrmRepository } from './infrastructure/repositories/evaluation.typeorm.repository';
import { MeetingTypeOrmRepository } from './infrastructure/repositories/meeting-typeorm.repository';
import { IEmailServicePort } from '../notifications/domain/ports/email.service.port';

import { ProtocolsModule } from '../protocols/protocols.module';
import { forwardRef } from '@nestjs/common';
import { InvestigatorOrmEntity } from '../protocols/infrastructure/database/investigator.entity.orm';
import { InvestigatorProfileOrmEntity } from '../auth/infrastructure/database/investigator-profile.entity.orm';
import { ProtocolOrmEntity } from '../protocols/infrastructure/database/protocol.entity.orm';
import { PeerRiskAssignmentOrmEntity } from './infrastructure/database/peer-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../protocols/infrastructure/database/risk-level.entity.orm';
import { RevisionModalityOrmEntity } from './infrastructure/database/revision-modality.entity.orm';
import { ResolutionTypeOrmEntity } from '../resolutions/infrastructure/database/resolution-type.entity.orm';
import { PdfGeneratorService } from '../../shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../../shared/utils/docx-generator.service';
import { ProtocolDeadlineService } from '../protocols/application/services/protocol-deadline.service';
import { ReceptionOrmEntity } from '../reception/infrastructure/database/reception.entity.orm';
import { ProtocolRequirementOrmEntity } from '../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { MeetingPdfGeneratorAdapter } from './infrastructure/adapters/meeting-pdf-generator.adapter';

import { EvaluatorAssignmentAdapterService } from './application/services/evaluator-assignment-adapter.service';

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
      ConvocatoriaOrmEntity,
      ConvocatoriaProtocoloOrmEntity,
      LugarOrmEntity,
      AssignmentHistoryOrmEntity,
      SecuenciaConvocatoriaOrmEntity,

      MinutesOrmEntity,
      UserOrmEntity,
      InvestigatorOrmEntity,
      InvestigatorProfileOrmEntity,
      ProtocolOrmEntity,
      PeerRiskAssignmentOrmEntity,
      RiskLevelOrmEntity,
      RevisionModalityOrmEntity,
      ResolutionTypeOrmEntity,
      ReceptionOrmEntity,
      ProtocolRequirementOrmEntity,
      RiskProposalOrmEntity,
    ]),

    forwardRef(() => ProtocolsModule),
  ],
  controllers: [EvaluationsController, CallsController, MeetingsController],
  providers: [
    EvaluationsService,
    ConflictOfInterestService,
    EvaluationConsolidationService,
    CallsService,
    EvaluatorAssignmentAdapterService,
    CreateMeetingUseCase,
    CalculateMeetingDatesService,
    PdfGeneratorService,
    DocxGeneratorService,
    ProtocolDeadlineService,
    {
      provide: 'IMeetingPdfGeneratorPort',
      useClass: MeetingPdfGeneratorAdapter,
    },
    {
      provide: IEvaluationRepository,
      useClass: EvaluationTypeOrmRepository,
    },
    {
      provide: 'IMeetingRepositoryPort',
      useClass: MeetingTypeOrmRepository,
    },
    {
      provide: MailerNotificationAdapter,
      useFactory: (
        emailService: IEmailServicePort,
      ): MailerNotificationAdapter =>
        new MailerNotificationAdapter({
          sendMail: async (options: {
            to: string;
            subject: string;
            html: string;
          }): Promise<void> => {
            // Adapt to IEmailServicePort or fallback
            await emailService.sendEvaluationAssignment(
              options.to,
              'Evaluador',
              options.subject,
              new Date(),
            );
          },
        }),
      inject: [IEmailServicePort],
    },
    {
      provide: AssignEvaluatorsUseCase,
      useFactory: (
        repo: IEvaluationRepository,
        mailer: MailerNotificationAdapter,
      ): AssignEvaluatorsUseCase =>
        new AssignEvaluatorsUseCase(repo, {
          emit: (event: string, payload: unknown): void => {
            if (event === 'evaluator.assigned') {
              mailer
                .handleEvaluatorAssignedEvent(
                  payload as import('./infrastructure/adapters/mailer-notification.adapter').EvaluatorAssignedEventPayload,
                )
                .catch(() => {});
            }
          },
        }),
      inject: [IEvaluationRepository, MailerNotificationAdapter],
    },
    {
      provide: ReassignEvaluatorUseCase,
      useFactory: (
        repo: IEvaluationRepository,
        mailer: MailerNotificationAdapter,
      ): ReassignEvaluatorUseCase =>
        new ReassignEvaluatorUseCase(repo, {
          emit: (event: string, payload: unknown): void => {
            if (event === 'evaluator.assigned') {
              mailer
                .handleEvaluatorAssignedEvent(
                  payload as import('./infrastructure/adapters/mailer-notification.adapter').EvaluatorAssignedEventPayload,
                )
                .catch(() => {});
            }
          },
        }),
      inject: [IEvaluationRepository, MailerNotificationAdapter],
    },
    {
      provide: SubmitEvaluationUseCase,
      useFactory: (repo: IEvaluationRepository): SubmitEvaluationUseCase =>
        new SubmitEvaluationUseCase(repo),
      inject: [IEvaluationRepository],
    },
    {
      provide: InheritEvaluatorsUseCase,
      useFactory: (repo: IEvaluationRepository): InheritEvaluatorsUseCase =>
        new InheritEvaluatorsUseCase(repo),
      inject: [IEvaluationRepository],
    },
  ],
  exports: [
    EvaluationsService,
    ConflictOfInterestService,
    EvaluationConsolidationService,
    CallsService,
    CreateMeetingUseCase,
    CalculateMeetingDatesService,
    AssignEvaluatorsUseCase,
    ReassignEvaluatorUseCase,
    SubmitEvaluationUseCase,
    InheritEvaluatorsUseCase,
    MailerNotificationAdapter,
    IEvaluationRepository,
    'IMeetingRepositoryPort',
  ],
})
export class EvaluationsModule {}
