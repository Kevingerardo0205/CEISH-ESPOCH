/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

/**
 * Caracterización (spec-003 TSK-015-N13, paso 1): comportamiento ACTUAL del POST /api/resolutions
 * legacy para dictamen tipo 1 (APROBADO) y tipo 3 (RECHAZADO). Debe pasar antes y después de
 * extraer ResultadoResolucionService sin modificarse. Complementa resolutions-legacy-v2 (tipo 2).
 *
 * Fija (tipo 1): versión → 17 con fecha_resolucion y tipo 1; protocolo → 17 con fecha_aprobacion;
 * el protocolo sube su version (@VersionColumn) en 1; no se crea versión nueva ni recepción nueva;
 * el checklist no cambia; una fila en resolucion.resoluciones con tipo 1 y vigencia 1.
 * Fija (tipo 3): versión → 18 con fecha_resolucion y tipo 3; protocolo → 18 sin fecha_aprobacion;
 * no se crea versión nueva; el checklist no cambia; una fila en resoluciones con tipo 3.
 *
 * Datos con prefijo ZZ_TEST_LV13_ y correo @e2e-lv13.test. Contraseña generada en cada ejecución.
 * Solo ceish_test_db. Residuos = 0.
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

const PREFIX = 'ZZ_TEST_LV13_';
const EMAIL_DOMAIN = '@e2e-lv13.test';
const TIPO_IO = 5;
const ESTADO_APROBADO = 17;
const ESTADO_RECHAZADO = 18;
const ESTADO_EN_CONTROL = 21;
const ESTADO_INICIADO = 9;
const ASIGNACION_COMPLETADA = 7;
const RESULTADO_APROBADO = 1;
const RESULTADO_RECHAZADO = 3;

describe('Caracterización — POST /resolutions legacy, dictámenes tipo 1 y 3 (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let secretariaToken: string;
  let secretariaId: number;
  let investigadorId: number;
  let evaluadorId: number;
  let resolucionesAntes = 0;
  const emailSpy = jest.fn().mockResolvedValue(undefined);

  const api = () => request(app.getHttpServer());

  async function cleanup(): Promise<void> {
    const protocolos = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    await ds.query(
      `DELETE FROM resolucion.resoluciones WHERE protocolo_id IN (${protocolos})`,
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

  async function contarResoluciones(): Promise<number> {
    const [r] = await ds.query(
      `SELECT count(*)::int AS c FROM resolucion.resoluciones`,
    );
    return r.c;
  }

  async function insertUser(key: string, cedula: string, hash: string) {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [cedula, `${PREFIX}${key}`, `${key.toLowerCase()}${EMAIL_DOMAIN}`, hash],
    );
    return row.id as number;
  }

  /** Protocolo IO en 21 con versión 1, recepción en INICIADO, checklist de 4 estados y una evaluación completada. */
  async function fixtureDictamen(nombre: string, resultadoId: number) {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id, tipo_estudio_id, estado_id, version)
       VALUES ($1, $2, $3, $4, 1) RETURNING id`,
      [`${PREFIX}${nombre}`, investigadorId, TIPO_IO, ESTADO_EN_CONTROL],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
       VALUES ($1, 1, $2) RETURNING id`,
      [p.id, ESTADO_EN_CONTROL],
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
      [v.id, p.id],
    );
    await ds.query(
      `INSERT INTO recepcion.recepciones (version_id, estado_id, creado_por)
       VALUES ($1, $2, $3)`,
      [v.id, ESTADO_INICIADO, secretariaId],
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
        [p.id, codigo, `${PREFIX}${codigo}`, estado],
      );
    }
    const [a] = await ds.query(
      `INSERT INTO evaluacion.asignaciones_evaluacion (version_id, evaluador_id, estado_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [v.id, evaluadorId, ASIGNACION_COMPLETADA],
    );
    await ds.query(
      `INSERT INTO evaluacion.evaluaciones (asignacion_id, resultado_id, observaciones)
       VALUES ($1, $2, $3)`,
      [a.id, resultadoId, `${PREFIX}observaciones`],
    );
    return { protocoloId: p.id as number, versionId: v.id as number };
  }

  async function estadoChecklist(protocoloId: number) {
    return ds.query(
      `SELECT codigo_requisito, estado FROM public.protocolo_requisitos
        WHERE protocolo_id = $1 ORDER BY codigo_requisito`,
      [protocoloId],
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
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();

    ds = app.get(DataSource);
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!String(current_database).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();
    resolucionesAntes = await contarResoluciones();

    const password = `${randomBytes(18).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(password, 10);
    secretariaId = await insertUser('SECRETARIA', 'ZZLV13SEC', hash);
    investigadorId = await insertUser('INVESTIGADOR', 'ZZLV13INV', hash);
    evaluadorId = await insertUser('EVALUADOR', 'ZZLV13EVA', hash);
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = 'SECRETARIA'`,
      [secretariaId],
    );

    const login = await api()
      .post('/api/auth/login')
      .send({ email: `secretaria${EMAIL_DOMAIN}`, password });
    const accessToken: unknown = login.body?.data?.access_token;
    if (login.status !== 201 || typeof accessToken !== 'string') {
      throw new Error(`Login de SECRETARIA falló con status ${login.status}`);
    }
    secretariaToken = accessToken;
  });

  afterAll(async () => {
    if (!ds) return;
    await cleanup();
    const despues = await contarResoluciones();
    if (despues !== resolucionesAntes) {
      throw new Error(
        `Residuos: resoluciones antes ${resolucionesAntes}, después ${despues}`,
      );
    }
    if (app) await app.close();
  });

  it('POST /resolutions con dictamen tipo 1 (APROBADO) deja el estado 17 y la fecha de aprobación del comportamiento actual', async () => {
    emailSpy.mockClear();
    const { protocoloId, versionId } = await fixtureDictamen(
      'aprobado',
      RESULTADO_APROBADO,
    );
    const [antes] = await ds.query(
      `SELECT version FROM public.protocolos WHERE id = $1`,
      [protocoloId],
    );
    const checklistAntes = await estadoChecklist(protocoloId);

    const res = await api()
      .post('/api/resolutions')
      .set('Authorization', `Bearer ${secretariaToken}`)
      .send({ protocolId: protocoloId, validityYears: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.resolutionTypeId).toBe(RESULTADO_APROBADO);

    // Versión evaluada: estado 17, fecha de resolución y tipo 1.
    const [v] = await ds.query(
      `SELECT estado_id, fecha_resolucion IS NOT NULL AS tiene_fecha, tipo_resolucion_id
         FROM public.versiones_protocolo WHERE id = $1`,
      [versionId],
    );
    expect(v.estado_id).toBe(ESTADO_APROBADO);
    expect(v.tiene_fecha).toBe(true);
    expect(v.tipo_resolucion_id).toBe(RESULTADO_APROBADO);

    // Protocolo: estado 17, fecha de aprobación, version incrementada por TypeORM (@VersionColumn),
    // y la misma versión activa (no hay v2.0 en la aprobación).
    const [p] = await ds.query(
      `SELECT estado_id, fecha_aprobacion IS NOT NULL AS tiene_aprobacion, version,
              version_actual_id
         FROM public.protocolos WHERE id = $1`,
      [protocoloId],
    );
    expect(p.estado_id).toBe(ESTADO_APROBADO);
    expect(p.tiene_aprobacion).toBe(true);
    expect(p.version).toBe(antes.version + 1);
    expect(p.version_actual_id).toBe(versionId);

    // Sin versión nueva ni recepción nueva.
    const [vs] = await ds.query(
      `SELECT count(*)::int AS c FROM public.versiones_protocolo WHERE protocolo_id = $1`,
      [protocoloId],
    );
    expect(vs.c).toBe(1);

    // Checklist sin cambios.
    expect(await estadoChecklist(protocoloId)).toEqual(checklistAntes);

    // Fila de resolución ligada a la versión evaluada, tipo 1, vigencia 1, sin seguimiento ni observaciones.
    const [r] = await ds.query(
      `SELECT count(*)::int AS c, min(vigencia_aprobacion_anios) AS vig,
              min(periodo_seguimiento_dias) AS seg, min(observaciones) AS obs
         FROM resolucion.resoluciones
        WHERE protocolo_id = $1 AND version_id = $2 AND tipo_resolucion_id = $3`,
      [protocoloId, versionId, RESULTADO_APROBADO],
    );
    expect(r.c).toBe(1);
    expect(r.vig).toBe(1);
    expect(r.seg).toBeNull();
    expect(r.obs).toBeNull();

    // Sin carta adjunta no hay correo.
    expect(emailSpy).not.toHaveBeenCalled();
  });

  it('POST /resolutions con dictamen tipo 3 (RECHAZADO) deja el estado 18 sin fecha de aprobación del comportamiento actual', async () => {
    emailSpy.mockClear();
    const { protocoloId, versionId } = await fixtureDictamen(
      'rechazado',
      RESULTADO_RECHAZADO,
    );
    const checklistAntes = await estadoChecklist(protocoloId);

    const res = await api()
      .post('/api/resolutions')
      .set('Authorization', `Bearer ${secretariaToken}`)
      .send({ protocolId: protocoloId, validityYears: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.resolutionTypeId).toBe(RESULTADO_RECHAZADO);

    const [v] = await ds.query(
      `SELECT estado_id, fecha_resolucion IS NOT NULL AS tiene_fecha, tipo_resolucion_id
         FROM public.versiones_protocolo WHERE id = $1`,
      [versionId],
    );
    expect(v.estado_id).toBe(ESTADO_RECHAZADO);
    expect(v.tiene_fecha).toBe(true);
    expect(v.tipo_resolucion_id).toBe(RESULTADO_RECHAZADO);

    const [p] = await ds.query(
      `SELECT estado_id, fecha_aprobacion, version_actual_id
         FROM public.protocolos WHERE id = $1`,
      [protocoloId],
    );
    expect(p.estado_id).toBe(ESTADO_RECHAZADO);
    expect(p.fecha_aprobacion).toBeNull();
    expect(p.version_actual_id).toBe(versionId);

    const [vs] = await ds.query(
      `SELECT count(*)::int AS c FROM public.versiones_protocolo WHERE protocolo_id = $1`,
      [protocoloId],
    );
    expect(vs.c).toBe(1);

    // El tipo 3 no reinicia el checklist (solo lo hace el tipo 2).
    expect(await estadoChecklist(protocoloId)).toEqual(checklistAntes);

    const [r] = await ds.query(
      `SELECT count(*)::int AS c FROM resolucion.resoluciones
        WHERE protocolo_id = $1 AND version_id = $2 AND tipo_resolucion_id = $3`,
      [protocoloId, versionId, RESULTADO_RECHAZADO],
    );
    expect(r.c).toBe(1);
    expect(emailSpy).not.toHaveBeenCalled();
  });
});
