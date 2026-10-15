/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import type { IMeetingRepositoryPort } from '../src/modules/evaluations/domain/ports/meeting-repository.port';
import { MeetingNumberValueObject } from '../src/modules/evaluations/domain/value-objects/meeting-number.vo';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IUserRepository } from '../src/modules/auth/domain/ports/user.repository.port';

describe('Meetings E2E Suite - [TSK-009-010 / RF-09 / RF-15]', () => {
  let app: INestApplication;
  let currentSequence = 9;

  const mockMeetingsMap = new Map<string, any>();

  const meetingRepositoryMock: IMeetingRepositoryPort = {
    saveMeetingWithAtomicNumber: jest
      .fn()
      .mockImplementation((params, academicYearStr, evalDeadline) => {
        const year = parseInt(academicYearStr, 10);
        currentSequence += 1;
        const meetingVo = MeetingNumberValueObject.fromSequence(
          currentSequence,
          year,
        );

        // UUID determinista basado en la secuencia para que ParseUUIDPipe lo acepte
        const paddedSeq = String(currentSequence).padStart(12, '0');
        const id = `f47ac10b-58cc-4372-a567-${paddedSeq}`;

        const meetingRecord = {
          id,
          numeroConvocatoria: meetingVo.value,
          anioLectivo: year,
          tipoSession: params.sessionType,
          fechaReunion: params.meetingDate,
          fechaEntregaEvaluacion: evalDeadline,
          estado: 'PROGRAMADA',
          ordenDiaPdfPath: `/api/evaluations/meetings/${id}/pdf`,
        };

        mockMeetingsMap.set(meetingRecord.id, meetingRecord);
        return Promise.resolve(meetingRecord);
      }),
    findById: jest.fn().mockImplementation((id: string) => {
      const r = mockMeetingsMap.get(id);
      if (!r) return Promise.resolve(null);
      // Devuelve MeetingDetailModel con Date (el mapper convierte a ISO en el controller)
      return Promise.resolve({
        id: r.id,
        meetingNumber: r.numeroConvocatoria,
        academicYear: r.anioLectivo ?? null,
        sessionType: r.tipoSession,
        meetingDate: r.fechaReunion ? new Date(r.fechaReunion) : null,
        evalSubmissionDeadline: r.fechaEntregaEvaluacion
          ? new Date(r.fechaEntregaEvaluacion)
          : null,
        status: r.estado,
        place: null,
        protocolCount: 0,
        protocols: [],
      });
    }),
    findAll: jest.fn().mockImplementation(() => {
      // Devuelve MeetingSummaryModel[] con Date (el mapper convierte a ISO)
      const items = Array.from(mockMeetingsMap.values()).map((r) => ({
        id: r.id,
        meetingNumber: r.numeroConvocatoria,
        academicYear: r.anioLectivo ?? null,
        sessionType: r.tipoSession,
        meetingDate: r.fechaReunion ? new Date(r.fechaReunion) : null,
        evalSubmissionDeadline: r.fechaEntregaEvaluacion
          ? new Date(r.fechaEntregaEvaluacion)
          : null,
        status: r.estado,
        place: null,
        protocolCount: 0,
      }));
      return Promise.resolve({
        items,
        total: items.length,
        page: 1,
        limit: 10,
      });
    }),
    findPendingProtocols: jest.fn().mockResolvedValue([]),
    findAllPlaces: jest.fn().mockResolvedValue([]),
    findPlaceById: jest.fn().mockResolvedValue(null),
    createPlace: jest
      .fn()
      .mockImplementation(
        (data: {
          nombre: string;
          direccion?: string;
          esVirtual?: boolean;
          enlaceReunion?: string;
          activo?: boolean;
        }) =>
          Promise.resolve({
            id: 'place-uuid-1',
            name: data.nombre,
            address: data.direccion ?? null,
            isVirtual: data.esVirtual ?? false,
            meetingLink: data.enlaceReunion ?? null,
            isActive: data.activo ?? true,
          }),
      ),
    updatePlace: jest.fn().mockImplementation(
      (
        id: string,
        data: {
          nombre?: string;
          direccion?: string;
          esVirtual?: boolean;
          enlaceReunion?: string;
          activo?: boolean;
        },
      ) =>
        Promise.resolve({
          id,
          name: data.nombre ?? 'Sala',
          address: data.direccion ?? null,
          isVirtual: data.esVirtual ?? false,
          meetingLink: data.enlaceReunion ?? null,
          isActive: data.activo ?? true,
        }),
    ),
    deletePlace: jest.fn().mockResolvedValue(undefined),
    getOldestAssignedDates: jest.fn().mockResolvedValue([]),
    findNormativeDeadlineInputs: jest.fn().mockResolvedValue([]),
    findAssignedVersionsWithoutScheduledMeeting: jest
      .fn()
      .mockResolvedValue([]),
  };

  const mockPdfGenerator = {
    generateAgendaPdf: jest.fn().mockImplementation((meetingId: string) =>
      Promise.resolve({
        url: `/api/evaluations/meetings/${meetingId}/pdf`,
        buffer: Buffer.alloc(1),
      }),
    ),
  };

  const mockEmailService = {
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
  };

  const mockUserRepository = {
    findByRoleCodes: jest.fn().mockResolvedValue([]),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findWithToken: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 1,
            email: 'secretaria@ceish.com',
            roles: ['SECRETARIA', 'ADMIN'],
            temporalRoles: [],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideProvider('IMeetingRepositoryPort')
      .useValue(meetingRepositoryMock)
      .overrideProvider('IMeetingPdfGeneratorPort')
      .useValue(mockPdfGenerator)
      .overrideProvider(IEmailServicePort)
      .useValue(mockEmailService)
      .overrideProvider(IUserRepository)
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/evaluations/meetings/calculate-eval-date', () => {
    it('debe calcular la fecha sugerida de entrega de evaluacion correctamente (HTTP 200)', async () => {
      const meetingDate = '2026-04-16T10:00:00.000Z'; // Jueves
      const response = await request(app.getHttpServer())
        .post('/api/evaluations/meetings/calculate-eval-date')
        .send({ meetingDate })
        .expect(200);

      const data = response.body.data || response.body;
      expect(data).toHaveProperty('suggestedEvalSubmissionDeadline');
      expect(data.suggestedEvalSubmissionDeadline).toBeDefined();
    });

    it('debe retornar 400 Bad Request si la fecha de reunion no es ISO8601 valida', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/meetings/calculate-eval-date')
        .send({ meetingDate: 'invalid-date' })
        .expect(400);
    });
  });

  describe('POST /api/evaluations/meetings', () => {
    it('debe rechazar con HTTP 400 si la fecha de entrega de evaluacion es anterior o igual a la fecha de reunion', async () => {
      const invalidPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-04-10T10:00:00.000Z',
        evalSubmissionDeadline: '2026-04-09T10:00:00.000Z', // anterior a la reunión
        protocolVersionIds: [137],
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(invalidPayload)
        .expect(400);

      const msg = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(msg).toContain('FECHA_EVALUACION_INVALIDA');
    });

    it('debe rechazar con HTTP 400 si el Orden del Día está vacío (sin protocolos ni informes)', async () => {
      const emptyAgendaPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-04-16T10:00:00.000Z',
        evalSubmissionDeadline: '2026-04-21T17:00:00.000Z', // posterior a la reunión
        protocolVersionIds: [],
        followUpReportIds: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(emptyAgendaPayload)
        .expect(400);

      const msg = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(msg).toContain('ORDEN_DEL_DIA_VACIO');
    });

    it('debe crear exitosamente la convocatoria (HTTP 201) con protocolVersionIds', async () => {
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-04-16T10:00:00.000Z',
        evalSubmissionDeadline: '2026-04-21T17:00:00.000Z', // +2 días hábiles a las 12:00 ECT
        protocolVersionIds: [137],
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(validPayload)
        .expect(201);

      const data = response.body.data || response.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('meetingNumber');
      expect(data.meetingNumber).toMatch(/^\d{3}-2026$/);
      expect(data).toHaveProperty('agendaPdfUrl');
      expect(response.body).toHaveProperty('advertencias');
      expect(Array.isArray(response.body.advertencias)).toBe(true);
    });

    it('debe calcular automáticamente una fecha de entrega POSTERIOR a la reunión cuando no se provee (TSK-009-N05)', async () => {
      const meetingDate = '2026-04-22T10:00:00.000Z';
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate,
        protocolVersionIds: [137],
      };

      const response = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(validPayload)
        .expect(201);

      expect(response.body).toHaveProperty('advertencias');
      expect(Array.isArray(response.body.advertencias)).toBe(true);
      // El repositorio mock captura evalDeadline — verificar que sea posterior a meetingDate
      const capturedCall = (
        meetingRepositoryMock.saveMeetingWithAtomicNumber as jest.Mock
      ).mock.calls.at(-1);
      const capturedEvalDeadline: Date = capturedCall[2];
      expect(capturedEvalDeadline.getTime()).toBeGreaterThan(
        new Date(meetingDate).getTime(),
      );
    });
  });

  describe('GET /api/evaluations/meetings (TEST-M1-01)', () => {
    it('debe retornar HTTP 200 con envelope {statusCode,message,data[],meta}', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(typeof res.body.message).toBe('string');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.page).toBe('number');
      expect(typeof res.body.meta.limit).toBe('number');
    });

    it('cada item del listado tiene los campos del contrato estable', async () => {
      // Crear una convocatoria para que el mock findAll la incluya
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-07-10T09:00:00.000Z',
        evalSubmissionDeadline: '2026-07-15T17:00:00.000Z',
        protocolVersionIds: [200],
      };
      await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(validPayload)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      const item = res.body.data[0];
      // Campos obligatorios del contrato
      expect(typeof item.id).toBe('string');
      expect(typeof item.meetingNumber).toBe('string');
      expect(typeof item.sessionType).toBe('string');
      expect(typeof item.status).toBe('string');
      expect(typeof item.protocolCount).toBe('number');
      // agendaPdfUrl generada por el mapper
      expect(typeof item.agendaPdfUrl).toBe('string');
      expect(item.agendaPdfUrl).toContain('/api/evaluations/meetings/');
      expect(item.agendaPdfUrl).toContain('/pdf');
      // meetingDate es ISO string o null (nunca objeto Date crudo)
      if (item.meetingDate !== null) {
        expect(typeof item.meetingDate).toBe('string');
        expect(() => new Date(item.meetingDate)).not.toThrow();
      }
      // Sin PII
      expect(item).not.toHaveProperty('email');
      expect(item).not.toHaveProperty('phone');
      // Sin fugas ORM
      expect(item).not.toHaveProperty('numeroConvocatoria');
      expect(item).not.toHaveProperty('fechaReunion');
    });
  });

  describe('GET /api/evaluations/meetings/pending-protocols (TEST-M1-02)', () => {
    it('debe retornar HTTP 200 con envelope {statusCode,message,data[]}', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/pending-protocols')
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(typeof res.body.message).toBe('string');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('los items de pending-protocols tienen campos tipados y sin PII', async () => {
      // Inyectar un item con Date en el mock
      (
        meetingRepositoryMock.findPendingProtocols as jest.Mock
      ).mockResolvedValueOnce([
        {
          protocolId: 42,
          versionId: 137,
          versionNumber: 2,
          ceishCode: 'CEISH-042-2026',
          title: 'Estudio clínico fase II',
          studyType: 'Ensayo clínico',
          investigatorName: 'Juan Pérez',
          receptionDate: new Date('2026-09-15T00:00:00.000Z'),
          deadline: new Date('2026-10-15T00:00:00.000Z'),
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/pending-protocols')
        .expect(200);

      expect(res.body.data.length).toBe(1);
      const item = res.body.data[0];
      // Campos tipados del contrato
      expect(typeof item.protocolId).toBe('number');
      expect(typeof item.versionId).toBe('number');
      // deadline e ISO strings (no Date objects crudos)
      expect(typeof item.deadline).toBe('string');
      expect(typeof item.receptionDate).toBe('string');
      expect(() => new Date(item.deadline)).not.toThrow();
      expect(() => new Date(item.receptionDate)).not.toThrow();
      // Sin PII
      expect(item).not.toHaveProperty('email');
      expect(item).not.toHaveProperty('phone');
      // Sin fugas ORM
      expect(item).not.toHaveProperty('protocoloId');
      expect(item).not.toHaveProperty('fecha_recepcion');
    });
  });

  describe('GET /api/evaluations/meetings/:id', () => {
    it('debe retornar HTTP 200 con la información detallada de la convocatoria existente', async () => {
      // Crear primero una convocatoria
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-05-20T09:00:00.000Z',
        evalSubmissionDeadline: '2026-05-22T17:00:00.000Z', // posterior a la reunión
        protocolVersionIds: [140],
      };

      const createRes = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(validPayload)
        .expect(201);

      const meetingId = (createRes.body.data || createRes.body).id;

      const getRes = await request(app.getHttpServer())
        .get(`/api/evaluations/meetings/${meetingId}`)
        .expect(200);

      const data = getRes.body.data || getRes.body;
      expect(data.id).toBe(meetingId);
      expect(typeof data.meetingNumber).toBe('string');
      expect(typeof data.status).toBe('string');
      // Campos del contrato estable
      expect(typeof data.agendaPdfUrl).toBe('string');
      expect(data.agendaPdfUrl).toContain('/pdf');
      // meetingDate es ISO string (generado por mapper, no Date crudo)
      if (data.meetingDate !== null) {
        expect(typeof data.meetingDate).toBe('string');
        expect(() => new Date(data.meetingDate)).not.toThrow();
      }
      expect(Array.isArray(data.protocols)).toBe(true);
      // Sin PII y sin fugas ORM
      expect(data).not.toHaveProperty('email');
      expect(data).not.toHaveProperty('fechaReunion');
      expect(data).not.toHaveProperty('numeroConvocatoria');
    });

    it('debe retornar HTTP 404 si la convocatoria no existe (UUID válido, no registrado)', async () => {
      // 'non-existent-id' ahora retorna 400 por ParseUUIDPipe; se usa un UUID válido inexistente
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/00000000-0000-0000-0000-000000000001')
        .expect(404);
    });

    it('debe retornar HTTP 400 si el id no tiene formato UUID (validación ParseUUIDPipe)', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/1')
        .expect(400);
    });
  });

  describe('GET /api/evaluations/meetings/:id/pdf', () => {
    it('debe retornar HTTP 200 con cabecera application/pdf para una convocatoria existente', async () => {
      const validPayload = {
        sessionType: 'EXTRAORDINARIA',
        meetingDate: '2026-06-18T10:00:00.000Z',
        evalSubmissionDeadline: '2026-06-22T17:00:00.000Z', // posterior a la reunión
        protocolVersionIds: [50],
      };

      const createRes = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .send(validPayload)
        .expect(201);

      const meetingId = (createRes.body.data || createRes.body).id;

      const pdfRes = await request(app.getHttpServer())
        .get(`/api/evaluations/meetings/${meetingId}/pdf`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toContain('application/pdf');
    });

    it('debe retornar HTTP 404 al intentar descargar el PDF de una convocatoria inexistente (UUID válido, no registrado)', async () => {
      // 'non-existent-id' ahora retorna 400 por ParseUUIDPipe; se usa un UUID válido inexistente
      await request(app.getHttpServer())
        .get(
          '/api/evaluations/meetings/00000000-0000-0000-0000-000000000001/pdf',
        )
        .expect(404);
    });

    it('debe retornar HTTP 400 al solicitar PDF con id que no tiene formato UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/1/pdf')
        .expect(400);
    });
  });
});
