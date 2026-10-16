/* eslint-disable @typescript-eslint/unbound-method */
jest.mock('fs');
import * as fs from 'fs';
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
import type {
  MeetingDetailEntity,
  MeetingPlaceFullModel,
} from '../../domain/entities/meeting.entity';
import {
  CreatePlaceDto,
  UpdatePlaceDto,
} from '../../application/dtos/create-place.dto';

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
      findAll: jest.fn(),
      findPendingProtocols: jest.fn(),
      findAllPlaces: jest.fn(),
      findPlaceById: jest.fn(),
      getOldestAssignedDates: jest.fn().mockResolvedValue([]),
      findNormativeDeadlineInputs: jest.fn().mockResolvedValue([]),
      findAssignedVersionsWithoutScheduledMeeting: jest
        .fn()
        .mockResolvedValue([]),
      createPlace: jest.fn(),
      updatePlace: jest.fn(),
      deletePlace: jest.fn(),
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
        warnings: [],
      });

      const result = await controller.createMeeting(dto);

      expect(result.statusCode).toBe(201);
      expect(result.data.meetingNumber).toBe('001-2026');
      expect(createMeetingUseCaseMock.execute).toHaveBeenCalled();
    });
  });

  describe('getMeeting', () => {
    it('should return meeting detail if found', async () => {
      const mockMeeting: MeetingDetailEntity = {
        id: 'meet-001',
        meetingNumber: '001-2026',
        academicYear: 2026,
        sessionType: SessionType.ORDINARIA,
        meetingDate: new Date('2026-10-15T09:00:00.000Z'),
        evalSubmissionDeadline: new Date('2026-10-08T23:59:59.000Z'),
        status: 'PROGRAMADA',
        place: null,
        protocolCount: 0,
        protocols: [],
      };

      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);

      const result = await controller.getMeeting('meet-001');

      expect(result.statusCode).toBe(200);
      expect(result.data.id).toBe('meet-001');
      expect(result.data.meetingNumber).toBe('001-2026');
    });

    it('should throw NotFoundException if meeting not found', async () => {
      meetingRepositoryMock.findById.mockResolvedValue(null);

      await expect(controller.getMeeting('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('downloadMeetingPdf', () => {
    const mockMeeting: MeetingDetailEntity = {
      id: 'meet-001',
      meetingNumber: '001-2026',
      academicYear: 2026,
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      evalSubmissionDeadline: new Date('2026-10-08T23:59:59.000Z'),
      status: 'PROGRAMADA',
      place: null,
      protocolCount: 0,
      protocols: [],
    };

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return StreamableFile and set pdf response headers when file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        Buffer.from('%PDF-1.4 unit test'),
      );
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);

      const resMock = { set: jest.fn() } as unknown as Response;
      const result = await controller.downloadMeetingPdf('meet-001', resMock);

      expect(result).toBeDefined();
      expect(resMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/pdf' }),
      );
    });

    it('should throw NotFoundException when meeting for pdf is not found', async () => {
      meetingRepositoryMock.findById.mockResolvedValue(null);

      const resMock = { set: jest.fn() } as unknown as Response;

      await expect(
        controller.downloadMeetingPdf('non-existent', resMock),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when PDF file does not exist after generation', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfGeneratorMock.generateAgendaPdf.mockResolvedValue(undefined as any);
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);

      const resMock = { set: jest.fn() } as unknown as Response;

      await expect(
        controller.downloadMeetingPdf('meet-001', resMock),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllPlaces', () => {
    const mockPlaces: MeetingPlaceFullModel[] = [
      {
        id: 'place-001',
        name: 'Sala A',
        address: 'Piso 1',
        isVirtual: false,
        meetingLink: null,
        isActive: true,
      },
    ];

    it('should return envelope with mapped places (solo activos por defecto)', async () => {
      meetingRepositoryMock.findAllPlaces.mockResolvedValue(mockPlaces);

      const result = await controller.findAllPlaces({});

      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Lugares obtenidos exitosamente');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'place-001',
        name: 'Sala A',
        isActive: true,
      });
      expect(meetingRepositoryMock.findAllPlaces).toHaveBeenCalledWith({
        includeInactive: undefined,
      });
    });

    it('should pass includeInactive=true to repository', async () => {
      meetingRepositoryMock.findAllPlaces.mockResolvedValue([]);

      await controller.findAllPlaces({ includeInactive: true });

      expect(meetingRepositoryMock.findAllPlaces).toHaveBeenCalledWith({
        includeInactive: true,
      });
    });

    it('should not expose ORM fields in response', async () => {
      meetingRepositoryMock.findAllPlaces.mockResolvedValue(mockPlaces);

      const result = await controller.findAllPlaces({});
      const item = result.data[0] as unknown as Record<string, unknown>;

      expect(item).not.toHaveProperty('nombre');
      expect(item).not.toHaveProperty('activo');
      expect(item).not.toHaveProperty('esVirtual');
    });
  });

  describe('findPlaceById', () => {
    const mockPlace: MeetingPlaceFullModel = {
      id: 'place-001',
      name: 'Sala A',
      address: null,
      isVirtual: false,
      meetingLink: null,
      isActive: true,
    };

    it('should return envelope with place DTO', async () => {
      meetingRepositoryMock.findPlaceById.mockResolvedValue(mockPlace);

      const result = await controller.findPlaceById('place-001');

      expect(result.statusCode).toBe(200);
      expect(result.data.id).toBe('place-001');
      expect(result.data.isActive).toBe(true);
    });

    it('should throw NotFoundException when place not found', async () => {
      meetingRepositoryMock.findPlaceById.mockResolvedValue(null);

      await expect(controller.findPlaceById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPlace', () => {
    it('should return 201 envelope with created place DTO', async () => {
      const mockResult: MeetingPlaceFullModel = {
        id: 'place-new',
        name: 'Sala Nueva',
        address: null,
        isVirtual: false,
        meetingLink: null,
        isActive: true,
      };
      meetingRepositoryMock.createPlace.mockResolvedValue(mockResult);

      const dto = Object.assign(new CreatePlaceDto(), { name: 'Sala Nueva' });
      const result = await controller.createPlace(dto);

      expect(result.statusCode).toBe(201);
      expect(result.data.id).toBe('place-new');
      expect(result.data.name).toBe('Sala Nueva');
    });
  });

  describe('updatePlace', () => {
    it('should return envelope with updated place DTO', async () => {
      const mockResult: MeetingPlaceFullModel = {
        id: 'place-001',
        name: 'Sala Actualizada',
        address: 'Piso 2',
        isVirtual: false,
        meetingLink: null,
        isActive: true,
      };
      meetingRepositoryMock.updatePlace.mockResolvedValue(mockResult);

      const dto = Object.assign(new UpdatePlaceDto(), {
        name: 'Sala Actualizada',
      });
      const result = await controller.updatePlace('place-001', dto);

      expect(result.statusCode).toBe(200);
      expect(result.data.name).toBe('Sala Actualizada');
    });
  });

  describe('deletePlace', () => {
    it('should return envelope with message on soft delete', async () => {
      meetingRepositoryMock.deletePlace.mockResolvedValue(undefined);

      const result = await controller.deletePlace('place-001');

      expect(result.statusCode).toBe(200);
      expect(result.message).toMatch(/desactivado/i);
    });
  });
});
