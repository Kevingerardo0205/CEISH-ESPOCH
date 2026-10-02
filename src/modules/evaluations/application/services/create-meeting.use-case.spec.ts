import { BadRequestException } from '@nestjs/common';
import { CreateMeetingUseCase } from './create-meeting.use-case';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import {
  SessionType,
  ConvocatoriaStatus,
} from '../../infrastructure/database/entities/convocatoria.orm-entity';
import type { MeetingEntity } from '../../domain/entities/meeting.entity';

describe('CreateMeetingUseCase (T008 / TSK-009-006)', () => {
  let useCase: CreateMeetingUseCase;
  let repositoryMock: jest.Mocked<IMeetingRepositoryPort>;
  let pdfGeneratorMock: jest.Mocked<IMeetingPdfGeneratorPort>;
  let calculateDatesService: CalculateMeetingDatesService;

  beforeEach(() => {
    repositoryMock = {
      saveMeetingWithAtomicNumber: jest.fn(),
      findById: jest.fn(),
    };
    pdfGeneratorMock = {
      generateAgendaPdf: jest.fn(),
    };
    calculateDatesService = new CalculateMeetingDatesService();

    useCase = new CreateMeetingUseCase(
      repositoryMock,
      pdfGeneratorMock,
      calculateDatesService,
    );
  });

  it('should create and schedule a meeting successfully with atomic number and dates', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      locationId: 'loc-001',
      protocolVersionIds: [137],
    };

    const savedEntity: MeetingEntity = {
      id: 'meet-001',
      numeroConvocatoria: '001-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-08T23:59:59.999Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
      '/storage/pdf/001-2026.pdf',
    );

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('001-2026');
    expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalled();
    expect(pdfGeneratorMock.generateAgendaPdf).toHaveBeenCalledWith('meet-001');
  });

  it('should create a meeting successfully with follow-up reports when no protocol versions are specified', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      locationId: 'loc-001',
      followUpReportIds: [201, 202],
    };

    const savedEntity: MeetingEntity = {
      id: 'meet-002',
      numeroConvocatoria: '002-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-08T23:59:59.999Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
      '/storage/pdf/002-2026.pdf',
    );

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('002-2026');
    expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalled();
  });

  it('should throw BadRequestException when both protocolVersionIds and followUpReportIds are empty/missing', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [],
      followUpReportIds: [],
    };

    await expect(useCase.execute(params)).rejects.toThrow(BadRequestException);
    expect(repositoryMock.saveMeetingWithAtomicNumber).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when hard precedence constraint (evalDate >= meetingDate) is violated', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const invalidEvalDate = new Date('2026-10-16T09:00:00.000Z'); // Posterior
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      evalSubmissionDeadline: invalidEvalDate,
      protocolVersionIds: [137],
    };

    await expect(useCase.execute(params)).rejects.toThrow(BadRequestException);
  });
});
