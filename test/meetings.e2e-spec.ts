/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import type { IMeetingRepositoryPort } from '../src/modules/evaluations/domain/ports/meeting-repository.port';
import { MeetingNumberValueObject } from '../src/modules/evaluations/domain/value-objects/meeting-number.vo';

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

        const meetingRecord = {
          id: `meet-uuid-${currentSequence}`,
          numeroConvocatoria: meetingVo.value,
          anioLectivo: year,
          tipoSession: params.sessionType,
          fechaReunion: params.meetingDate,
          fechaEntregaEvaluacion: evalDeadline,
          estado: 'PROGRAMADA',
          ordenDiaPdfPath: `/api/evaluations/meetings/meet-uuid-${currentSequence}/pdf`,
        };

        mockMeetingsMap.set(meetingRecord.id, meetingRecord);
        return Promise.resolve(meetingRecord);
      }),
    findById: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve(mockMeetingsMap.get(id) || null);
    }),
  };

  const mockPdfGenerator = {
    generateAgendaPdf: jest
      .fn()
      .mockImplementation((meetingId: string) =>
        Promise.resolve(`/api/evaluations/meetings/${meetingId}/pdf`),
      ),
  };

  beforeAll(async () => {
    jest.setTimeout(60000);

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
    it('debe rechazar con HTTP 400 si la fecha de entrega de evaluacion es posterior o igual a la fecha de reunion', async () => {
      const invalidPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-04-10T10:00:00.000Z',
        evalSubmissionDeadline: '2026-04-11T10:00:00.000Z', // posterior
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
        evalSubmissionDeadline: '2026-04-09T23:59:59.999Z',
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

    it('debe crear exitosamente la convocatoria (HTTP 201) con protocolos e informes de seguimiento', async () => {
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-04-16T10:00:00.000Z',
        evalSubmissionDeadline: '2026-04-09T23:59:59.999Z',
        protocolVersionIds: [137],
        followUpReportIds: [45],
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
    });
  });

  describe('GET /api/evaluations/meetings/:id', () => {
    it('debe retornar HTTP 200 con la información detallada de la convocatoria existente', async () => {
      // Crear primero una convocatoria
      const validPayload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-05-20T09:00:00.000Z',
        evalSubmissionDeadline: '2026-05-14T23:59:59.000Z',
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
      expect(data).toHaveProperty('numeroConvocatoria');
      expect(data).toHaveProperty('estado');
    });

    it('debe retornar HTTP 404 si la convocatoria no existe', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/evaluations/meetings/:id/pdf', () => {
    it('debe retornar HTTP 200 con cabecera application/pdf para una convocatoria existente', async () => {
      const validPayload = {
        sessionType: 'EXTRAORDINARIA',
        meetingDate: '2026-06-18T10:00:00.000Z',
        evalSubmissionDeadline: '2026-06-11T23:59:59.000Z',
        followUpReportIds: [50],
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

    it('debe retornar HTTP 404 al intentar descargar el PDF de una convocatoria inexistente', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/non-existent-id/pdf')
        .expect(404);
    });
  });
});
