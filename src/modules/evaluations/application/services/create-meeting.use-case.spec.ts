/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { CreateMeetingUseCase } from './create-meeting.use-case';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import {
  SystemParamsService,
  SystemParamKey,
  SYSTEM_PARAM_FALLBACKS,
} from '../../../sistema/application/services/system-params.service';
import {
  SessionType,
  ConvocatoriaStatus,
} from '../../infrastructure/database/entities/convocatoria.orm-entity';
import type { MeetingEntity } from '../../domain/entities/meeting.entity';

const mockSystemParams = {
  get: (clave: SystemParamKey) => SYSTEM_PARAM_FALLBACKS[clave],
} as unknown as SystemParamsService;

describe('CreateMeetingUseCase (T008 / TSK-009-006)', () => {
  let useCase: CreateMeetingUseCase;
  let repositoryMock: jest.Mocked<IMeetingRepositoryPort>;
  let pdfGeneratorMock: jest.Mocked<IMeetingPdfGeneratorPort>;
  let calculateDatesService: CalculateMeetingDatesService;

  beforeEach(() => {
    repositoryMock = {
      saveMeetingWithAtomicNumber: jest.fn(),
      getOldestAssignedDates: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPendingProtocols: jest.fn(),
      findAllPlaces: jest.fn(),
      findPlaceById: jest.fn(),
      createPlace: jest.fn(),
      updatePlace: jest.fn(),
      deletePlace: jest.fn(),
    };
    pdfGeneratorMock = {
      generateAgendaPdf: jest.fn(),
    };
    calculateDatesService = new CalculateMeetingDatesService(mockSystemParams);

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
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'), // +2 días hábiles a las 12:00 ECT
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
      '/storage/pdf/001-2026.pdf',
    );

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('001-2026');
    expect(result.warnings).toEqual([]);
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
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
      '/storage/pdf/002-2026.pdf',
    );

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('002-2026');
    expect(result.warnings).toEqual([]);
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

  it('should throw BadRequestException when hard precedence constraint (evalDate <= meetingDate) is violated', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    const invalidEvalDate = new Date('2026-10-14T09:00:00.000Z'); // ANTES de la reunión
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      evalSubmissionDeadline: invalidEvalDate,
      protocolVersionIds: [137],
    };

    await expect(useCase.execute(params)).rejects.toThrow(BadRequestException);
  });

  it('(TSK-009-N04) snapshot entregaDiasHabiles coincide con el calculado y hora es "12:00"', async () => {
    // Mock que devuelve 3 para SP_ENTREGA_EVALUACION_DIAS
    const mockWith3 = {
      get: (clave: SystemParamKey) =>
        clave === 'entrega_evaluacion_dias_habiles_tras_reunion'
          ? 3
          : SYSTEM_PARAM_FALLBACKS[clave],
    } as unknown as SystemParamsService;
    const svcWith3 = new CalculateMeetingDatesService(mockWith3);
    const ucWith3 = new CreateMeetingUseCase(
      repositoryMock,
      pdfGeneratorMock,
      svcWith3,
    );

    const meetingDate = new Date('2026-11-03T14:00:00.000Z'); // Lunes
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [137],
    };
    // Lunes + 3 días hábiles = Jueves 2026-11-06 17:00 UTC
    const savedEntity: MeetingEntity = {
      id: 'meet-snap',
      numeroConvocatoria: '010-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-11-06T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };
    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue('/pdf/010-2026.pdf');

    await ucWith3.execute(params);

    const callArgs =
      repositoryMock.saveMeetingWithAtomicNumber.mock.calls[0][0];
    expect(callArgs.entregaDiasHabiles).toBe(3);
    expect(callArgs.entregaHoraCorte).toBe('12:00');
    // La fecha de entrega calculada también debe corresponder a 3 días hábiles
    const evalDeadline =
      repositoryMock.saveMeetingWithAtomicNumber.mock.calls[0][2];
    expect(evalDeadline.toISOString()).toBe('2026-11-06T17:00:00.000Z');
  });

  it('should include soft warning when assignment review time is less than PLAZO_REVISION_OFICIO_DIAS', async () => {
    const meetingDate = new Date('2026-10-15T09:00:00.000Z');
    // 3 días hábiles de revisión disponibles (12, 13, 14 oct — se excluye el día de reunión 15)
    const recentAssignment = new Date('2026-10-10T14:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [137],
    };

    repositoryMock.getOldestAssignedDates.mockResolvedValueOnce([
      {
        protocolVersionId: 137,
        protocolCode: 'PROT-001',
        oldestAssignmentDate: recentAssignment,
      },
    ]);

    const savedEntity: MeetingEntity = {
      id: 'meet-003',
      numeroConvocatoria: '003-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
      '/storage/pdf/003-2026.pdf',
    );

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('003-2026');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('ADVERTENCIA_PLAZO_REVISION');
    expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalled();
  });
});
