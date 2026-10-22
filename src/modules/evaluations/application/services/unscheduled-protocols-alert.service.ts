import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type {
  IMeetingRepositoryPort,
  UnscheduledVersionInfo,
} from '../../domain/ports/meeting-repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { IUserRepository } from '../../../auth/domain/ports/user.repository.port';
import {
  SystemParamsService,
  SP_DIAS_MAX_SIN_CONVOCATORIA,
  SP_DIAS_ALERTA_NORMATIVO_SIN_CONVOCATORIA,
} from '../../../sistema/application/services/system-params.service';
import { BusinessDayCalculator } from '../../../../shared/services/deadline-calculator.service';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import { RoleCode } from '../../../auth/domain/enums/role.enum';

export interface EligibleVersionAlert {
  versionId: number;
  protocolCode: string;
  reason: string;
}

@Injectable()
export class UnscheduledProtocolsAlertService {
  private readonly logger = new Logger(UnscheduledProtocolsAlertService.name);

  constructor(
    @Inject('IMeetingRepositoryPort')
    private readonly meetingRepository: IMeetingRepositoryPort,
    private readonly emailService: IEmailServicePort,
    private readonly userRepository: IUserRepository,
    private readonly systemParams: SystemParamsService,
  ) {}

  @Cron('0 8 * * *', { timeZone: 'America/Guayaquil', unrefTimeout: true })
  async runDailyCheck(): Promise<void> {
    this.logger.log(
      'TSK-002-N03: iniciando verificación diaria de protocolos sin convocatoria',
    );
    try {
      await this.checkAndNotify(new Date());
    } catch (error) {
      this.logger.error('TSK-002-N03: error en verificación diaria', error);
    }
  }

  async checkAndNotify(now: Date): Promise<void> {
    const diasMax = this.systemParams.get(SP_DIAS_MAX_SIN_CONVOCATORIA);
    const diasAlerta = this.systemParams.get(
      SP_DIAS_ALERTA_NORMATIVO_SIN_CONVOCATORIA,
    );

    const snapshots =
      await this.meetingRepository.findAssignedVersionsWithoutScheduledMeeting();
    if (!snapshots.length) {
      this.logger.log(
        'TSK-002-N03: sin protocolos sin convocatoria — sin alerta',
      );
      return;
    }

    const eligible = this.evaluateEligibility(
      snapshots,
      now,
      diasMax,
      diasAlerta,
    );
    if (!eligible.length) {
      this.logger.log(
        'TSK-002-N03: ningún protocolo supera los umbrales — sin alerta',
      );
      return;
    }

    const recipients = await this.userRepository.findByRoleCodes([
      RoleCode.SECRETARIA,
      RoleCode.PRESIDENTE,
    ]);
    if (!recipients.length) {
      this.logger.warn(
        'TSK-002-N03: sin destinatarios con rol SECRETARIA o PRESIDENTE',
      );
      return;
    }

    const protocols = eligible.map((e) => ({
      code: e.protocolCode,
      reason: e.reason,
    }));
    for (const recipient of recipients) {
      try {
        await this.emailService.sendUnscheduledProtocolsAlert(
          recipient.institutionalEmail,
          recipient.fullName,
          protocols,
        );
      } catch (error) {
        this.logger.error(
          `TSK-002-N03: fallo al enviar a ${recipient.institutionalEmail}`,
          error,
        );
      }
    }
    this.logger.log(
      `TSK-002-N03: alerta enviada a ${recipients.length} destinatario(s), ${eligible.length} protocolo(s)`,
    );
  }

  evaluateEligibility(
    snapshots: UnscheduledVersionInfo[],
    now: Date,
    diasMax: number,
    diasAlerta: number,
  ): EligibleVersionAlert[] {
    const alerts: EligibleVersionAlert[] = [];

    for (const snap of snapshots) {
      const cond1 = this.checkCondition1(
        snap.oldestAssignmentDate,
        now,
        diasMax,
      );
      const cond2 = this.checkCondition2(
        snap.reviewType,
        snap.receptionDate,
        now,
        diasAlerta,
      );

      if (!cond1 && !cond2) continue;

      let reason: string;
      if (cond1 && cond2) {
        reason = `antigüedad ≥ ${diasMax} días hábiles y plazo normativo en ≤ ${diasAlerta} días hábiles`;
      } else if (cond1) {
        reason = `antigüedad de asignación ≥ ${diasMax} días hábiles sin convocatoria`;
      } else {
        reason = `plazo normativo vence en ≤ ${diasAlerta} días hábiles`;
      }

      alerts.push({
        versionId: snap.versionId,
        protocolCode: snap.protocolCode,
        reason,
      });
    }

    return alerts;
  }

  private checkCondition1(
    oldestAssignmentDate: Date,
    now: Date,
    diasMax: number,
  ): boolean {
    const businessDays = BusinessDayCalculator.countBusinessDays(
      oldestAssignmentDate,
      now,
    );
    return businessDays >= diasMax;
  }

  private checkCondition2(
    reviewType: string | undefined,
    receptionDate: Date | undefined,
    now: Date,
    diasAlerta: number,
  ): boolean {
    const normativeDeadline =
      CalculateMeetingDatesService.computeNormativeDeadline(
        reviewType,
        receptionDate,
      );
    if (!normativeDeadline) {
      if (reviewType !== undefined || receptionDate !== undefined) {
        this.logger.warn(
          `TSK-002-N03: protocolo sin receptionDate o reviewType — condición 2 omitida`,
        );
      }
      return false;
    }
    const daysRemaining = BusinessDayCalculator.countBusinessDays(
      now,
      normativeDeadline,
    );
    return daysRemaining <= diasAlerta;
  }
}
