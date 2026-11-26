/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * Caracterización (spec-003 TSK-015-N09 / N13, v1.6.6): comportamiento ACTUAL del
 * POST /api/resolutions legacy cuando el dictamen agregado es tipo 2 (APROBADO_CON_OBSERVACIONES).
 * Debe pasar antes de extraer VersionSubsanacionService y seguir pasando después sin cambios.
 *
 * Fija: versión actual → 19 con fecha_resolucion y tipo_resolucion_id 2; nueva versión
 * numero+1 en 21 con plazo_subsanacion_dias = 30 y fecha límite en día hábil; protocolo apunta
 * a la nueva versión con estado 21; recepción nueva en INICIADO (9); checklist: APROBADO y
 * NO_APLICA intactos, el resto a NO_PRESENTADO; una fila nueva en resolucion.resoluciones.
 *
 * Login real de SECRETARIA con cuentas ZZ_TEST_CAR_ (contraseña generada aquí, no se imprime).
 * Storage simulado; las evaluaciones no tienen informe, así que no hay descargas. Residuos = 0.
 * Solo ceish_test_db.
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

const PREFIX = 'ZZ_TEST_CAR_';
const EMAIL_DOMAIN = '@e2e-car.test';
const ESTADO_APROBADO_CON_OBS = 19;
const ESTADO_EN_CONTROL = 21;
const ESTADO_INICIADO = 9;
const TIPO_RESOLUCION_OBS = 2;
const TIPO_ESTUDIO_IO = 5;
const ASIGNACION_COMPLETADA = 7;
const RESULTADO_OBS = 2;

