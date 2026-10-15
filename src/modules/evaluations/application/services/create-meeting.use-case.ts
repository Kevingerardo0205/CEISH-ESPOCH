import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type {
  CreateMeetingParams,
  IMeetingRepositoryPort,
} from '../../domain/ports/meeting-repository.port';
import type { MeetingEntity } from '../../domain/entities/meeting.entity';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import {
  CalculateMeetingDatesService,
  type ProtocolNormativeSnapshot,
} from './calculate-meeting-dates.service';
import { MeetingDatesValueObject } from '../../domain/value-objects/meeting-dates.vo';
import { ENTREGA_EVALUACION_HORA_CORTE } from '../../../../shared/deadlines/deadline-rules';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { IUserRepository } from '../../../auth/domain/ports/user.repository.port';
import { RoleCode } from '../../../auth/domain/enums/role.enum';

@Injectable()
export class CreateMeetingUseCase {
  private readonly logger = new Logger(CreateMeetingUseCase.name);

  constructor(
    @Inject('IMeetingRepositoryPort')
    private readonly meetingRepository: IMeetingRepositoryPort,
    @Inject('IMeetingPdfGeneratorPort')
    private readonly pdfGenerator: IMeetingPdfGeneratorPort,
    private readonly calculateDatesService: CalculateMeetingDatesService,
    @Inject(IEmailServicePort)
    private readonly emailService: IEmailServicePort,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(params: CreateMeetingParams): Promise<{
    id: string;
    meetingNumber: string;
    pdfUrl: string;
    warnings: string[];
  }> {
    // Guard TSK-009-N10: protocolVersionIds no puede contener IDs repetidos
    if (params.protocolVersionIds && params.protocolVersionIds.length > 0) {
      const seen = new Set<number>();
      const duplicates: number[] = [];
      for (const id of params.protocolVersionIds) {
        if (seen.has(id)) {
          if (!duplicates.includes(id)) duplicates.push(id);
        } else {
          seen.add(id);
        }
      }
      if (duplicates.length > 0) {
        throw new BadRequestException(
          `VERSIONES_DUPLICADAS: Los siguientes IDs de versión de protocolo están repetidos en el Orden del Día: ${duplicates.join(', ')}.`,
        );
      }
    }

    // Guard TSK-009-N09: followUpReportIds no disponible hasta PR-F1 (seguimiento.informes_seguimiento inexistente)
    if (params.followUpReportIds && params.followUpReportIds.length > 0) {
      throw new BadRequestException(
        'SEGUIMIENTO_NO_DISPONIBLE: La sección III (informes de seguimiento) no está habilitada hasta completar RF-15. Use solo protocolVersionIds.',
      );
    }

    // 1. Validar que exista al menos un punto en el Orden del Día (evaluación o seguimiento)
    const hasProtocols =
      Array.isArray(params.protocolVersionIds) &&
      params.protocolVersionIds.length > 0;
    const hasFollowUpReports =
      Array.isArray(params.followUpReportIds) &&
      params.followUpReportIds.length > 0;

    if (!hasProtocols && !hasFollowUpReports) {
      throw new BadRequestException(
        'ORDEN_DEL_DIA_VACIO: La convocatoria debe incluir al menos un punto en el orden del día (evaluación de protocolo o informe de seguimiento).',
      );
    }

    // 2. Pre-calcular o usar la fecha de entrega de evaluación indicada
    const evalDeadline =
      params.evalSubmissionDeadline ||
      this.calculateDatesService.calculateSuggestedEvalDeadline(
        params.meetingDate,
      );

    // 3. Validar restricción dura: fecha de entrega debe ser estrictamente posterior a la reunión
    const datesVo = new MeetingDatesValueObject(
      params.meetingDate,
      evalDeadline,
    );

    // 4. Obtener snapshots de asignación activa más antigua por versión (TSK-002-N05)
    const assignmentSnapshots = hasProtocols
      ? await this.meetingRepository.getOldestAssignedDates(
          params.protocolVersionIds!,
        )
      : [];

    // 4b. Obtener datos crudos para calcular plazos normativos (TSK-009-N06)
    const normativeInputs = hasProtocols
      ? await this.meetingRepository.findNormativeDeadlineInputs(
          params.protocolVersionIds!,
        )
      : [];

    const normativeSnapshots: ProtocolNormativeSnapshot[] = normativeInputs
      .map((input) => {
        const normativeDeadline =
          CalculateMeetingDatesService.computeNormativeDeadline(
            input.reviewType,
            input.receptionDate,
          );
        if (!normativeDeadline) {
          this.logger.warn(
            `TSK-009-N06: protocolo ${input.protocolCode} sin receptionDate o reviewType, omitiendo advertencia normativa.`,
          );
          return null;
        }
        return {
          protocolCode: input.protocolCode,
          normativeDeadline,
        };
      })
      .filter((s): s is ProtocolNormativeSnapshot => s !== null);

    // 5. Evaluar advertencias no bloqueantes (plazo normativo y plazo de revisión de oficio)
    const warnings = this.calculateDatesService.evaluateSoftWarnings(
      params.meetingDate,
      normativeSnapshots,
      assignmentSnapshots,
      evalDeadline,
    );

    // 6. Persistir atómicamente asignando el siguiente número correlativo (001-2026)
    // Snapshot de los parámetros de entrega usados (TSK-009-N04): getEntregaDias() es la
    // misma fuente que usa calculateSuggestedEvalDeadline(), garantizando coherencia.
    const academicYear = params.meetingDate.getFullYear();
    const repoParams: CreateMeetingParams = {
      ...params,
      entregaDiasHabiles: this.calculateDatesService.getEntregaDias(),
      entregaHoraCorte: ENTREGA_EVALUACION_HORA_CORTE,
    };
    const savedMeeting =
      await this.meetingRepository.saveMeetingWithAtomicNumber(
        repoParams,
        `${academicYear}`,
        datesVo.evalSubmissionDeadline,
      );

    // 7. URL del PDF es determinista; la generación y envío de correos son fire-and-forget
    const pdfUrl = `/api/evaluations/meetings/${savedMeeting.id}/pdf`;
    void this.notifyMembersAsync(savedMeeting, params);

    return {
      id: savedMeeting.id,
      meetingNumber: savedMeeting.numeroConvocatoria,
      pdfUrl,
      warnings,
    };
  }

  private async notifyMembersAsync(
    savedMeeting: MeetingEntity,
    params: CreateMeetingParams,
  ): Promise<void> {
    try {
      let pdfResult: { url: string; buffer: Buffer };
      try {
        pdfResult = await this.pdfGenerator.generateAgendaPdf(savedMeeting.id);
      } catch (pdfError) {
        this.logger.error(
          `TSK-009-N08: error generando PDF para convocatoria ${savedMeeting.id}`,
          pdfError,
        );
        return;
      }

      const place = params.locationId
        ? await this.meetingRepository.findPlaceById(params.locationId)
        : null;
      const placeName = place?.nombre ?? 'Sala de Sesiones CEISH-ESPOCH';

      const callTime = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit',
      }).format(params.meetingDate);

      const members = await this.userRepository.findByRoleCodes([
        RoleCode.EVALUADOR,
        RoleCode.PRESIDENTE,
      ]);

      if (!members.length) {
        this.logger.log(
          'TSK-009-N08: sin miembros activos con rol EVALUADOR/PRESIDENTE; correo omitido.',
        );
        return;
      }

      await Promise.allSettled(
        members.map((m) =>
          this.emailService
            .sendCallNotification(
              m.institutionalEmail,
              m.fullName,
              savedMeeting.numeroConvocatoria,
              savedMeeting.fechaReunion,
              callTime,
              placeName,
              pdfResult.buffer,
            )
            .catch((e: unknown) =>
              this.logger.error(
                `TSK-009-N08: error enviando correo a ${m.institutionalEmail}`,
                e,
              ),
            ),
        ),
      );
    } catch (e) {
      this.logger.error(
        `TSK-009-N08: error inesperado en notifyMembersAsync para convocatoria ${savedMeeting.id}`,
        e,
      );
    }
  }
}
