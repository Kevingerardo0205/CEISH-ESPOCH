import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type {
  CreateMeetingParams,
  IMeetingRepositoryPort,
} from '../../domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import { MeetingDatesValueObject } from '../../domain/value-objects/meeting-dates.vo';

@Injectable()
export class CreateMeetingUseCase {
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

    // 3. Validar restricción dura de precedencia mediante Value Object
    const datesVo = new MeetingDatesValueObject(
      params.meetingDate,
      evalDeadline,
    );

    // 4. Persistir atómicamente asignando el siguiente número correlativo (001-2026)
    const academicYear = params.meetingDate.getFullYear();
    const savedMeeting =
      await this.meetingRepository.saveMeetingWithAtomicNumber(
        params,
        `${academicYear}`, // Pasa año para secuencial
        datesVo.evalSubmissionDeadline,
      );

    // 5. Generar PDF del Orden del Día
    const pdfUrl = await this.pdfGenerator.generateAgendaPdf(savedMeeting.id);

    return {
      id: savedMeeting.id,
      meetingNumber: savedMeeting.numeroConvocatoria,
      pdfUrl,
    };
  }
}
