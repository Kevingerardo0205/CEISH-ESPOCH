/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */

/**
 * TSK-015-N22a — spec-003 RF-17.6 y hallazgos C (lectura), I (recepción por id) y
 * Evaluador / tarea B7 (Anexo 9 por id).
 *
 * - GET y POST /api/storage/download-url aplican la política por prefijo y dueño.
 * - GET /api/reception/document/:id/{view,download-url} aplican la regla del protocolo de la fila.
 * - GET /api/evaluations/:id/document y /document/docx: solo el evaluador dueño o EVALUACION_INFORMES.
 * - TSK-015-N22b: POST /api/storage/upload-url aplica assertCanWrite (dueño, estado del protocolo,
 *   asignación ASIGNADA, permisos de plantillas y resoluciones, tipo de contenido).
 *
 * Login real con cuentas ZZ_TEST_SA_ propias (contraseña generada en cada ejecución, no se imprime).
 * IStorageService se sustituye por un doble: no se llama a S3 real.
 *
 * Mutaciones que deben hacer fallar esta suite:
 * - quitar la comprobación de prefijo (parseStorageKey / switch de assertCanRead);
 * - quitar la comprobación de dueño del CV o de la regla de documento de recepción;
 * - quitar la regla del evaluador dueño en assertPuedeVerAnexo9 (evaluations.service.ts).
 *
 * Solo ceish_test_db. Los datos se borran en afterAll y el conteo de resoluciones vuelve a su valor.
 */

jest.mock('../src/shared/middleware/dos-defense.config', () => ({
  ...jest.requireActual('../src/shared/middleware/dos-defense.config'),
  DOS_DEFENSE_CONFIG: {
    ...jest.requireActual('../src/shared/middleware/dos-defense.config')
      .DOS_DEFENSE_CONFIG,
    MAX_PETICIONES: 10_000,
    MAX_PETICIONES_AUTH: 10_000,
    MAX_PETICIONES_MEDIA: 10_000,
    MAX_INFRACCIONES: 10_000,
    DURACION_BLOQUEO_MS: 0,
  },
}));

process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GlobalValidationPipe } from '../src/shared/pipes/validation.pipe';
import { ResponseInterceptor } from '../src/shared/interceptors/response.interceptor';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_SA_';
const EMAIL_DOMAIN = '@e2e-sa.test';
const NO_ARCHIVO = 'Archivo no encontrado.';
const NO_DOCUMENTO = 'Documento no encontrado.';
const NO_EVALUACION =
  'No se encontró ninguna evaluación con ID de evaluación o ID de asignación igual a';

type Usuario =
  | 'investigador'
  | 'otroInvestigador'
  | 'evaluador'
  | 'evaluadorAjeno'
  | 'secretaria'
  | 'presidente';

const ROL: Record<Usuario, string> = {
  investigador: 'INVESTIGADOR',
  otroInvestigador: 'INVESTIGADOR',
  evaluador: 'EVALUADOR',
  evaluadorAjeno: 'EVALUADOR',
  secretaria: 'SECRETARIA',
  presidente: 'PRESIDENTE',
};