describe('Caracterización — POST /resolutions legacy, dictamen tipo 2 (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let secretariaId: number;
  let investigadorId: number;
  let evaluadorId: number;
  let protocoloId: number;
  let versionId: number;
  let resolucionesAntes = 0;
  const emailSpy = jest.fn().mockResolvedValue(undefined);

  const api = () => request(app.getHttpServer());

  async function cleanup(): Promise<void> {
    const protocolos = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    await ds.query(
      `DELETE FROM resolucion.resoluciones
        WHERE protocolo_id IN (${protocolos})
           OR creado_por IN (SELECT id FROM catalogos.usuarios WHERE email_institucional LIKE $1)`,
      [`%${EMAIL_DOMAIN}`],
    );
    await ds.query(
      `DELETE FROM evaluacion.evaluaciones WHERE asignacion_id IN
         (SELECT a.id FROM evaluacion.asignaciones_evaluacion a
            JOIN public.versiones_protocolo v ON v.id = a.version_id
           WHERE v.protocolo_id IN (${protocolos}))`,
    );
    await ds.query(
      `DELETE FROM evaluacion.asignaciones_evaluacion WHERE version_id IN
         (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolos}))`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN
         (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolos}))`,
    );
    await ds.query(
      `DELETE FROM public.protocolo_requisitos WHERE protocolo_id IN (${protocolos})`,
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

  async function contar(): Promise<{
    resoluciones: number;
    protocolos: number;
    versiones: number;
  }> {
    const [r] = await ds.query(
      `SELECT (SELECT count(*)::int FROM resolucion.resoluciones) AS resoluciones,
              (SELECT count(*)::int FROM public.protocolos) AS protocolos,
              (SELECT count(*)::int FROM public.versiones_protocolo) AS versiones`,
    );
    return r;
  }

  async function insertUser(
    key: string,
    cedula: string,
    hash: string,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [cedula, `${PREFIX}${key}`, `${key.toLowerCase()}${EMAIL_DOMAIN}`, hash],
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

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || '';
    if (!dbName.includes('test')) {
      throw new Error(
        `ABORT: Solo se permite ceish_test_db. DB recibida: '${dbName}'`,
      );
    }

    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
        sendAccountInvitation: jest.fn().mockResolvedValue(undefined),
        sendResolutionEmail: emailSpy,
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue(undefined),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getMetadata: jest.fn().mockResolvedValue({}),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor()); // igual que main.ts:38-39
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    ds = app.get(DataSource);
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!String(current_database).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();
    resolucionesAntes = (await contar()).resoluciones;

    // Contraseña generada en cada ejecución; no se imprime ni se guarda.
    const password = `${randomBytes(18).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(password, 10);
    secretariaId = await insertUser('SECRETARIA', 'ZZCARSEC', hash);
    investigadorId = await insertUser('INVESTIGADOR', 'ZZCARINV', hash);
    evaluadorId = await insertUser('EVALUADOR', 'ZZCAREVA', hash);
    await assignRole(secretariaId, 'SECRETARIA');
    await assignRole(investigadorId, 'INVESTIGADOR');

    const login = await api()
      .post('/api/auth/login')
      .send({ email: `secretaria${EMAIL_DOMAIN}`, password });
    const accessToken: unknown = login.body?.data?.access_token;
    if (login.status !== 201 || typeof accessToken !== 'string') {
      throw new Error(`Login de SECRETARIA falló con status ${login.status}`);
    }
    secretariaToken = accessToken;

    // Protocolo tipo IO con versión 1 en estado 21, checklist con los cuatro estados.
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id, tipo_estudio_id, estado_id, version)
       VALUES ($1, $2, $3, $4, 1) RETURNING id`,
      [
        `${PREFIX}protocolo`,
        investigadorId,
        TIPO_ESTUDIO_IO,
        ESTADO_EN_CONTROL,
      ],
    );
    protocoloId = p.id;
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [protocoloId, ESTADO_EN_CONTROL],
    );
    versionId = v.id;
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [versionId, protocoloId],
    );
    await ds.query(
      `INSERT INTO recepcion.recepciones (version_id, estado_id, creado_por)
       VALUES ($1, $2, $3)`,
      [versionId, ESTADO_INICIADO, secretariaId],
    );
    for (const [codigo, estado] of [
      ['CR_APROBADO', 'APROBADO'],
      ['CR_NO_APLICA', 'NO_APLICA'],
      ['CR_PRESENTADO', 'PRESENTADO'],
      ['CR_NO_PRESENTADO', 'NO_PRESENTADO'],
    ] as const) {
      await ds.query(
        `INSERT INTO public.protocolo_requisitos (protocolo_id, codigo_requisito, nombre_requisito, estado)
         VALUES ($1, $2, $3, $4)`,
        [protocoloId, codigo, `${PREFIX}${codigo}`, estado],
      );
    }

    // Una asignación completada con evaluación de resultado «con observaciones» (2).
    const [a] = await ds.query(
      `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [versionId, evaluadorId, ASIGNACION_COMPLETADA],
    );
    await ds.query(
      `INSERT INTO evaluacion.evaluaciones (asignacion_id, resultado_id, observaciones)
       VALUES ($1, $2, $3)`,
      [a.id, RESULTADO_OBS, `${PREFIX}observaciones`],
    );
  });

  afterAll(async () => {
    if (!ds) return;
    await cleanup();
    const despues = (await contar()).resoluciones;
    if (despues !== resolucionesAntes) {
      throw new Error(
        `Residuos: resoluciones antes ${resolucionesAntes}, después ${despues}`,
      );
    }
    if (app) await app.close();
  });

  it('POST /resolutions con dictamen tipo 2 deja el estado y la v2.0 del comportamiento actual', async () => {
    emailSpy.mockClear();
    const res = await api()
      .post('/api/resolutions')
      .set('Authorization', `Bearer ${secretariaToken}`)
      .send({ protocolId: protocoloId, validityYears: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.resolutionTypeId).toBe(TIPO_RESOLUCION_OBS);

    // Versión 1: estado 19, fecha de resolución y tipo 2.
    const [v1] = await ds.query(
      `SELECT estado_id, fecha_resolucion, tipo_resolucion_id FROM public.versiones_protocolo WHERE id = $1`,
      [versionId],
    );
    expect(v1.estado_id).toBe(ESTADO_APROBADO_CON_OBS);
    expect(v1.fecha_resolucion).not.toBeNull();
    expect(v1.tipo_resolucion_id).toBe(TIPO_RESOLUCION_OBS);

    // Versión 2: numero+1, estado 21, plazo de 30 días hábiles calculado.
    const [v2] = await ds.query(
      `SELECT id, numero_version, estado_id, plazo_subsanacion_dias,
              fecha_limite_subsanacion::text AS limite,
              (fecha_limite_subsanacion - CURRENT_DATE) AS dias_naturales,
              EXTRACT(ISODOW FROM fecha_limite_subsanacion)::int AS dow
         FROM public.versiones_protocolo
        WHERE protocolo_id = $1 AND numero_version = 2`,
      [protocoloId],
    );
    expect(v2).toBeDefined();
    expect(v2.estado_id).toBe(ESTADO_EN_CONTROL);
    expect(v2.plazo_subsanacion_dias).toBe(30);
    expect(v2.dow).toBeLessThanOrEqual(5); // lunes a viernes
    // 30 días hábiles son al menos 42 días naturales.
    expect(v2.dias_naturales).toBeGreaterThanOrEqual(42);

    // Protocolo: apunta a la v2 y queda en 21.
    const [p] = await ds.query(
      `SELECT version_actual_id, estado_id FROM public.protocolos WHERE id = $1`,
      [protocoloId],
    );
    expect(p.version_actual_id).toBe(v2.id);
    expect(p.estado_id).toBe(ESTADO_EN_CONTROL);

    // Recepción nueva de la v2 en INICIADO (9), sin faltantes.
    const [rec] = await ds.query(
      `SELECT estado_id, tiene_faltantes FROM recepcion.recepciones WHERE version_id = $1`,
      [v2.id],
    );
    expect(rec.estado_id).toBe(ESTADO_INICIADO);
    expect(rec.tiene_faltantes).toBe(false);

    // Checklist: APROBADO y NO_APLICA intactos; el resto a NO_PRESENTADO.
    const checklist: Array<{ codigo_requisito: string; estado: string }> =
      await ds.query(
        `SELECT codigo_requisito, estado FROM public.protocolo_requisitos
        WHERE protocolo_id = $1 ORDER BY codigo_requisito`,
        [protocoloId],
      );
    expect(checklist).toEqual([
      { codigo_requisito: 'CR_APROBADO', estado: 'APROBADO' },
      { codigo_requisito: 'CR_NO_APLICA', estado: 'NO_APLICA' },
      { codigo_requisito: 'CR_NO_PRESENTADO', estado: 'NO_PRESENTADO' },
      { codigo_requisito: 'CR_PRESENTADO', estado: 'NO_PRESENTADO' },
    ]);

    // Una resolución nueva ligada a la versión 1, de tipo 2.
    const [r] = await ds.query(
      `SELECT count(*)::int AS c FROM resolucion.resoluciones
        WHERE protocolo_id = $1 AND version_id = $2 AND tipo_resolucion_id = $3`,
      [protocoloId, versionId, TIPO_RESOLUCION_OBS],
    );
    expect(r.c).toBe(1);

    // Sin carta adjunta no hay correo.
    expect(emailSpy).not.toHaveBeenCalled();
  });
});
