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
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import {
  CalculateMeetingDatesService,
  type ProtocolNormativeSnapshot,
} from './calculate-meeting-dates.service';
import { MeetingDatesValueObject } from '../../domain/value-objects/meeting-dates.vo';
import { ENTREGA_EVALUACION_HORA_CORTE } from '../../../../shared/deadlines/deadline-rules';

@Injectable()
export class CreateMeetingUseCase {
  private readonly logger = new Logger(CreateMeetingUseCase.name);

  constructor(
    @Inject('IMeetingRepositoryPort')
    private readonly meetingRepository: IMeetingRepositoryPort,
    @Inject('IMeetingPdfGeneratorPort')
    private readonly pdfGenerator: IMeetingPdfGeneratorPort,
    private readonly calculateDatesService: CalculateMeetingDatesService,
  ) {}

  async execute(params: CreateMeetingParams): Promise<{
    id: string;
    meetingNumber: string;
    pdfUrl: string;
    warnings: string[];
  }> {
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

    // 7. Generar PDF del Orden del Día
    const pdfUrl = await this.pdfGenerator.generateAgendaPdf(savedMeeting.id);

    return {
      id: savedMeeting.id,
      meetingNumber: savedMeeting.numeroConvocatoria,
      pdfUrl,
      warnings,
    };
  }
}
