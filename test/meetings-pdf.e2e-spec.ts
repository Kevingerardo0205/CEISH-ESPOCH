/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
/**
 * Test E2E para GET /api/evaluations/meetings/:id/pdf (TSK-009-N16).
 *
 * Registra ResponseInterceptor igual que main.ts:39 para reproducir el bug:
 * sin el fix, el interceptor envuelve StreamableFile como JSON y el PDF queda corrompido.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import type { IMeetingRepositoryPort } from '../src/modules/evaluations/domain/ports/meeting-repository.port';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IUserRepository } from '../src/modules/auth/domain/ports/user.repository.port';

// Parsing binario para supertest — tipado compatible con superagent .parse()
function binaryParser(res: any, callback: any): void {
  const chunks: Buffer[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  res.on('error', (err: Error) => callback(err, Buffer.alloc(0)));
}

const MEETING_ID = 'f47ac10b-58cc-4372-a567-000000000099';
const MEETING_NUMBER = 'PDF-TEST-001';
const PDF_DIR = path.resolve(process.cwd(), 'uploads', 'convocatorias');
const PDF_PATH = path.join(
  PDF_DIR,
  `convocatoria-${MEETING_NUMBER}-orden-del-dia.pdf`,
);
// Cabecera PDF mínima válida para detectar el inicio "%PDF-"
const REAL_PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n');

const meetingRepositoryMock: IMeetingRepositoryPort = {
  findById: jest.fn().mockImplementation((id: string) => {
    if (id === MEETING_ID) {
      return Promise.resolve({
        id: MEETING_ID,
        meetingNumber: MEETING_NUMBER,
        academicYear: 2026,
        sessionType: 'ORDINARIA',
        meetingDate: new Date('2026-04-16T10:00:00Z'),
        evalSubmissionDeadline: new Date('2026-04-21T17:00:00Z'),
        status: 'PROGRAMADA',
        place: null,
        protocolCount: 0,
        protocols: [],
      });
    }
    return Promise.resolve(null);
  }),
  saveMeetingWithAtomicNumber: jest.fn().mockResolvedValue(null),
  findAll: jest
    .fn()
    .mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 }),
  findPendingProtocols: jest.fn().mockResolvedValue([]),
  findAllPlaces: jest.fn().mockResolvedValue([]),
  findPlaceById: jest.fn().mockResolvedValue(null),
  createPlace: jest.fn().mockResolvedValue(null),
  updatePlace: jest.fn().mockResolvedValue(null),
  deletePlace: jest.fn().mockResolvedValue(undefined),
  getOldestAssignedDates: jest.fn().mockResolvedValue([]),
  findNormativeDeadlineInputs: jest.fn().mockResolvedValue([]),
  findAssignedVersionsWithoutScheduledMeeting: jest.fn().mockResolvedValue([]),
};

const mockPdfGenerator = {
  generateAgendaPdf: jest.fn().mockResolvedValue(undefined),
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

describe('GET /api/evaluations/meetings/:id/pdf — ResponseInterceptor (TSK-009-N16)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
      .useValue({ canActivate: () => true })
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
    // Registrar el interceptor igual que main.ts:39 — reproduce el bug
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Crear el archivo PDF de prueba antes de levantar la app
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }
    fs.writeFileSync(PDF_PATH, REAL_PDF_BYTES);

    await app.init();
  });

  afterAll(async () => {
    // Borrar el PDF de prueba siempre
    try {
      fs.unlinkSync(PDF_PATH);
    } catch {
      /* ya no existe */
    }
    if (app) await app.close();
  });

  describe('PDF-01 descarga devuelve bytes PDF reales (no JSON)', () => {
    it('status 200, content-type application/pdf, cuerpo empieza con %PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/evaluations/meetings/${MEETING_ID}/pdf`)
        .buffer(true)
        .parse(binaryParser);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      const body = res.body as Buffer;
      expect(Buffer.isBuffer(body)).toBe(true);
      // El cuerpo DEBE empezar con "%PDF-", NO ser JSON
      expect(body.slice(0, 5).toString('ascii')).toBe('%PDF-');
    });
  });

  describe('PDF-02 convocatoria inexistente -> 404', () => {
    it('status 404 cuando el id no existe en el repositorio', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/evaluations/meetings/f47ac10b-0000-0000-0000-000000000000/pdf',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('PDF-03 PDF no disponible -> 404', () => {
    it('status 404 cuando el archivo no existe y generateAgendaPdf no lo crea', async () => {
      // Borrar el archivo para forzar el caso "no disponible"
      try {
        fs.unlinkSync(PDF_PATH);
      } catch {
        /* ya borrado */
      }

      const res = await request(app.getHttpServer()).get(
        `/api/evaluations/meetings/${MEETING_ID}/pdf`,
      );

      expect(res.status).toBe(404);

      // Restaurar para que el afterAll no falle
      fs.writeFileSync(PDF_PATH, REAL_PDF_BYTES);
    });
  });
});