describe('TSK-015-N22a — descarga por clave, documento de recepción y Anexo 9 (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let storageMock: { getDownloadUrl: jest.Mock; generateUploadUrl: jest.Mock };
  const token: Partial<Record<Usuario, string>> = {};
  const userId: Partial<Record<Usuario, number>> = {};
  const email = (k: Usuario) => `${k.toLowerCase()}${EMAIL_DOMAIN}`;
  let protocolId: number;
  let documentoId: number;
  let evaluacionId: number;
  let resolucionesAntes = 0;

  const api = () => request(app.getHttpServer());

  async function cleanup(): Promise<void> {
    const protocolos = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const asignaciones = `SELECT ae.id FROM evaluacion.asignaciones_evaluacion ae
       JOIN public.versiones_protocolo v ON v.id = ae.version_id
       WHERE v.protocolo_id IN (${protocolos})`;
    await ds.query(
      `DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN (${asignaciones})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion WHERE id IN (${asignaciones})`,
    );
    await ds.query(
      `DELETE FROM recepcion.documentos WHERE protocolo_id IN (${protocolos})`,
    );
    await ds.query(
      `DELETE FROM resolucion.resoluciones WHERE protocolo_id IN (${protocolos})`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN
         (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolos}))`,
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolos})`,
    );
    await ds.query(
      `DELETE FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios_roles WHERE usuario_id IN
         (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE $1`,
      [`%${EMAIL_DOMAIN}`],
    );
  }

  async function insertUser(
    key: Usuario,
    passwordHash: string,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [`ZZSA${key}`.slice(0, 20), `${PREFIX}${key}`, email(key), passwordHash],
    );
    return row.id;
  }

  async function assignRole(id: number, roleCode: string): Promise<void> {
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = $2`,
      [id, roleCode],
    );
  }

  async function login(address: string, password: string): Promise<string> {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: address, password });
    const accessToken: unknown = res.body?.data?.access_token;
    if (res.status !== 201 || typeof accessToken !== 'string') {
      throw new Error(`Login de ${address} falló con status ${res.status}`);
    }
    return accessToken;
  }

  async function contarResoluciones(): Promise<number> {
    const [row] = await ds.query(
      `SELECT count(*)::int AS c FROM resolucion.resoluciones`,
    );
    return row.c;
  }

  /**
   * Protocolo ZZ_TEST_SA_ del investigador principal con versión, carta, un documento de
   * recepción, una asignación a `evaluador` (estado ASIGNADO = 6) y su Anexo 9.
   */
  async function sembrar(): Promise<void> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id)
       VALUES ($1, $2) RETURNING id`,
      [`${PREFIX}protocolo`, userId.investigador],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version)
       VALUES ($1, 1) RETURNING id`,
      [p.id],
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [v.id, p.id],
    );
    protocolId = p.id;

    await ds.query(
      `INSERT INTO resolucion.resoluciones
         (protocolo_id, version_id, tipo_resolucion_id, observaciones, archivo_carta_pdf, creado_por)
       VALUES ($1, $2, 1, $3, $4, $5)`,
      [
        p.id,
        v.id,
        `${PREFIX}observacion`,
        `protocols/${p.id}/resolutions/${PREFIX}carta.pdf`,
        userId.secretaria,
      ],
    );

    const [d] = await ds.query(
      `INSERT INTO recepcion.documentos (protocolo_id, version_id, ruta, nombre_archivo)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        p.id,
        v.id,
        `protocols/${p.id}/requirements/${PREFIX}req/doc.pdf`,
        `${PREFIX}doc.pdf`,
      ],
    );
    documentoId = d.id;

    const [a] = await ds.query(
      `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
       VALUES ($1, $2, 6) RETURNING id`,
      [v.id, userId.evaluador],
    );
    const [e] = await ds.query(
      `INSERT INTO evaluacion.evaluaciones (asignacion_id, ruta_pdf, ruta_docx)
       VALUES ($1, $2, $3) RETURNING id`,
      [
        a.id,
        `evaluations/anexo9/${PREFIX}${a.id}.pdf`,
        `evaluations/anexo9/${PREFIX}${a.id}.docx`,
      ],
    );
    evaluacionId = e.id;
  }

  const clave = (k: string) =>
    `/api/storage/download-url?key=${encodeURIComponent(k)}`;

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || '';
    if (!dbName.includes('test')) {
      throw new Error(
        `ABORT: Solo se permite ceish_test_db. DB recibida: '${dbName}'`,
      );
    }

    storageMock = {
      getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
      generateUploadUrl: jest.fn().mockResolvedValue('https://test.local/up'),
    };

    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
        sendAccountInvitation: jest.fn().mockResolvedValue(undefined),
        sendResolutionEmail: jest.fn().mockResolvedValue(undefined),
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getMetadata: jest.fn().mockResolvedValue({}),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        generateUploadUrl: storageMock.generateUploadUrl,
        getDownloadUrl: storageMock.getDownloadUrl,
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    // Igual que main.ts:38-39: la envoltura { data, statusCode, message } la pone el interceptor.
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    ds = app.get(DataSource);
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!current_database.includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();
    resolucionesAntes = await contarResoluciones();

    const password = randomBytes(18).toString('base64url');
    const hash = await bcrypt.hash(password, 10);
    for (const key of Object.keys(ROL) as Usuario[]) {
      const id = await insertUser(key, hash);
      userId[key] = id;
      await assignRole(id, ROL[key]);
    }
    await sembrar();

    for (const key of Object.keys(ROL) as Usuario[]) {
      token[key] = await login(email(key), password);
    }
  });

  afterAll(async () => {
    if (ds) {
      await cleanup();
      const resolucionesDespues = await contarResoluciones();
      if (resolucionesDespues !== resolucionesAntes) {
        throw new Error(
          `Residuo: resoluciones ${resolucionesAntes} → ${resolucionesDespues}`,
        );
      }
    }
    if (app) await app.close();
  });

  describe('GET /api/storage/download-url por prefijo', () => {
    const carta = () =>
      `protocols/${protocolId}/resolutions/${PREFIX}carta.pdf`;
    const requisito = () =>
      `protocols/${protocolId}/requirements/${PREFIX}req/doc.pdf`;
    const docEval = () =>
      `protocols/${protocolId}/docEvaluacion/${PREFIX}informe.pdf`;

    it('carta: principal 200; presidente y secretaría 200; otro investigador, evaluador y ajeno 404', async () => {
      const ok = await api()
        .get(clave(carta()))
        .set('Authorization', `Bearer ${token.investigador}`);
      expect(ok.status).toBe(200);
      expect(ok.body.data.downloadUrl).toBe('https://test.local/f.pdf');
      for (const u of ['presidente', 'secretaria'] as Usuario[]) {
        const r = await api()
          .get(clave(carta()))
          .set('Authorization', `Bearer ${token[u]}`);
        expect(r.status).toBe(200);
      }
      for (const u of [
        'otroInvestigador',
        'evaluador',
        'evaluadorAjeno',
      ] as Usuario[]) {
        const r = await api()
          .get(clave(carta()))
          .set('Authorization', `Bearer ${token[u]}`);
        expect(r.status).toBe(404);
        expect(r.body.message).toBe(NO_ARCHIVO);
      }
    });

    it('requisitos: principal 200; evaluador asignado 200; secretaría 200; otro investigador y ajeno 404', async () => {
      const get = (u: Usuario) =>
        api()
          .get(clave(requisito()))
          .set('Authorization', `Bearer ${token[u]}`);
      expect((await get('investigador')).status).toBe(200);
      expect((await get('evaluador')).status).toBe(200);
      expect((await get('secretaria')).status).toBe(200);
      expect((await get('otroInvestigador')).status).toBe(404);
      expect((await get('evaluadorAjeno')).status).toBe(404);
    });

    it('documento de evaluación: evaluador asignado y secretaría 200; investigador principal, otro investigador y ajeno 404', async () => {
      const get = (u: Usuario) =>
        api().get(clave(docEval())).set('Authorization', `Bearer ${token[u]}`);
      expect((await get('evaluador')).status).toBe(200);
      expect((await get('secretaria')).status).toBe(200);
      expect((await get('investigador')).status).toBe(404);
      expect((await get('otroInvestigador')).status).toBe(404);
      expect((await get('evaluadorAjeno')).status).toBe(404);
    });

    it('CV: solo el propio investigador; secretaría recibe 404', async () => {
      const cv = `investigators/${userId.investigador}/cv/${PREFIX}cv.pdf`;
      const get = (u: Usuario) =>
        api().get(clave(cv)).set('Authorization', `Bearer ${token[u]}`);
      expect((await get('investigador')).status).toBe(200);
      expect((await get('secretaria')).status).toBe(404);
    });

    it('Anexo 9 por clave: solo EVALUACION_INFORMES; evaluador dueño recibe 404 por esta vía', async () => {
      const anexo = `evaluations/anexo9/${PREFIX}x.pdf`;
      const get = (u: Usuario) =>
        api().get(clave(anexo)).set('Authorization', `Bearer ${token[u]}`);
      expect((await get('secretaria')).status).toBe(200);
      expect((await get('evaluador')).status).toBe(404);
    });

    it('plantilla: cualquier autenticado 200', async () => {
      const r = await api()
        .get(clave('templates/formato_respuesta.docx'))
        .set('Authorization', `Bearer ${token.evaluadorAjeno}`);
      expect(r.status).toBe(200);
    });

    it('`..` → 400; `draft/` → 400; prefijo desconocido → 404', async () => {
      const h = `Bearer ${token.secretaria}`;
      const dotdot = await api()
        .get(clave('../secreto.pdf'))
        .set('Authorization', h);
      expect(dotdot.status).toBe(400);
      const draft = await api()
        .get(clave('draft/x.pdf'))
        .set('Authorization', h);
      expect(draft.status).toBe(400);
      const desconocido = await api()
        .get(clave('archivo-sin-prefijo.pdf'))
        .set('Authorization', h);
      expect(desconocido.status).toBe(404);
      expect(desconocido.body.message).toBe(NO_ARCHIVO);
    });

    it('sin sesión → 401', async () => {
      const r = await api().get(clave(carta()));
      expect(r.status).toBe(401);
    });

    it('POST con el cuerpo { key }: dueño 201; otro investigador 404', async () => {
      const ok = await api()
        .post('/api/storage/download-url')
        .set('Authorization', `Bearer ${token.investigador}`)
        .send({ key: carta() });
      expect(ok.status).toBe(201);
      expect(ok.body.data.downloadUrl).toBe('https://test.local/f.pdf');
      const ajeno = await api()
        .post('/api/storage/download-url')
        .set('Authorization', `Bearer ${token.otroInvestigador}`)
        .send({ key: carta() });
      expect(ajeno.status).toBe(404);
    });
  });

  describe('documento de recepción por id (hallazgo I)', () => {
    const url = (id: number) => `/api/reception/document/${id}/download-url`;

    it('principal 200; secretaría 200; evaluador asignado 200; otro investigador y ajeno 404', async () => {
      const get = (u: Usuario) =>
        api().get(url(documentoId)).set('Authorization', `Bearer ${token[u]}`);
      const ok = await get('investigador');
      expect(ok.status).toBe(200);
      expect(ok.body.data.downloadUrl).toBe('https://test.local/f.pdf');
      expect((await get('secretaria')).status).toBe(200);
      expect((await get('evaluador')).status).toBe(200);
      const ajeno = await get('otroInvestigador');
      expect(ajeno.status).toBe(404);
      expect(ajeno.body.message).toBe(NO_DOCUMENTO);
      expect((await get('evaluadorAjeno')).status).toBe(404);
    });

    it('view: documento ajeno 404 «Documento no encontrado.»', async () => {
      const r = await api()
        .get(`/api/reception/document/${documentoId}/view`)
        .set('Authorization', `Bearer ${token.otroInvestigador}`);
      expect(r.status).toBe(404);
      expect(r.body.message).toBe(NO_DOCUMENTO);
    });

    it('id inexistente → 404 «Documento no encontrado.»', async () => {
      const r = await api()
        .get(url(999999999))
        .set('Authorization', `Bearer ${token.secretaria}`);
      expect(r.status).toBe(404);
      expect(r.body.message).toBe(NO_DOCUMENTO);
    });
  });

  describe('Anexo 9 por evaluación (hallazgo Evaluador / tarea B7)', () => {
    it('GET /evaluations/:id/document: evaluador dueño 200; secretaría y presidente 200; evaluador ajeno 404', async () => {
      const get = (u: Usuario) =>
        api()
          .get(`/api/evaluations/${evaluacionId}/document`)
          .set('Authorization', `Bearer ${token[u]}`);
      const dueno = await get('evaluador');
      expect(dueno.status).toBe(200);
      expect(dueno.body.data.downloadUrl).toBe('https://test.local/f.pdf');
      expect((await get('secretaria')).status).toBe(200);
      expect((await get('presidente')).status).toBe(200);
      const ajeno = await get('evaluadorAjeno');
      expect(ajeno.status).toBe(404);
      expect(ajeno.body.message).toContain(NO_EVALUACION);
    });

    it('GET /evaluations/:id/document/docx: mismas reglas', async () => {
      const get = (u: Usuario) =>
        api()
          .get(`/api/evaluations/${evaluacionId}/document/docx`)
          .set('Authorization', `Bearer ${token[u]}`);
      expect((await get('evaluador')).status).toBe(200);
      expect((await get('secretaria')).status).toBe(200);
      const ajeno = await get('evaluadorAjeno');
      expect(ajeno.status).toBe(404);
      expect(ajeno.body.message).toContain(NO_EVALUACION);
    });

    it('investigador: 403 por permiso de rol (EVALUACION_PLENO), antes de la regla de dueño', async () => {
      const r = await api()
        .get(`/api/evaluations/${evaluacionId}/document`)
        .set('Authorization', `Bearer ${token.investigador}`);
      expect(r.status).toBe(403);
    });
  });

  /** TSK-015-N22b: POST /api/storage/upload-url aplica assertCanWrite antes de firmar. */
  describe('POST /api/storage/upload-url por clave (TSK-015-N22b)', () => {
    const PDF = 'application/pdf';
    const DOCX =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const subir = (u: Usuario, key: string, contentType: string) =>
      api()
        .post('/api/storage/upload-url')
        .set('Authorization', `Bearer ${token[u]}`)
        .send({ key, contentType });

    let pBorrador: number;
    let pSubsDoc: number;
    let pRevision: number;
    let pVersion: number;
    let pEval: number;
    let evalVersionId: number;
    let asignacionEvaluador: number;

    /** Protocolo ZZ_TEST_SA_ con versión activa, estado de protocolo y de recepción. */
    async function crearProtocolo(
      sufijo: string,
      estadoProtocolo: number,
      numeroVersion: number,
      estadoRecepcion: number | null,
    ): Promise<{ protocolId: number; versionId: number }> {
      const [p] = await ds.query(
        `INSERT INTO public.protocolos (titulo, investigador_principal_id, estado_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [`${PREFIX}${sufijo}`, userId.investigador, estadoProtocolo],
      );
      const [v] = await ds.query(
        `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version)
         VALUES ($1, $2) RETURNING id`,
        [p.id, numeroVersion],
      );
      await ds.query(
        `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
        [v.id, p.id],
      );
      if (estadoRecepcion !== null) {
        await ds.query(
          `INSERT INTO recepcion.recepciones (version_id, estado_id) VALUES ($1, $2)`,
          [v.id, estadoRecepcion],
        );
      }
      return { protocolId: p.id, versionId: v.id };
    }

    beforeAll(async () => {
      storageMock.generateUploadUrl.mockClear();
      pBorrador = (await crearProtocolo('up-borrador', 9, 1, 9)).protocolId;
      pSubsDoc = (await crearProtocolo('up-subs-doc', 13, 1, 20)).protocolId;
      pRevision = (await crearProtocolo('up-revision', 13, 1, 15)).protocolId;
      pVersion = (await crearProtocolo('up-version', 19, 2, 9)).protocolId;
      const eval_ = await crearProtocolo('up-evaluacion', 13, 1, 15);
      pEval = eval_.protocolId;
      evalVersionId = eval_.versionId;
      const [a] = await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ($1, $2, 6) RETURNING id`,
        [evalVersionId, userId.evaluador],
      );
      asignacionEvaluador = a.id;
      await ds.query(
        `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
         VALUES ($1, $2, 7)`,
        [evalVersionId, userId.evaluadorAjeno],
      );
    });

    it('requisitos en BORRADOR (recepción 9) → 200 con la clave firmada', async () => {
      const key = `protocols/${pBorrador}/requirements/${PREFIX}r1/doc.pdf`;
      const r = await subir('investigador', key, PDF);
      expect(r.status).toBe(201);
      expect(r.body.data.uploadUrl).toBe('https://test.local/up');
      expect(r.body.data.key).toBe(key);
    });

    it('requisitos en subsanación documental (recepción 20) → 200', async () => {
      const r = await subir(
        'investigador',
        `protocols/${pSubsDoc}/requirements/${PREFIX}r1/doc.pdf`,
        PDF,
      );
      expect(r.status).toBe(201);
    });

    it('principal con recepción en revisión (15) → 409 en español', async () => {
      const r = await subir(
        'investigador',
        `protocols/${pRevision}/requirements/${PREFIX}r1/doc.pdf`,
        PDF,
      );
      expect(r.status).toBe(409);
      expect(r.body.message).toBe(
        'El protocolo no admite subir documentos en su estado actual.',
      );
    });

    it('subsanación de versión v2 con protocolo en 19 → 200; con el protocolo fuera de 19 → 409', async () => {
      const ok = await subir(
        'investigador',
        `protocols/${pVersion}/v2/requirements/${PREFIX}r1/doc.pdf`,
        PDF,
      );
      expect(ok.status).toBe(201);
      const fuera = await subir(
        'investigador',
        `protocols/${pRevision}/v2/requirements/${PREFIX}r1/doc.pdf`,
        PDF,
      );
      expect(fuera.status).toBe(409);
    });

    it('SECRETARIA y otro investigador en requisitos → 404 «Archivo no encontrado.»', async () => {
      const key = `protocols/${pBorrador}/requirements/${PREFIX}r2/doc.pdf`;
      for (const u of ['secretaria', 'otroInvestigador'] as Usuario[]) {
        const r = await subir(u, key, PDF);
        expect(r.status).toBe(404);
        expect(r.body.message).toBe(NO_ARCHIVO);
      }
    });

    it('requisitos con DOCX → 400 (solo PDF)', async () => {
      const r = await subir(
        'investigador',
        `protocols/${pBorrador}/requirements/${PREFIX}r3/doc.docx`,
        DOCX,
      );
      expect(r.status).toBe(400);
      expect(r.body.message).toBe(
        'Tipo de contenido no permitido para esta clave.',
      );
    });

    it('plantillas sin CONFIG_PLANTILLAS → 403', async () => {
      const r = await subir(
        'investigador',
        `templates/${PREFIX}formato_template.docx`,
        DOCX,
      );
      expect(r.status).toBe(403);
      expect(r.body.message).toBe('No tienes permiso para subir plantillas.');
    });

    it('resoluciones sin RESOLUCION_CREAR → 403', async () => {
      const r = await subir(
        'investigador',
        `protocols/${pBorrador}/resolutions/${PREFIX}carta.pdf`,
        PDF,
      );
      expect(r.status).toBe(403);
    });

    it('CV: el propio investigador → 201; otro usuario → 404', async () => {
      const key = `investigators/${userId.investigador}/cv/${PREFIX}cv.pdf`;
      expect((await subir('investigador', key, PDF)).status).toBe(201);
      const ajeno = await subir('otroInvestigador', key, PDF);
      expect(ajeno.status).toBe(404);
    });

    it('docEvaluacion: evaluador con asignación ASIGNADA (6) → 201; SUGERIDA (5) y COMPLETADA (7) → 404', async () => {
      const key = `protocols/${pEval}/docEvaluacion/${PREFIX}informe.pdf`;
      expect((await subir('evaluador', key, PDF)).status).toBe(201);

      const ajeno = await subir('evaluadorAjeno', key, PDF);
      expect(ajeno.status).toBe(404);

      await ds.query(
        `UPDATE evaluacion.asignaciones_evaluacion SET estado_id = 5 WHERE id = $1`,
        [asignacionEvaluador],
      );
      try {
        expect((await subir('evaluador', key, PDF)).status).toBe(404);
      } finally {
        await ds.query(
          `UPDATE evaluacion.asignaciones_evaluacion SET estado_id = 6 WHERE id = $1`,
          [asignacionEvaluador],
        );
      }
    });

    it('clave con traversal → 400', async () => {
      const r = await subir('investigador', 'protocols/1/../2/x.pdf', PDF);
      expect(r.status).toBe(400);
    });

    it('solo las subidas permitidas llegan al adaptador de storage (5 firmas)', () => {
      expect(storageMock.generateUploadUrl).toHaveBeenCalledTimes(5);
    });
  });
});
