/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
/**
 * TEST-M4: MeetingPdfGeneratorAdapter con conexión real a ceish_test_db.
 *
 * El real-db-evaluations.e2e-spec.ts mockea IMeetingPdfGeneratorPort, por lo
 * que el bug de la relación inexistente "investigadorPrincipal" (TSK-009-N21)
 * no era visible en tests anteriores. Este spec usa el adaptador real sin
 * ningún mock del generador ni de PdfGeneratorService.
 */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { Permission } from '../src/shared/enums/permission.enum';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { MailerNotificationAdapter } from '../src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { DocxGeneratorService } from '../src/shared/utils/docx-generator.service';
import { PdfGeneratorService } from '../src/shared/utils/pdf-generator.service';

// IP exclusiva para TEST-M4 — evita el límite de DosDefenseMiddleware (TSK-SEC-01)
const TEST_M4_IP = '10.0.4.1';
const PDF_DIR = path.resolve(process.cwd(), 'uploads', 'convocatorias');

// Parser binario para supertest — idéntico al de meetings-pdf.e2e-spec.ts
function binaryParser(res: any, callback: any): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  res.on('error', (err: Error) => callback(err, Buffer.alloc(0)));
}

describe('TEST-M4: MeetingPdfGeneratorAdapter real — TSK-009-N21 (ceish_test_db)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const pdfPaths: string[] = [];

  beforeAll(async () => {
    // Guard de seguridad de Base de Datos
    const dbName = process.env.TEST_DB_NAME || 'ceish_test_db';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(
        `ABORT: Seguridad de Base de Datos violada. Base recibida: '${dbName}'. ceish_db protegida.`,
      );
    }
    process.env.DB_NAME = dbName;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 910,
            email: 'secretaria-m4@test.com',
            roles: ['SECRETARIA', 'ADMIN_TI', 'PRESIDENTE'],
            permissions: Object.values(Permission),
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
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
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
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
      .overrideProvider(DocxGeneratorService)
      .useValue({
        generateAnnex9Docx: jest
          .fn()
          .mockResolvedValue(Buffer.from('PK docx test')),
      })
      // IMeetingPdfGeneratorPort y PdfGeneratorService NO se mockean —
      // este spec ejercita el MeetingPdfGeneratorAdapter y PdfGeneratorService reales.
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    // Guard de seguridad: verificar current_database()
    const testDbResult = await dataSource.query('SELECT current_database();');
    const nestDbName = testDbResult[0]?.current_database;
    if (
      !nestDbName ||
      (!nestDbName.endsWith('test') &&
        !nestDbName.endsWith('test_db') &&
        !nestDbName.endsWith('_test_db'))
    ) {
      throw new Error(
        `ABORT: DataSource conectado a base no autorizada: '${nestDbName}'. Solo se permiten bases *test.`,
      );
    }

    await dataSource.query(`
      SET lock_timeout = '5s';
      SET statement_timeout = '10s';
    `);

    // Limpieza preventiva de datos TEST-M4 de ejecuciones anteriores
    await dataSource.query(`
      DELETE FROM evaluacion.convocatorias
        WHERE id IN (
          SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id = 993
        ) OR numero_convocatoria LIKE 'TEST-M4-%';
      DELETE FROM evaluacion.lugares WHERE nombre LIKE 'TEST-M4-%';
      UPDATE public.protocolos SET version_actual_id = NULL WHERE id = 993;
      DELETE FROM public.versiones_protocolo WHERE id = 993;
      DELETE FROM public.protocolos WHERE id = 993;
      DELETE FROM catalogos.usuarios WHERE id = 910;
    `);

    // Sembrar datos de TEST-M4
    await dataSource.query(`
      INSERT INTO catalogos.usuarios (id, email_institucional, nombres_completos, cedula)
      VALUES (910, 'm4-investigador@test.com', 'Dr. M4 Investigador', '9100000001')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.protocolos
        (id, titulo, investigador_principal_id, nivel_riesgo_id, estado_id)
      SELECT 993,
             'Protocolo TEST-M4 PDF Generator',
             910,
             (SELECT id FROM catalogos.niveles_riesgo LIMIT 1),
             10
      WHERE NOT EXISTS (SELECT 1 FROM public.protocolos WHERE id = 993);

      INSERT INTO public.versiones_protocolo (id, protocolo_id, numero_version, estado_id)
      VALUES (993, 993, 1, 10) ON CONFLICT (id) DO NOTHING;

      UPDATE public.protocolos SET version_actual_id = 993 WHERE id = 993;
    `);
  }, 60000);

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(`
          DELETE FROM evaluacion.convocatorias
            WHERE id IN (
              SELECT convocatoria_id FROM evaluacion.convocatoria_protocolos WHERE version_id = 993
            ) OR numero_convocatoria LIKE 'TEST-M4-%';
          DELETE FROM evaluacion.lugares WHERE nombre LIKE 'TEST-M4-%';
          UPDATE public.protocolos SET version_actual_id = NULL WHERE id = 993;
          DELETE FROM public.versiones_protocolo WHERE id = 993;
          DELETE FROM public.protocolos WHERE id = 993;
          DELETE FROM catalogos.usuarios WHERE id = 910;
        `);
      }
    } finally {
      if (app) await app.close();
      if (dataSource?.isInitialized) await dataSource.destroy();
    }

    // Borrar PDFs después de app.close() para evitar la race condition con
    // notifyMembersAsync (fire-and-forget): el async puede regenerar el PDF
    // después de borrarlo si la app aún está activa.
    for (const pdfPath of pdfPaths) {
      try {
        fs.unlinkSync(pdfPath);
      } catch {
        /* ya borrado o no llegó a crearse */
      }
    }
  });

  it('M4-01: GET pdf con 1 protocolo y lugar=null → 200 application/pdf cuerpo %PDF-', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/evaluations/meetings')
      .set('x-forwarded-for', TEST_M4_IP)
      .send({
        sessionType: 'ORDINARIA',
        meetingDate: '2026-08-12T14:00:00.000Z',
        evalSubmissionDeadline: '2026-08-18T17:00:00.000Z',
        protocolVersionIds: [993],
      })
      .expect(201);

    const meetingId = createRes.body.data.id as string;
    const meetingNumber = createRes.body.data.meetingNumber as string;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const pdfRes = await request(app.getHttpServer())
      .get(`/api/evaluations/meetings/${meetingId}/pdf`)
      .set('x-forwarded-for', TEST_M4_IP)
      .buffer(true)
      .parse(binaryParser);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toMatch(/application\/pdf/);
    const body = pdfRes.body as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.slice(0, 5).toString('ascii')).toBe('%PDF-');
  }, 30000);

  it('M4-02: GET pdf de convocatoria sin protocolos en agenda → 200 application/pdf', async () => {
    // La API requiere ≥1 protocolo; se inserta la convocatoria directamente
    // para verificar que el generador no explota con agendaItems = [].
    // numero_convocatoria tiene max 20 chars; prefijo 'TEST-M4-SP' (10) + 10 dígitos = 20
    const tag = `TEST-M4-SP${Date.now().toString().slice(-10)}`;
    const insertRes: Array<{ id: string; numero_convocatoria: string }> =
      await dataSource.query(
        `
        INSERT INTO evaluacion.convocatorias
          (numero_convocatoria, anio_lectivo, tipo_session, fecha_reunion,
           fecha_entrega_evaluacion, estado)
        VALUES
          ($1, 2026, 'ORDINARIA',
           NOW() + INTERVAL '10 days', NOW() + INTERVAL '17 days', 'PROGRAMADA')
        RETURNING id, numero_convocatoria;
      `,
        [tag],
      );

    const meetingId = insertRes[0].id;
    const meetingNumber = insertRes[0].numero_convocatoria;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const pdfRes = await request(app.getHttpServer())
      .get(`/api/evaluations/meetings/${meetingId}/pdf`)
      .set('x-forwarded-for', TEST_M4_IP)
      .buffer(true)
      .parse(binaryParser);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toMatch(/application\/pdf/);
    const body = pdfRes.body as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.slice(0, 5).toString('ascii')).toBe('%PDF-');
  }, 30000);

  it('M4-04: investigatorName en PDF usa el nombre real de principalInvestigator (TSK-009-N24)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/evaluations/meetings')
      .set('x-forwarded-for', TEST_M4_IP)
      .send({
        sessionType: 'ORDINARIA',
        meetingDate: '2026-09-10T10:00:00.000Z',
        evalSubmissionDeadline: '2026-09-16T17:00:00.000Z',
        protocolVersionIds: [993],
      })
      .expect(201);

    const meetingId = createRes.body.data.id as string;
    const meetingNumber = createRes.body.data.meetingNumber as string;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    // Llamamos directamente al adaptador (sin HTTP) para evitar la race
    // condition entre notifyMembersAsync (que escribe el PDF en segundo plano
    // tras el POST) y el GET (que sirve el archivo si ya existe en disco sin
    // llamar al adaptador). Con la llamada directa el spy siempre se activa.
    // Espiamos el prototipo para capturar la llamada sin importar la instancia
    // concreta inyectada por NestJS (que puede ser un proxy).
    const spy = jest.spyOn(PdfGeneratorService.prototype, 'generateCallPdf');

    const adapter = app.get<{
      generateAgendaPdf: (
        id: string,
      ) => Promise<{ url: string; buffer: Buffer }>;
    }>('IMeetingPdfGeneratorPort');
    const result = await adapter.generateAgendaPdf(meetingId);

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.slice(0, 5).toString('ascii')).toBe('%PDF-');
    expect(spy).toHaveBeenCalled();

    const callArg = spy.mock.calls[0][0];
    const investigatorName = callArg.protocols[0]?.investigatorName;
    expect(investigatorName).toBe('Dr. M4 Investigador');
    expect(investigatorName).not.toBe('Investigador Principal');

    spy.mockRestore();
    jest.restoreAllMocks();
  }, 30000);

  it('M4-03: GET pdf de convocatoria con lugar asignado → 200 application/pdf', async () => {
    const lugarRes: Array<{ id: string }> = await dataSource.query(`
      INSERT INTO evaluacion.lugares (nombre, activo)
      VALUES ('TEST-M4-Sala-Principal', true)
      RETURNING id;
    `);
    const lugarId = lugarRes[0].id;

    const createRes = await request(app.getHttpServer())
      .post('/api/evaluations/meetings')
      .set('x-forwarded-for', TEST_M4_IP)
      .send({
        sessionType: 'EXTRAORDINARIA',
        meetingDate: '2026-08-20T10:00:00.000Z',
        evalSubmissionDeadline: '2026-08-26T17:00:00.000Z',
        protocolVersionIds: [993],
        locationId: lugarId,
      })
      .expect(201);

    const meetingId = createRes.body.data.id as string;
    const meetingNumber = createRes.body.data.meetingNumber as string;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const pdfRes = await request(app.getHttpServer())
      .get(`/api/evaluations/meetings/${meetingId}/pdf`)
      .set('x-forwarded-for', TEST_M4_IP)
      .buffer(true)
      .parse(binaryParser);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toMatch(/application\/pdf/);
    const body = pdfRes.body as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.slice(0, 5).toString('ascii')).toBe('%PDF-');
  }, 30000);
});

