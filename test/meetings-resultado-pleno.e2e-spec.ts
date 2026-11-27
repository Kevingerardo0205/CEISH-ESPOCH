/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-015-N08 — spec-003 RF-17.1 (v1.6.2): PATCH /api/evaluations/meetings/:id/protocolos/:cpId/resultado.
 *
 * Guards reales y login real. Todas las cuentas son ZZ_TEST_RES_ con contraseña generada aquí
 * (no se escribe en el código ni se imprime). No usa cuentas reales.
 *
 * Datos sembrados por caso y borrados en afterAll. Solo ceish_test_db.
 * Mutaciones: quitar la validación de motivo, quitar @Permissions (cubierto por la prueba de
 * metadatos en meetings.controller.spec.ts) o invertir la ventana de fecha deben hacer fallar.
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
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { AuditService } from '../src/modules/audit/application/services/audit.service';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';

const PREFIX = 'ZZ_TEST_RES_';
const EMAIL_DOMAIN = '@e2e-res.test';
const ZONE = 'America/Guayaquil';
/** Hoy en Ecuador, a una hora que ya pasó (punto medio entre las 00:00 y ahora). */
const START_OF_TODAY_SQL = `(date_trunc('day', NOW() AT TIME ZONE '${ZONE}') AT TIME ZONE '${ZONE}')`;
const REUNION_PASADA_HOY_SQL = `(${START_OF_TODAY_SQL} + (NOW() - ${START_OF_TODAY_SQL}) / 2)`;

type Usuario = 'secretaria' | 'presidente' | 'evaluador' | 'investigador';

