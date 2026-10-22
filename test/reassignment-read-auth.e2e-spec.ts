/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';
import { GetReassignmentHistoryUseCase } from '../src/modules/evaluations/application/use-cases/get-reassignment-history.use-case';
import { GetActiveAssignmentsUseCase } from '../src/modules/evaluations/application/use-cases/get-active-assignments.use-case';
import { ReassignEvaluatorUseCase } from '../src/modules/evaluations/application/use-cases/reassign-evaluator.use-case';

// Suite TSK-002-N13: JwtAuthGuard y RolesGuard son los REALES de producción.
// PermissionsGuard está sobreescrito para aislar el foco en auth y roles.
// Los use cases de lectura/escritura están sobreescritos para evitar consultas reales.
//
// Falsificabilidad demostrada implícitamente: si RolesGuard estuviera sobreescrito,
// el test N13-A-03 (EVALUADOR → 403) devolvería 200 en lugar de 403.

describe('Reassignment Auth E2E — guards reales (TSK-002-N13)', () => {
  let app: INestApplication;
  let tokenSecretaria: string;
  let tokenEvaluador: string;
  let tokenPresidente: string;
  let reassignMock: { execute: jest.Mock };

  beforeAll(async () => {
    const dbName = process.env.TEST_DB_NAME || 'ceish_test_db';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(`ABORT: BD no autorizada '${dbName}'. Solo bases *test.`);
    }
    process.env.DB_NAME = dbName;

    const historyMock = { execute: jest.fn().mockResolvedValue([]) };
    const activeAsgMock = {
      execute: jest.fn().mockResolvedValue({
        protocolId: 1,
        ceishCode: 'CEISH-TEST-001',
        versionId: 1,
        versionNumber: 1,
        assignments: [],
      }),
    };
    reassignMock = {
      execute: jest
        .fn()
        .mockResolvedValue({ message: 'Reasignación exitosa.' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // JwtAuthGuard y RolesGuard NO se sobreescriben — son los reales
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(GetReassignmentHistoryUseCase)
      .useValue(historyMock)
      .overrideProvider(GetActiveAssignmentsUseCase)
      .useValue(activeAsgMock)
      .overrideProvider(ReassignEvaluatorUseCase)
      .useValue(reassignMock)
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(MailerNotificationAdapter)
      .useValue(
        new MailerNotificationAdapter({
          sendMail: jest.fn().mockResolvedValue(undefined),
        }),
      )
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendUnscheduledProtocolsAlert: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest
          .fn()
          .mockResolvedValue('https://storage.test.com/file.pdf'),
        getFileUrl: jest
          .fn()
          .mockResolvedValue('https://storage.test.com/file.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PdfGeneratorService)
      .useValue({
        generateAnnex9Report: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 test')),
        generateCallPdf: jest
          .fn()
          .mockResolvedValue(Buffer.from('%PDF-1.4 call')),
      })
      .overrideProvider(DocxGeneratorService)
      .useValue({
        generateAnnex9Docx: jest
          .fn()
          .mockResolvedValue(Buffer.from('PK docx test')),
      })
      .overrideProvider('IMeetingPdfGeneratorPort')
      .useValue({
        generateAgendaPdf: jest.fn().mockResolvedValue({
          url: '/api/evaluations/meetings/mock-id/pdf',
          buffer: Buffer.from('%PDF-1.4 agenda'),
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // Firma JWTs con el secreto real de la app (JWT_SECRET del entorno)
    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const secret = configService.getOrThrow<string>('app.jwtSecret');

    tokenSecretaria = await jwtService.signAsync(
      {
        sub: 1,
        id: 1,
        email: 'secretaria@espoch.edu.ec',
        roles: ['SECRETARIA'],
        permissions: [],
      },
      { secret, expiresIn: '1h' },
    );

    tokenEvaluador = await jwtService.signAsync(
      {
        sub: 2,
        id: 2,
        email: 'evaluador@espoch.edu.ec',
        roles: ['EVALUADOR'],
        permissions: [],
      },
      { secret, expiresIn: '1h' },
    );

    tokenPresidente = await jwtService.signAsync(
      {
        sub: 3,
        id: 3,
        email: 'presidente@espoch.edu.ec',
        roles: ['PRESIDENTE'],
        permissions: [],
      },
      { secret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ── Bloque A: GET /api/evaluations/protocol/:id/reassignment-history ──────

  describe('GET /api/evaluations/protocol/:id/reassignment-history', () => {
    const url = '/api/evaluations/protocol/1/reassignment-history';

    it('N13-A-01: sin token → 401 (JwtAuthGuard real)', async () => {
      const res = await request(app.getHttpServer()).get(url);
      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('N13-A-02: token malformado → 401 (JwtAuthGuard real)', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', 'Bearer token.invalido.firma');
      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('N13-A-03: token válido con rol EVALUADOR → 403 (RolesGuard real)', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenEvaluador}`);
      expect(res.status).toBe(403);
      expect(res.body.statusCode).toBe(403);
    });

    it('N13-A-04: token válido con rol SECRETARIA → 200 con envoltorio ResponseInterceptor', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenSecretaria}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        statusCode: 200,
        message: 'Success',
      });
    });

    it('N13-A-05: token válido con rol PRESIDENTE → 200 con envoltorio ResponseInterceptor', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenPresidente}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        statusCode: 200,
        message: 'Success',
      });
    });
  });

  // ── Bloque B: GET /api/evaluations/protocol/:id/active-assignments ────────

  describe('GET /api/evaluations/protocol/:id/active-assignments', () => {
    const url = '/api/evaluations/protocol/1/active-assignments';

    it('N13-B-01: sin token → 401 (JwtAuthGuard real)', async () => {
      const res = await request(app.getHttpServer()).get(url);
      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('N13-B-02: token malformado → 401 (JwtAuthGuard real)', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', 'Bearer token.invalido.firma');
      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
    });

    it('N13-B-03: token válido con rol EVALUADOR → 403 (RolesGuard real)', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenEvaluador}`);
      expect(res.status).toBe(403);
      expect(res.body.statusCode).toBe(403);
    });

    it('N13-B-04: token válido con rol SECRETARIA → 200 con envoltorio ResponseInterceptor', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenSecretaria}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.objectContaining({ assignments: expect.any(Array) }),
        statusCode: 200,
        message: 'Success',
      });
    });

    it('N13-B-05: token válido con rol PRESIDENTE → 200 con envoltorio ResponseInterceptor', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${tokenPresidente}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.objectContaining({ assignments: expect.any(Array) }),
        statusCode: 200,
        message: 'Success',
      });
    });
  });

  // ── Bloque C: POST /api/evaluations/reassign (cobertura N11) ─────────────

  describe('POST /api/evaluations/reassign', () => {
    const url = '/api/evaluations/reassign';
    const validBody = {
      currentAssignmentId: 9999,
      replacementEvaluatorId: 9998,
      replacementEvaluatorProfile: 'JURIDICO',
      reason: 'VENCIMIENTO',
    };

    it('N13-C-01: sin token → 401, el caso de uso NO es invocado (TSK-002-N11)', async () => {
      const res = await request(app.getHttpServer()).post(url).send(validBody);
      expect(res.status).toBe(401);
      expect(res.body.statusCode).toBe(401);
      expect(reassignMock.execute).not.toHaveBeenCalled();
    });
  });
});