describe('TEST-M5: MeetingPdfGeneratorAdapter — datos faltantes — TSK-009-N26 (ceish_test_db)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const pdfPaths: string[] = [];

  beforeAll(async () => {
    const dbName = process.env.TEST_DB_NAME || 'ceish_test_db';
    if (
      !dbName.endsWith('test') &&
      !dbName.endsWith('test_db') &&
      !dbName.endsWith('_test_db')
    ) {
      throw new Error(
        `ABORT: Seguridad de Base de Datos violada. Base recibida: '${dbName}'. ceish_db protegida.`,
      );
    }
    process.env.DB_NAME = dbName;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 920,
            email: 'secretaria-m5@test.com',
            roles: ['SECRETARIA', 'ADMIN_TI', 'PRESIDENTE'],
            permissions: Object.values(Permission),
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
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
        sendCallNotification: jest.fn().mockResolvedValue(undefined),
        sendEvaluationAssignment: jest.fn().mockResolvedValue(undefined),
        sendEvaluationSubmitted: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
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
      .overrideProvider(DocxGeneratorService)
      .useValue({
        generateAnnex9Docx: jest
          .fn()
          .mockResolvedValue(Buffer.from('PK docx test')),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    const testDbResult = await dataSource.query('SELECT current_database();');
    const nestDbName = testDbResult[0]?.current_database;
    if (
      !nestDbName ||
      (!nestDbName.endsWith('test') &&
        !nestDbName.endsWith('test_db') &&
        !nestDbName.endsWith('_test_db'))
    ) {
      throw new Error(
        `ABORT: DataSource conectado a base no autorizada: '${nestDbName}'. Solo se permiten bases *test.`,
      );
    }

    await dataSource.query(`
      SET lock_timeout = '5s';
      SET statement_timeout = '10s';
    `);

    // Limpieza preventiva de ejecuciones anteriores
    await dataSource.query(`
      DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE 'TEST-M5-%';
    `);
  }, 60000);

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(`
          DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE 'TEST-M5-%';
        `);
      }
    } finally {
      if (app) await app.close();
      if (dataSource?.isInitialized) await dataSource.destroy();
    }

    // Borrar PDFs después de app.close() para evitar la race condition con
    // notifyMembersAsync (fire-and-forget).
    for (const pdfPath of pdfPaths) {
      try {
        fs.unlinkSync(pdfPath);
      } catch {
        /* ya borrado o no llegó a crearse */
      }
    }
  });

  it('M5-01: fecha_reunion NULL → date null, time "Por definir", placeName "Por definir"', async () => {
    const tag = `TEST-M5-ND${Date.now().toString().slice(-10)}`;
    const rows: Array<{ id: string; numero_convocatoria: string }> =
      await dataSource.query(
        `INSERT INTO evaluacion.convocatorias
          (numero_convocatoria, anio_lectivo, tipo_session,
           fecha_reunion, fecha_entrega_evaluacion, estado)
         VALUES ($1, 2026, 'ORDINARIA', NULL, NOW() + INTERVAL '7 days', 'PROGRAMADA')
         RETURNING id, numero_convocatoria`,
        [tag],
      );

    const meetingId = rows[0].id;
    const meetingNumber = rows[0].numero_convocatoria;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const spy = jest.spyOn(PdfGeneratorService.prototype, 'generateCallPdf');

    const adapter = app.get<{
      generateAgendaPdf: (
        id: string,
      ) => Promise<{ url: string; buffer: Buffer }>;
    }>('IMeetingPdfGeneratorPort');
    const result = await adapter.generateAgendaPdf(meetingId);

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(spy).toHaveBeenCalled();

    const callArg = spy.mock.calls[0][0];
    expect(callArg.date).toBeNull();
    expect(callArg.time).toBe('Por definir');
    expect(callArg.placeName).toBe('Por definir');

    spy.mockRestore();
    jest.restoreAllMocks();
  }, 30000);

  it('M5-02: lugar NULL con fecha válida → placeName "Por definir"', async () => {
    const tag = `TEST-M5-NL${Date.now().toString().slice(-10)}`;
    const rows: Array<{ id: string; numero_convocatoria: string }> =
      await dataSource.query(
        `INSERT INTO evaluacion.convocatorias
          (numero_convocatoria, anio_lectivo, tipo_session,
           fecha_reunion, fecha_entrega_evaluacion, estado)
         VALUES ($1, 2026, 'ORDINARIA',
                 '2026-08-20T14:00:00Z', NOW() + INTERVAL '7 days', 'PROGRAMADA')
         RETURNING id, numero_convocatoria`,
        [tag],
      );

    const meetingId = rows[0].id;
    const meetingNumber = rows[0].numero_convocatoria;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const spy = jest.spyOn(PdfGeneratorService.prototype, 'generateCallPdf');

    const adapter = app.get<{
      generateAgendaPdf: (
        id: string,
      ) => Promise<{ url: string; buffer: Buffer }>;
    }>('IMeetingPdfGeneratorPort');
    await adapter.generateAgendaPdf(meetingId);

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    expect(callArg.placeName).toBe('Por definir');

    spy.mockRestore();
    jest.restoreAllMocks();
  }, 30000);

  it('M5-03: fecha 2026-04-16T10:00:00Z → time "05:00" con TZ=UTC (zona explícita America/Guayaquil)', async () => {
    const tag = `TEST-M5-TZ${Date.now().toString().slice(-10)}`;
    const rows: Array<{ id: string; numero_convocatoria: string }> =
      await dataSource.query(
        `INSERT INTO evaluacion.convocatorias
          (numero_convocatoria, anio_lectivo, tipo_session,
           fecha_reunion, fecha_entrega_evaluacion, estado)
         VALUES ($1, 2026, 'ORDINARIA',
                 '2026-04-16T10:00:00Z', NOW() + INTERVAL '7 days', 'PROGRAMADA')
         RETURNING id, numero_convocatoria`,
        [tag],
      );

    const meetingId = rows[0].id;
    const meetingNumber = rows[0].numero_convocatoria;
    pdfPaths.push(
      path.join(PDF_DIR, `convocatoria-${meetingNumber}-orden-del-dia.pdf`),
    );

    const spy = jest.spyOn(PdfGeneratorService.prototype, 'generateCallPdf');

    const adapter = app.get<{
      generateAgendaPdf: (
        id: string,
      ) => Promise<{ url: string; buffer: Buffer }>;
    }>('IMeetingPdfGeneratorPort');
    await adapter.generateAgendaPdf(meetingId);

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    // La fecha 2026-04-16T10:00:00Z son las 05:00 en Guayaquil (UTC-5)
    expect(callArg.time).toBe('05:00');

    spy.mockRestore();
    jest.restoreAllMocks();
  }, 30000);
});
