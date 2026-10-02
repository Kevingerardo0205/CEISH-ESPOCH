/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { MeetingsController } from './meetings.controller';
import { CreateMeetingUseCase } from '../../application/services/create-meeting.use-case';
import { CalculateMeetingDatesService } from '../../application/services/calculate-meeting-dates.service';
import type { CreateMeetingDto } from '../../application/dtos/create-meeting.dto';
import type { CalculateEvalDateDto } from '../../application/dtos/calculate-eval-date.dto';
import { SessionType } from '../database/entities/convocatoria.orm-entity';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import type { MeetingEntity } from '../../domain/entities/meeting.entity';

describe('MeetingsController (T017 / RF-09)', () => {
  let controller: MeetingsController;
  let createMeetingUseCaseMock: jest.Mocked<CreateMeetingUseCase>;
  let calculateDatesServiceMock: jest.Mocked<CalculateMeetingDatesService>;
  let meetingRepositoryMock: jest.Mocked<IMeetingRepositoryPort>;
  let pdfGeneratorMock: jest.Mocked<IMeetingPdfGeneratorPort>;

  beforeEach(async () => {
    createMeetingUseCaseMock = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateMeetingUseCase>;

    calculateDatesServiceMock = {
      calculateSuggestedEvalDeadline: jest.fn(),
    } as unknown as jest.Mocked<CalculateMeetingDatesService>;

    meetingRepositoryMock = {
      saveMeetingWithAtomicNumber: jest.fn(),
      findById: jest.fn(),
    };

    pdfGeneratorMock = {
      generateAgendaPdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsController],
      providers: [
        {
          provide: CreateMeetingUseCase,
          useValue: createMeetingUseCaseMock,
        },
        {
          provide: CalculateMeetingDatesService,
          useValue: calculateDatesServiceMock,
        },
        {
          provide: 'IMeetingRepositoryPort',
          useValue: meetingRepositoryMock,
        },
        {
          provide: 'IMeetingPdfGeneratorPort',
          useValue: pdfGeneratorMock,
        },
      ],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
  });

  describe('calculateEvalDate', () => {
    it('should calculate suggested evaluation date', () => {
      const dto: CalculateEvalDateDto = {
        meetingDate: '2026-10-15T09:00:00.000Z',
      };

      const suggestedDate = new Date('2026-10-08T23:59:59.999Z');
      calculateDatesServiceMock.calculateSuggestedEvalDeadline.mockReturnValue(
        suggestedDate,
      );

      const result = controller.calculateEvalDate(dto);

      expect(result.statusCode).toBe(200);
      expect(result.data.suggestedEvalSubmissionDeadline).toBe(
        suggestedDate.toISOString(),
      );
    });
  });

  describe('createMeeting', () => {
    it('should create and schedule a meeting', async () => {
      const dto: CreateMeetingDto = {
        sessionType: SessionType.ORDINARIA,
        meetingDate: '2026-10-15T09:00:00.000Z',
        evalSubmissionDeadline: '2026-10-08T23:59:59.000Z',
        locationId: 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22',
        protocolVersionIds: [137],
        followUpReportIds: [10],
      };

      createMeetingUseCaseMock.execute.mockResolvedValue({
        id: 'meet-001',
        meetingNumber: '001-2026',
        pdfUrl: '/api/evaluations/meetings/meet-001/pdf',
      });

      const result = await controller.createMeeting(dto);

      expect(result.statusCode).toBe(201);
      expect(result.data.meetingNumber).toBe('001-2026');
      expect(createMeetingUseCaseMock.execute).toHaveBeenCalled();
    });
  });

  describe('getMeeting', () => {
    it('should return meeting detail if found', async () => {
      const mockMeeting: MeetingEntity = {
        id: 'meet-001',
        numeroConvocatoria: '001-2026',
        anioLectivo: 2026,
        tipoSession: SessionType.ORDINARIA,
        fechaReunion: new Date('2026-10-15T09:00:00.000Z'),
        fechaEntregaEvaluacion: new Date('2026-10-08T23:59:59.000Z'),
        estado: 'PROGRAMADA',
      };

      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);

      const result = await controller.getMeeting('meet-001');

      expect(result.statusCode).toBe(200);
      expect(result.data.id).toBe('meet-001');
      expect(result.data.numeroConvocatoria).toBe('001-2026');
    });

    it('should throw NotFoundException if meeting not found', async () => {
      meetingRepositoryMock.findById.mockResolvedValue(null);

      await expect(controller.getMeeting('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('downloadMeetingPdf', () => {
    it('should return StreamableFile and set pdf response headers', async () => {
      const mockMeeting: MeetingEntity = {
        id: 'meet-001',
        numeroConvocatoria: '001-2026',
        anioLectivo: 2026,
        tipoSession: SessionType.ORDINARIA,
        fechaReunion: new Date('2026-10-15T09:00:00.000Z'),
        fechaEntregaEvaluacion: new Date('2026-10-08T23:59:59.000Z'),
        estado: 'PROGRAMADA',
      };

      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(
        '/api/evaluations/meetings/meet-001/pdf',
      );

      const resMock = {
        set: jest.fn(),
      } as unknown as Response;

      const result = await controller.downloadMeetingPdf('meet-001', resMock);

      expect(result).toBeDefined();
      expect(resMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
    });

    it('should throw NotFoundException when meeting for pdf is not found', async () => {
      meetingRepositoryMock.findById.mockResolvedValue(null);

      const resMock = {
        set: jest.fn(),
      } as unknown as Response;

      await expect(
        controller.downloadMeetingPdf('non-existent', resMock),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