describe('TSK-015-N08 — PATCH /api/evaluations/meetings/:id/protocolos/:cpId/resultado (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Partial<Record<Usuario, string>> = {};
  const userId: Partial<Record<Usuario, number>> = {};
  let principalId: number;

  const api = () => request(app.getHttpServer());
  const url = (convId: string, cpId: string) =>
    `/api/evaluations/meetings/${convId}/protocolos/${cpId}/resultado`;
  const patch = (who: Usuario, convId: string, cpId: string, body: object) =>
    api()
      .patch(url(convId, cpId))
      .set('Authorization', `Bearer ${token[who]}`)
      .send(body);

  async function cleanup(): Promise<void> {
    const convIds = `SELECT id FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`;
    const protocolIds = `SELECT id FROM public.protocolos WHERE titulo LIKE '${PREFIX}%'`;
    const cpIds = `SELECT id FROM evaluacion.convocatoria_protocolos
                    WHERE convocatoria_id IN (${convIds}) OR protocolo_id IN (${protocolIds})`;
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolo_resultados
        WHERE convocatoria_protocolo_id IN (${cpIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos
        WHERE id IN (${cpIds})`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE titulo LIKE '${PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN (${protocolIds})`,
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

  async function login(email: string, password: string): Promise<string> {
    const res = await api().post('/api/auth/login').send({ email, password });
    // Con ResponseInterceptor (aplicado arriba) el token va en body.data.access_token.
    const token: unknown = res.body?.data?.access_token;
    if (res.status !== 201 || typeof token !== 'string') {
      throw new Error(`Login de ${email} falló con status ${res.status}`);
    }
    return token;
  }

  async function insertUser(
    key: string,
    passwordHash: string | null,
  ): Promise<number> {
    const [row] = await ds.query(
      `INSERT INTO catalogos.usuarios
         (cedula, nombres_completos, email_institucional, password_hash, activo, email_verificado)
       VALUES ($1, $2, $3, $4, true, true) RETURNING id`,
      [
        `ZZRS${key}`.slice(0, 20),
        `${PREFIX}${key}`,
        `${key}${EMAIL_DOMAIN}`,
        passwordHash,
      ],
    );
    return row.id;
  }

  async function assignRole(userId: number, roleCode: string): Promise<void> {
    await ds.query(
      `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
       SELECT $1, id FROM catalogos.roles WHERE codigo = $2`,
      [userId, roleCode],
    );
  }

  /** Convocatoria ZZ_TEST_RES_. `fechaSql` es una expresión SQL fija de esta prueba. */
  async function insertMeeting(
    num: string,
    fechaSql: string,
    estado: 'PROGRAMADA' | 'CANCELADA' = 'PROGRAMADA',
  ): Promise<string> {
    const [row] = await ds.query(
      `INSERT INTO evaluacion.convocatorias
         (numero_convocatoria, anio_lectivo, tipo_session, fecha_reunion, estado, lugar_id)
       VALUES ($1, 2090, 'ORDINARIA', ${fechaSql}, $2, NULL) RETURNING id`,
      [`${PREFIX}${num}`, estado],
    );
    return row.id;
  }

  /** Protocolo ZZ_TEST_RES_ con una versión; devuelve su id y el estado inicial. */
  async function insertProtocol(
    key: string,
  ): Promise<{ protocolId: number; versionId: number }> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id)
       VALUES ($1, $2) RETURNING id`,
      [`${PREFIX}${key}`, principalId],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version)
       VALUES ($1, 1) RETURNING id`,
      [p.id],
    );
    return { protocolId: p.id, versionId: v.id };
  }

  /** Punto de la convocatoria; devuelve su uuid. */
  async function insertCp(
    convId: string,
    protocolId: number,
    versionId: number,
  ): Promise<string> {
    const [row] = await ds.query(
      `INSERT INTO evaluacion.convocatoria_protocolos
         (convocatoria_id, protocolo_id, version_id, orden, fecha_plazo_normativo)
       VALUES ($1, $2, $3, 1, NOW()) RETURNING id`,
      [convId, protocolId, versionId],
    );
    return row.id;
  }

  /** Siembra una convocatoria con un punto. Devuelve los ids del caso. */
  async function sembrar(
    num: string,
    fechaSql: string = REUNION_PASADA_HOY_SQL,
    estado: 'PROGRAMADA' | 'CANCELADA' = 'PROGRAMADA',
  ): Promise<{ convId: string; cpId: string; protocolId: number }> {
    const convId = await insertMeeting(num, fechaSql, estado);
    const { protocolId, versionId } = await insertProtocol(num);
    const cpId = await insertCp(convId, protocolId, versionId);
    return { convId, cpId, protocolId };
  }

  async function historial(cpId: string): Promise<Array<Record<string, any>>> {
    return ds.query(
      `SELECT resultado, motivo, observaciones, motivo_correccion, registrado_por
         FROM evaluacion.convocatoria_protocolo_resultados
        WHERE convocatoria_protocolo_id = $1
        ORDER BY id`,
      [cpId],
    );
  }

  async function valorVigente(cpId: string): Promise<Record<string, any>> {
    const [row] = await ds.query(
      `SELECT dictamen_resultado, dictamen_motivo, dictamen_observaciones, dictamen_registrado_por
         FROM evaluacion.convocatoria_protocolos WHERE id = $1`,
      [cpId],
    );
    return row;
  }

  beforeAll(async () => {
    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue({
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
        sendAccountInvitation: jest.fn().mockResolvedValue(undefined),
        sendHtml: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(AuditService)
      .useValue({ createLog: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(IStorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getFileUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        getDownloadUrl: jest.fn().mockResolvedValue('https://test.local/f.pdf'),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = fix.createNestApplication();
    app.setGlobalPrefix('api');
    // Igual que main.ts:38-39: la envoltura { data, statusCode, message } la pone el interceptor.
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();
    ds = app.get(DataSource);

    const [{ current_database: active }] = await ds.query(
      'SELECT current_database()',
    );
    if (!String(active).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${active}'.`);
    }

    await cleanup();
    (PermissionsGuard as any).cache.clear();

    // Contraseña generada aquí para todas las cuentas de la prueba; nunca se imprime.
    const generada = `${randomBytes(12).toString('base64url')}Aa1!`;
    const hash = await bcrypt.hash(generada, 10);

    const roles: Array<[Usuario, string]> = [
      ['secretaria', 'SECRETARIA'],
      ['presidente', 'PRESIDENTE'],
      ['evaluador', 'EVALUADOR'],
      ['investigador', 'INVESTIGADOR'],
    ];
    for (const [key, rol] of roles) {
      userId[key] = await insertUser(key, hash);
      await assignRole(userId[key], rol);
      token[key] = await login(`${key}${EMAIL_DOMAIN}`, generada);
    }
    principalId = await insertUser('principal', null);
  }, 120_000);

  afterEach(async () => {
    // Solo los datos de cada caso; las cuentas se conservan hasta afterAll.
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolo_resultados WHERE convocatoria_protocolo_id IN
         (SELECT cp.id FROM evaluacion.convocatoria_protocolos cp
            JOIN evaluacion.convocatorias c ON c.id = cp.convocatoria_id
           WHERE c.numero_convocatoria LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatoria_protocolos WHERE convocatoria_id IN
         (SELECT id FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%')`,
    );
    await ds.query(
      `DELETE FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%'`,
    );
  });

  afterAll(async () => {
    if (ds) {
      await cleanup();
      const [residuos] = await ds.query(
        `SELECT (
           (SELECT count(*) FROM evaluacion.convocatorias WHERE numero_convocatoria LIKE '${PREFIX}%') +
           (SELECT count(*) FROM public.protocolos WHERE titulo LIKE '${PREFIX}%') +
           (SELECT count(*) FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}')
         )::int AS n`,
      );
      if (residuos.n !== 0) {
        throw new Error(
          `Quedaron ${residuos.n} residuos ZZ_TEST_RES_ en ceish_test_db.`,
        );
      }
    }
    if (app) await app.close();
  });

  // TSK-015-N27-5 (RF-17.1 v1.6.8): el registro manual se retiró. La ruta conserva sus guards y
  // responde 410 Gone; no escribe en el historial ni en el valor vigente.
  describe('retirado (TSK-015-N27-5, 410 Gone)', () => {
    const CONV_INEXISTENTE = '00000000-0000-4000-8000-000000000001';
    const CP_INEXISTENTE = '00000000-0000-4000-8000-000000000002';

    it('403 a PRESIDENTE, EVALUADOR e INVESTIGADOR: el guard actúa antes que el 410', async () => {
      for (const who of ['presidente', 'evaluador', 'investigador'] as const) {
        const res = await patch(who, CONV_INEXISTENTE, CP_INEXISTENTE, {
          resultado: 'APROBADO_DEFINITIVO',
        });
        expect(res.status).toBe(403);
      }
    });

    it('410 a SECRETARIA con mensaje en español; sin historial ni valor vigente', async () => {
      const { convId, cpId } = await sembrar('GONE');
      const res = await patch('secretaria', convId, cpId, {
        resultado: 'NO_APROBADO',
        motivo: 'Motivo de prueba',
      });
      expect(res.status).toBe(410);
      expect(String(res.body?.message ?? '')).toContain(
        'ya no se registra a mano',
      );
      expect(await historial(cpId)).toHaveLength(0);
      expect((await valorVigente(cpId)).dictamen_resultado).toBeNull();
    });

    it('410 aunque el cuerpo no sea válido: el DTO ya no se valida (no hay 400)', async () => {
      const { convId, cpId } = await sembrar('GONE2');
      const res = await patch('secretaria', convId, cpId, {
        resultado: 'SUSPENDIDO',
      });
      expect(res.status).toBe(410);
    });
  });
});
