/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unnecessary-type-assertion */
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
import type { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import type { IUserRepository } from '../../../auth/domain/ports/user.repository.port';

const mockSystemParams = {
  get: (clave: SystemParamKey) => SYSTEM_PARAM_FALLBACKS[clave],
} as unknown as SystemParamsService;

const flushAsync = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('CreateMeetingUseCase (T008 / TSK-009-006)', () => {
  let useCase: CreateMeetingUseCase;
  let repositoryMock: jest.Mocked<IMeetingRepositoryPort>;
  let pdfGeneratorMock: jest.Mocked<IMeetingPdfGeneratorPort>;
  let emailServiceMock: jest.Mocked<IEmailServicePort>;
  let userRepoMock: jest.Mocked<IUserRepository>;
  let calculateDatesService: CalculateMeetingDatesService;

  beforeEach(() => {
    repositoryMock = {
      saveMeetingWithAtomicNumber: jest.fn(),
      getOldestAssignedDates: jest.fn().mockResolvedValue([]),
      findNormativeDeadlineInputs: jest.fn().mockResolvedValue([]),
      findAssignedVersionsWithoutScheduledMeeting: jest
        .fn()
        .mockResolvedValue([]),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPendingProtocols: jest.fn(),
      findAllPlaces: jest.fn(),
      findPlaceById: jest.fn().mockResolvedValue(null),
      createPlace: jest.fn(),
      updatePlace: jest.fn(),
      deletePlace: jest.fn(),
    };
    pdfGeneratorMock = {
      generateAgendaPdf: jest.fn().mockResolvedValue({
        url: '/api/evaluations/meetings/meet-001/pdf',
        buffer: Buffer.from('PDF'),
      }),
    };
    emailServiceMock = {
      sendCallNotification: jest.fn().mockResolvedValue(undefined),
      sendPasswordReset: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendEmailConfirmation: jest.fn(),
      sendAccountInvitation: jest.fn(),
      sendReceptionIncomplete: jest.fn(),
      sendReceptionComplete: jest.fn(),
      sendResolutionEmail: jest.fn(),
      notifyPresidentNewProtocol: jest.fn(),
      sendEvaluationAssignment: jest.fn(),
      sendEvaluationSubmitted: jest.fn(),
      sendUnscheduledProtocolsAlert: jest.fn(),
    } as unknown as jest.Mocked<IEmailServicePort>;
    userRepoMock = {
      findByRoleCodes: jest.fn().mockResolvedValue([
        {
          id: 1,
          fullName: 'Evaluador Uno',
          institutionalEmail: 'eval1@espoch.edu.ec',
        },
        {
          id: 2,
          fullName: 'Presidente CEISH',
          institutionalEmail: 'pres@espoch.edu.ec',
        },
      ]),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findWithToken: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    calculateDatesService = new CalculateMeetingDatesService(mockSystemParams);

    useCase = new CreateMeetingUseCase(
      repositoryMock,
      pdfGeneratorMock,
      calculateDatesService,
      emailServiceMock,
      userRepoMock,
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
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-001/pdf',
      buffer: Buffer.from('PDF'),
    });

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('001-2026');
    expect(result.warnings).toEqual([]);
    expect(result.pdfUrl).toBe('/api/evaluations/meetings/meet-001/pdf');
    expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalled();
  });

  describe('TSK-009-N09: guard SEGUIMIENTO_NO_DISPONIBLE', () => {
    it('(N09-a) followUpReportIds no vacío → rechaza con BadRequestException SEGUIMIENTO_NO_DISPONIBLE; repo/pdf/email no se invocan', async () => {
      const params = {
        sessionType: SessionType.ORDINARIA,
        meetingDate: new Date('2026-10-15T09:00:00.000Z'),
        followUpReportIds: [201, 202],
      };

      await expect(useCase.execute(params)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(params)).rejects.toThrow(
        'SEGUIMIENTO_NO_DISPONIBLE',
      );
      expect(repositoryMock.saveMeetingWithAtomicNumber).not.toHaveBeenCalled();
      expect(pdfGeneratorMock.generateAgendaPdf).not.toHaveBeenCalled();
      expect(emailServiceMock.sendCallNotification).not.toHaveBeenCalled();
    });

    it('(N09-b) mezcla protocolVersionIds + followUpReportIds → también rechaza, sin persistencia', async () => {
      const params = {
        sessionType: SessionType.ORDINARIA,
        meetingDate: new Date('2026-10-15T09:00:00.000Z'),
        protocolVersionIds: [137],
        followUpReportIds: [99],
      };

      await expect(useCase.execute(params)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(params)).rejects.toThrow(
        'SEGUIMIENTO_NO_DISPONIBLE',
      );
      expect(repositoryMock.saveMeetingWithAtomicNumber).not.toHaveBeenCalled();
    });

    it('(N09-c) followUpReportIds = [] + protocolVersionIds → pasa el guard y crea la convocatoria', async () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      const params = {
        sessionType: SessionType.ORDINARIA,
        meetingDate,
        protocolVersionIds: [137],
        followUpReportIds: [],
      };

      const savedEntity: MeetingEntity = {
        id: 'meet-n09-c',
        numeroConvocatoria: '002-2026',
        anioLectivo: 2026,
        tipoSession: SessionType.ORDINARIA,
        fechaReunion: meetingDate,
        fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
        estado: ConvocatoriaStatus.PROGRAMADA,
      };
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);

      const result = await useCase.execute(params);

      expect(result.meetingNumber).toBe('002-2026');
      expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalledTimes(
        1,
      );
    });

    it('(N09-d) followUpReportIds = undefined + protocolVersionIds → pasa el guard y crea la convocatoria', async () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      const params = {
        sessionType: SessionType.ORDINARIA,
        meetingDate,
        protocolVersionIds: [137],
      };

      const savedEntity: MeetingEntity = {
        id: 'meet-n09-d',
        numeroConvocatoria: '003-2026',
        anioLectivo: 2026,
        tipoSession: SessionType.ORDINARIA,
        fechaReunion: meetingDate,
        fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
        estado: ConvocatoriaStatus.PROGRAMADA,
      };
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);

      const result = await useCase.execute(params);

      expect(result.meetingNumber).toBe('003-2026');
      expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalledTimes(
        1,
      );
    });
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
      emailServiceMock,
      userRepoMock,
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
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-snap/pdf',
      buffer: Buffer.from('PDF'),
    });

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

  it('(TSK-009-N06) advertencia ADVERTENCIA_PLAZO_NORMATIVO cuando receptionDate antigua → evalDeadline supera plazo normativo', async () => {
    // receptionDate = 2025-01-01: normativeDeadline ≈ 45 biz days → ~2025-03-05
    // meetingDate = 2026-10-15, evalDeadline auto ≈ 2026-10-19 >> 2025-03-05 → WARNING
    const meetingDate = new Date('2026-10-15T14:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [137],
    };

    repositoryMock.findNormativeDeadlineInputs.mockResolvedValueOnce([
      {
        protocolVersionId: 137,
        protocolCode: 'PROT-EXPEDITA',
        reviewType: 'EXPEDITA',
        receptionDate: new Date('2025-01-01T05:00:00.000Z'),
      },
    ]);

    const savedEntity: MeetingEntity = {
      id: 'meet-n06-1',
      numeroConvocatoria: '050-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-n06-1/pdf',
      buffer: Buffer.from('PDF'),
    });

    const result = await useCase.execute(params);

    const normativeWarnings = result.warnings.filter((w) =>
      w.includes('ADVERTENCIA_PLAZO_NORMATIVO'),
    );
    expect(normativeWarnings.length).toBe(1);
    expect(normativeWarnings[0]).toContain('PROT-EXPEDITA');
  });

  it('(TSK-009-N06) sin advertencia normativa cuando receptionDate reciente → evalDeadline anterior al plazo', async () => {
    // receptionDate = 2026-10-01: normativeDeadline ≈ 45 biz days → ~2026-12-03
    // evalDeadline ≈ 2026-10-19 < 2026-12-03 → NO warning
    const meetingDate = new Date('2026-10-15T14:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [137],
    };

    repositoryMock.findNormativeDeadlineInputs.mockResolvedValueOnce([
      {
        protocolVersionId: 137,
        protocolCode: 'PROT-RECIENTE',
        reviewType: 'EXPEDITA',
        receptionDate: new Date('2026-10-01T05:00:00.000Z'),
      },
    ]);

    const savedEntity: MeetingEntity = {
      id: 'meet-n06-2',
      numeroConvocatoria: '051-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-n06-2/pdf',
      buffer: Buffer.from('PDF'),
    });

    const result = await useCase.execute(params);

    const normativeWarnings = result.warnings.filter((w) =>
      w.includes('ADVERTENCIA_PLAZO_NORMATIVO'),
    );
    expect(normativeWarnings.length).toBe(0);
  });

  it('(TSK-009-N06) sin advertencia normativa cuando receptionDate es undefined (omite protocolo, emite logger.warn)', async () => {
    const meetingDate = new Date('2026-10-15T14:00:00.000Z');
    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate,
      protocolVersionIds: [137],
    };

    repositoryMock.findNormativeDeadlineInputs.mockResolvedValueOnce([
      {
        protocolVersionId: 137,
        protocolCode: 'PROT-SIN-RECEPCION',
        reviewType: 'EXPEDITA',
        receptionDate: undefined,
      },
    ]);

    const savedEntity: MeetingEntity = {
      id: 'meet-n06-3',
      numeroConvocatoria: '052-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: meetingDate,
      fechaEntregaEvaluacion: new Date('2026-10-19T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    };

    repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(savedEntity);
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-n06-3/pdf',
      buffer: Buffer.from('PDF'),
    });

    const result = await useCase.execute(params);

    const normativeWarnings = result.warnings.filter((w) =>
      w.includes('ADVERTENCIA_PLAZO_NORMATIVO'),
    );
    expect(normativeWarnings.length).toBe(0);
    expect(
      result.warnings.filter((w) => w.includes('ADVERTENCIA_PLAZO_REVISION'))
        .length,
    ).toBe(0);
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
    pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
      url: '/api/evaluations/meetings/meet-003/pdf',
      buffer: Buffer.from('PDF'),
    });

    const result = await useCase.execute(params);

    expect(result.meetingNumber).toBe('003-2026');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('ADVERTENCIA_PLAZO_REVISION');
    expect(repositoryMock.saveMeetingWithAtomicNumber).toHaveBeenCalled();
  });

  describe('TSK-009-N08: notificación por correo con PDF (fire-and-forget)', () => {
    const buildSavedEntity = (id = 'meet-n08'): MeetingEntity => ({
      id,
      numeroConvocatoria: '070-2026',
      anioLectivo: 2026,
      tipoSession: SessionType.ORDINARIA,
      fechaReunion: new Date('2026-11-05T14:00:00.000Z'),
      fechaEntregaEvaluacion: new Date('2026-11-07T17:00:00.000Z'),
      estado: ConvocatoriaStatus.PROGRAMADA,
    });

    const baseParams = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-11-05T14:00:00.000Z'),
      protocolVersionIds: [99],
    };

    it('(a) éxito: sendCallNotification se invoca una vez por miembro con el buffer correcto', async () => {
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(
        buildSavedEntity(),
      );
      const pdfBuffer = Buffer.from('MOCK-PDF');
      pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
        url: '/api/evaluations/meetings/meet-n08/pdf',
        buffer: pdfBuffer,
      });
      userRepoMock.findByRoleCodes.mockResolvedValue([
        {
          id: 10,
          fullName: 'Eva Luador',
          institutionalEmail: 'eva@espoch.edu.ec',
        },
        {
          id: 20,
          fullName: 'Pres CEISH',
          institutionalEmail: 'pres@espoch.edu.ec',
        },
      ]);

      await useCase.execute(baseParams);
      await flushAsync();

      expect(emailServiceMock.sendCallNotification).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const firstCall = (emailServiceMock.sendCallNotification as jest.Mock)
        .mock.calls[0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(firstCall[6]).toBe(pdfBuffer);
    });

    it('(b) falla de PDF: use case devuelve resultado sin lanzar, correo no enviado', async () => {
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(
        buildSavedEntity('meet-n08-b'),
      );
      pdfGeneratorMock.generateAgendaPdf.mockRejectedValue(
        new Error('PDF error'),
      );

      const result = await useCase.execute(baseParams);
      await flushAsync();

      expect(result.id).toBe('meet-n08-b');
      expect(emailServiceMock.sendCallNotification).not.toHaveBeenCalled();
    });

    it('(c) falla de correo de un miembro: no revierte, los demás miembros reciben', async () => {
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(
        buildSavedEntity('meet-n08-c'),
      );
      pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
        url: '/api/evaluations/meetings/meet-n08-c/pdf',
        buffer: Buffer.from('PDF'),
      });
      userRepoMock.findByRoleCodes.mockResolvedValue([
        {
          id: 10,
          fullName: 'Falla',
          institutionalEmail: 'falla@espoch.edu.ec',
        },
        { id: 20, fullName: 'OK', institutionalEmail: 'ok@espoch.edu.ec' },
      ]);
      (emailServiceMock.sendCallNotification as jest.Mock)
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);

      await expect(useCase.execute(baseParams)).resolves.not.toThrow();
      await flushAsync();

      expect(emailServiceMock.sendCallNotification).toHaveBeenCalledTimes(2);
    });

    it('(d) sin miembros activos: use case no lanza, correo no enviado', async () => {
      repositoryMock.saveMeetingWithAtomicNumber.mockResolvedValue(
        buildSavedEntity('meet-n08-d'),
      );
      pdfGeneratorMock.generateAgendaPdf.mockResolvedValue({
        url: '/api/evaluations/meetings/meet-n08-d/pdf',
        buffer: Buffer.from('PDF'),
      });
      userRepoMock.findByRoleCodes.mockResolvedValue([]);

      await expect(useCase.execute(baseParams)).resolves.not.toThrow();
      await flushAsync();

      expect(emailServiceMock.sendCallNotification).not.toHaveBeenCalled();
    });

    it('(e) orden: saveMeetingWithAtomicNumber antes que generateAgendaPdf antes que sendCallNotification', async () => {
      const callOrder: string[] = [];
      repositoryMock.saveMeetingWithAtomicNumber.mockImplementation(() => {
        callOrder.push('save');
        return Promise.resolve(buildSavedEntity('meet-n08-e'));
      });
      pdfGeneratorMock.generateAgendaPdf.mockImplementation(() => {
        callOrder.push('pdf');
        return Promise.resolve({ url: '/pdf/e', buffer: Buffer.from('PDF') });
      });
      userRepoMock.findByRoleCodes.mockResolvedValue([
        {
          id: 1,
          fullName: 'Miembro',
          institutionalEmail: 'miembro@espoch.edu.ec',
        },
      ]);
      (emailServiceMock.sendCallNotification as jest.Mock).mockImplementation(
        () => {
          callOrder.push('email');
          return Promise.resolve();
        },
      );

      await useCase.execute(baseParams);
      await flushAsync();

      expect(callOrder[0]).toBe('save');
      expect(callOrder[1]).toBe('pdf');
      expect(callOrder[2]).toBe('email');
    });
  });
});
