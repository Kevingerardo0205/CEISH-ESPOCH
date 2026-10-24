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
import { AuditLogOrmEntity } from '../audit/infrastructure/database/audit-log.entity.orm';

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
import { GetReassignmentHistoryUseCase } from './application/use-cases/get-reassignment-history.use-case';
import { GetActiveAssignmentsUseCase } from './application/use-cases/get-active-assignments.use-case';
import { MailerNotificationAdapter } from './infrastructure/adapters/mailer-notification.adapter';

import { EvaluationsController } from './infrastructure/controllers/evaluations.controller';
import { CallsController } from './infrastructure/controllers/calls.controller';
import { MeetingsController } from './infrastructure/controllers/meetings.controller';

import { IEvaluationRepository } from './domain/ports/evaluation.repository.port';
import { EvaluationTypeOrmRepository } from './infrastructure/repositories/evaluation.typeorm.repository';
import { IProtocolRepository } from '../protocols/domain/ports/protocol.repository.port';
import { MeetingTypeOrmRepository } from './infrastructure/repositories/meeting-typeorm.repository';
import { IEmailServicePort } from '../notifications/domain/ports/email.service.port';
import type { IMeetingRepositoryPort } from './domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from './domain/ports/meeting-pdf-generator.port';
import { IUserRepository } from '../auth/domain/ports/user.repository.port';
import type { EvaluatorAssignedEventPayload } from './infrastructure/adapters/mailer-notification.adapter';

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
import { UnscheduledProtocolsAlertService } from './application/services/unscheduled-protocols-alert.service';
import { AuthModule } from '../auth/auth.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function buildEvaluatorAssignedBridge(
  mailer: MailerNotificationAdapter,
  label: string,
): { emit(event: string, payload: Record<string, unknown>): void } {
  const logger = new Logger('EvaluationsModule');
  return {
    emit(event: string, payload: Record<string, unknown>): void {
      if (event !== 'evaluator.assigned') return;
      const p = payload as unknown as EvaluatorAssignedEventPayload;
      mailer.handleEvaluatorAssignedEvent(p).catch((err: unknown) => {
        logger.error(
          `[${label}] Error al enviar correo assignmentId=${String(p.assignmentId)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    },
  };
}

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
      AuditLogOrmEntity,
    ]),

    forwardRef(() => ProtocolsModule),
    AuthModule,
  ],
  controllers: [EvaluationsController, CallsController, MeetingsController],
  providers: [
    EvaluationsService,
    ConflictOfInterestService,
    EvaluationConsolidationService,
    CallsService,
    EvaluatorAssignmentAdapterService,
    UnscheduledProtocolsAlertService,
    {
      provide: CreateMeetingUseCase,
      useFactory: (
        meetingRepo: IMeetingRepositoryPort,
        pdfGen: IMeetingPdfGeneratorPort,
        calcDates: CalculateMeetingDatesService,
        emailService: IEmailServicePort,
        userRepo: IUserRepository,
        mailer: MailerNotificationAdapter,
      ): CreateMeetingUseCase =>
        new CreateMeetingUseCase(
          meetingRepo,
          pdfGen,
          calcDates,
          emailService,
          userRepo,
          buildEvaluatorAssignedBridge(mailer, 'N41'),
        ),
      inject: [
        'IMeetingRepositoryPort',
        'IMeetingPdfGeneratorPort',
        CalculateMeetingDatesService,
        IEmailServicePort,
        IUserRepository,
        MailerNotificationAdapter,
      ],
    },
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
        config: ConfigService,
      ): MailerNotificationAdapter => {
        const frontendUrl = config.get<string>(
          'FRONTEND_URL',
          'https://localhost:4200',
        );
        return new MailerNotificationAdapter(
          {
            sendMail: async (options: {
              to: string;
              subject: string;
              html: string;
            }): Promise<void> => {
              await emailService.sendHtml(
                options.to,
                options.subject,
                options.html,
              );
            },
          },
          frontendUrl,
        );
      },
      inject: [IEmailServicePort, ConfigService],
    },
    {
      provide: AssignEvaluatorsUseCase,
      useFactory: (
        repo: IEvaluationRepository,
        mailer: MailerNotificationAdapter,
      ): AssignEvaluatorsUseCase =>
        new AssignEvaluatorsUseCase(
          repo,
          buildEvaluatorAssignedBridge(mailer, 'PR-G'),
        ),
      inject: [IEvaluationRepository, MailerNotificationAdapter],
    },
    {
      provide: ReassignEvaluatorUseCase,
      useFactory: (
        repo: IEvaluationRepository,
        mailer: MailerNotificationAdapter,
      ): ReassignEvaluatorUseCase =>
        new ReassignEvaluatorUseCase(
          repo,
          buildEvaluatorAssignedBridge(mailer, 'PR-G'),
        ),
      inject: [IEvaluationRepository, MailerNotificationAdapter],
    },
    {
      provide: SubmitEvaluationUseCase,
      useFactory: (
        evalRepo: IEvaluationRepository,
        protocolRepo: IProtocolRepository,
      ): SubmitEvaluationUseCase =>
        new SubmitEvaluationUseCase(evalRepo, protocolRepo),
      inject: [IEvaluationRepository, IProtocolRepository],
    },
    {
      provide: InheritEvaluatorsUseCase,
      useFactory: (repo: IEvaluationRepository): InheritEvaluatorsUseCase =>
        new InheritEvaluatorsUseCase(repo),
      inject: [IEvaluationRepository],
    },
    {
      provide: GetReassignmentHistoryUseCase,
      useFactory: (
        repo: IEvaluationRepository,
      ): GetReassignmentHistoryUseCase =>
        new GetReassignmentHistoryUseCase(repo),
      inject: [IEvaluationRepository],
    },
    {
      provide: GetActiveAssignmentsUseCase,
      useFactory: (repo: IEvaluationRepository): GetActiveAssignmentsUseCase =>
        new GetActiveAssignmentsUseCase(repo),
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
    GetReassignmentHistoryUseCase,
    GetActiveAssignmentsUseCase,
    MailerNotificationAdapter,
    IEvaluationRepository,
    'IMeetingRepositoryPort',
  ],
})
export class EvaluationsModule {}
