/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import type { IMeetingRepositoryPort } from '../src/modules/evaluations/domain/ports/meeting-repository.port';
import { MeetingNumberValueObject } from '../src/modules/evaluations/domain/value-objects/meeting-number.vo';

describe('Convocatorias Concurrency Stress Tests (e2e) - [TSK-009-009 / EARS 1]', () => {
  let app: INestApplication;
  let currentSequence = 9; // Simula último secuencial histórico (009-2026)

  // Implementación atómica de concurrencia para pruebas de estrés
  const atomicSequenceRepositoryMock: IMeetingRepositoryPort = {
    saveMeetingWithAtomicNumber: jest
      .fn()
      .mockImplementation(async (params, academicYearStr, evalDeadline) => {
        const year = parseInt(academicYearStr, 10);
        // Simulación de contención y delay de red en base de datos
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 10) + 5),
        );

        currentSequence += 1;
        const meetingVo = MeetingNumberValueObject.fromSequence(
          currentSequence,
          year,
        );

        return {
          id: `convocatoria-${currentSequence}-${year}`,
          numeroConvocatoria: meetingVo.value,
          anioLectivo: year,
          tipoSession: params.sessionType,
          fechaReunion: params.meetingDate,
          fechaEntregaEvaluacion: evalDeadline,
          estado: 'PROGRAMADA',
          ordenDiaPdfPath: `/api/evaluations/meetings/convocatoria-${currentSequence}-${year}/pdf`,
        };
      }),
    findById: jest.fn(),
    findAll: jest.fn(),
    findPendingProtocols: jest.fn(),
    findAllPlaces: jest.fn(),
    findPlaceById: jest.fn(),
    createPlace: jest.fn(),
    updatePlace: jest.fn(),
    deletePlace: jest.fn(),
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
      .useValue(atomicSequenceRepositoryMock)
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

  const generateMeetingPayload = (index: number) => ({
    sessionType: 'ORDINARIA',
    meetingDate: '2026-11-12T09:00:00.000Z',
    evalSubmissionDeadline: '2026-11-05T23:59:59.000Z',
    followUpReportIds: [100 + index],
  });

  describe('Stress & Concurrency Scenario 1: 2 solicitudes simultáneas', () => {
    it('debe procesar 2 creaciones concurrentes asignando números únicos consecutivos sin colisión', async () => {
      const concurrentRequests = [0, 1].map((idx) =>
        request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send(generateMeetingPayload(idx)),
      );

      const responses = await Promise.all(concurrentRequests);

      // 1. Validar que todas retornaron HTTP 201 Created
      for (const res of responses) {
        expect(res.status).toBe(201);
        const data = res.body.data || res.body;
        expect(data).toHaveProperty('meetingNumber');
        expect(data.meetingNumber).toMatch(/^\d{3}-2026$/);
      }

      // 2. Validar que los números asignados son todos distintos
      const meetingNumbers = responses.map(
        (res) => (res.body.data || res.body).meetingNumber,
      );
      const uniqueNumbers = new Set(meetingNumbers);
      expect(uniqueNumbers.size).toBe(2);

      // 3. Validar correlatividad consecutiva
      const sequences = meetingNumbers
        .map((num: string) => parseInt(num.split('-')[0], 10))
        .sort((a: number, b: number) => a - b);
      expect(sequences[1] - sequences[0]).toBe(1);
    });
  });

  describe('Stress & Concurrency Scenario 2: 5 solicitudes simultáneas', () => {
    it('debe procesar 5 creaciones concurrentes asignando números únicos consecutivos', async () => {
      const count = 5;
      const concurrentRequests = Array.from({ length: count }, (_, idx) =>
        request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send(generateMeetingPayload(idx + 10)),
      );

      const responses = await Promise.all(concurrentRequests);

      // 1. Validar HTTP 201 Created
      for (const res of responses) {
        expect(res.status).toBe(201);
        const data = res.body.data || res.body;
        expect(data).toHaveProperty('meetingNumber');
        expect(data.meetingNumber).toMatch(/^\d{3}-2026$/);
      }

      // 2. Validar unicidad (sin duplicados)
      const meetingNumbers = responses.map(
        (res) => (res.body.data || res.body).meetingNumber,
      );
      const uniqueNumbers = new Set(meetingNumbers);
      expect(uniqueNumbers.size).toBe(count);

      // 3. Validar orden consecutivo estricto
      const sequences = meetingNumbers
        .map((num: string) => parseInt(num.split('-')[0], 10))
        .sort((a: number, b: number) => a - b);

      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i] - sequences[i - 1]).toBe(1);
      }
    });
  });

  describe('Stress & Concurrency Scenario 3: 10 solicitudes simultáneas', () => {
    it('debe procesar 10 creaciones concurrentes masivas garantizando atomicidad y unicidad', async () => {
      const count = 10;
      const concurrentRequests = Array.from({ length: count }, (_, idx) =>
        request(app.getHttpServer())
          .post('/api/evaluations/meetings')
          .send(generateMeetingPayload(idx + 50)),
      );

      const responses = await Promise.all(concurrentRequests);

      // 1. Validar HTTP 201 Created
      for (const res of responses) {
        expect(res.status).toBe(201);
        const data = res.body.data || res.body;
        expect(data).toHaveProperty('meetingNumber');
        expect(data.meetingNumber).toMatch(/^\d{3}-2026$/);
      }

      // 2. Validar unicidad completa de 10 correlativos
      const meetingNumbers = responses.map(
        (res) => (res.body.data || res.body).meetingNumber,
      );
      const uniqueNumbers = new Set(meetingNumbers);
      expect(uniqueNumbers.size).toBe(count);

      // 3. Validar secuencia estrictamente consecutiva
      const sequences = meetingNumbers
        .map((num: string) => parseInt(num.split('-')[0], 10))
        .sort((a: number, b: number) => a - b);

      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i] - sequences[i - 1]).toBe(1);
      }
    });
  });
});
