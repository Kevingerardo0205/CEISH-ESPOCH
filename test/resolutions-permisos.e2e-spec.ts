/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */

/**
 * TSK-015-N11 y TSK-015-N17 — spec-003 RF-17.7 y RF-17.6 (v1.6.4).
 *
 * - N11: solo SECRETARIA crea o sube resoluciones (POST /api/resolutions).
 * - N17: GET /api/resolutions/protocol/:id lo leen el investigador principal y quien tiene
 *   RESOLUCION_HISTORIAL. El resto y los protocolos inexistentes reciben 404
 *   «Protocolo no encontrado.». Sin datos de evaluadores.
 *
 * Guards reales y login real. Cuentas propias ZZ_TEST_RSP_ con contraseña generada aquí
 * (no se escribe en el código ni se imprime). No usa cuentas reales.
 *
 * Mutaciones que deben hacer fallar esta suite:
 * - N11: quitar el DELETE de 2000000000002 (PRESIDENTE conserva la concesión → sin 403);
 *   quitar @Permissions de POST /resolutions (PRESIDENTE pasa el guard).
 * - N17: quitar la regla de acceso del servicio (otros reciben 200), o quitar
 *   RESOLUCION_HISTORIAL de la regla (SECRETARIA y PRESIDENTE reciben 404).
 *
 * Solo ceish_test_db. Los datos se borran en afterAll; el conteo de resoluciones vuelve a su valor inicial.
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

const PREFIX = 'ZZ_TEST_RSP_';
const EMAIL_DOMAIN = '@e2e-rsp.test';
const NOT_FOUND = 'Protocolo no encontrado.';

type Usuario =
  | 'presidente'
  | 'secretaria'
  | 'investigador'
  | 'otroInvestigador'
  | 'evaluador';

/** Devuelve todas las claves del objeto (en cualquier nivel). */
function clavesProfundas(valor: unknown, acc: string[] = []): string[] {
  if (Array.isArray(valor)) {
    valor.forEach((v) => clavesProfundas(v, acc));
  } else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) {
      acc.push(k);
      clavesProfundas(v, acc);
    }
  }
  return acc;
}

describe('TSK-015-N11 / TSK-015-N17 — resoluciones: permisos y lectura (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  const token: Partial<Record<Usuario, string>> = {};
  const userId: Partial<Record<Usuario, number>> = {};
  const email = (k: Usuario) => `${k.toLowerCase()}${EMAIL_DOMAIN}`;
  let protocolId: number;
  let resolucionesAntes = 0;

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
      [`ZZRSP${key}`.slice(0, 20), `${PREFIX}${key}`, email(key), passwordHash],
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
    // Con ResponseInterceptor el token va en body.data.access_token.
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

  /** Protocolo ZZ_TEST_RSP_ del investigador principal, con versión y una resolución. */
  async function sembrarProtocolo(
    principalId: number,
    creadoPor: number,
  ): Promise<number> {
    const [p] = await ds.query(
      `INSERT INTO public.protocolos (titulo, investigador_principal_id)
       VALUES ($1, $2) RETURNING id`,
      [`${PREFIX}protocolo`, principalId],
    );
    const [v] = await ds.query(
      `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version)
       VALUES ($1, 1) RETURNING id`,
      [p.id],
    );
    await ds.query(
      `INSERT INTO resolucion.resoluciones
         (protocolo_id, version_id, tipo_resolucion_id, observaciones, archivo_carta_pdf, creado_por)
       VALUES ($1, $2, 1, $3, $4, $5)`,
      [
        p.id,
        v.id,
        `${PREFIX}observacion`,
        `protocols/${p.id}/resolutions/${PREFIX}carta.pdf`,
        creadoPor,
      ],
    );
    return p.id;
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
        sendResolutionEmail: jest.fn().mockResolvedValue(undefined),
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
    const [{ current_database }] = await ds.query('SELECT current_database()');
    if (!current_database.includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${current_database}'.`);
    }

    await cleanup();
    resolucionesAntes = await contarResoluciones();

    // Contraseña generada en cada ejecución; no se imprime ni se guarda.
    const password = randomBytes(18).toString('base64url');
    const hash = await bcrypt.hash(password, 10);

    const roles: Record<Usuario, string> = {
      presidente: 'PRESIDENTE',
      secretaria: 'SECRETARIA',
      investigador: 'INVESTIGADOR',
      otroInvestigador: 'INVESTIGADOR',
      evaluador: 'EVALUADOR',
    };
    for (const key of Object.keys(roles) as Usuario[]) {
      const id = await insertUser(key, hash);
      userId[key] = id;
      await assignRole(id, roles[key]);
    }

    protocolId = await sembrarProtocolo(
      userId.investigador!,
      userId.secretaria!,
    );

    for (const key of Object.keys(roles) as Usuario[]) {
      token[key] = await login(email(key), password);
    }
  }, 60_000);

  afterAll(async () => {
    if (ds) {
      await cleanup();
      const despues = await contarResoluciones();
      if (despues !== resolucionesAntes) {
        throw new Error(
          `Residuo: resolucion.resoluciones pasó de ${resolucionesAntes} a ${despues}`,
        );
      }
    }
    if (app) await app.close();
  });

  beforeEach(() => (PermissionsGuard as any).cache.clear());

  describe('TSK-015-N11 — POST /api/resolutions', () => {
    it('PRESIDENTE → 403 (ya no tiene RESOLUCION_CREAR)', async () => {
      const res = await api()
        .post('/api/resolutions')
        .set('Authorization', `Bearer ${token.presidente}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('SECRETARIA con cuerpo vacío → no 403 (pasa el permiso); no crea nada', async () => {
      const antes = await contarResoluciones();
      const res = await api()
        .post('/api/resolutions')
        .set('Authorization', `Bearer ${token.secretaria}`)
        .send({});
      // Sin protocolo el servicio responde 400 o 404 (el payload no está validado como DTO).
      expect([400, 404]).toContain(res.status);
      expect(res.status).not.toBe(403);
      expect(await contarResoluciones()).toBe(antes);
    });
  });

  describe('TSK-015-N17 — GET /api/resolutions/protocol/:id', () => {
    const get = (who: Usuario | 'anonimo', id: string | number) => {
      const req = api().get(`/api/resolutions/protocol/${id}`);
      return who === 'anonimo'
        ? req
        : req.set('Authorization', `Bearer ${token[who]}`);
    };

    it('investigador principal → 200 con la resolución', async () => {
      const res = await get('investigador', protocolId);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].protocolId).toBe(protocolId);
    });

    it('otro investigador → 404 «Protocolo no encontrado.»', async () => {
      const res = await get('otroInvestigador', protocolId);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain(NOT_FOUND);
    });

    it('evaluador → 404 «Protocolo no encontrado.»', async () => {
      const res = await get('evaluador', protocolId);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain(NOT_FOUND);
    });

    it('SECRETARIA → 200 (RESOLUCION_HISTORIAL)', async () => {
      const res = await get('secretaria', protocolId);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('PRESIDENTE → 200 (RESOLUCION_HISTORIAL)', async () => {
      const res = await get('presidente', protocolId);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('protocolo inexistente → 404 «Protocolo no encontrado.» (también para SECRETARIA)', async () => {
      const res = await get('secretaria', 2147483000);
      expect(res.status).toBe(404);
      expect(res.body.message).toContain(NOT_FOUND);
    });

    it('id no numérico → 400 en español', async () => {
      const res = await get('secretaria', 'abc');
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ID de protocolo inválido');
    });

    it('sin sesión → 401', async () => {
      const res = await get('anonimo', protocolId);
      expect(res.status).toBe(401);
    });

    it('ninguna respuesta contiene datos del evaluador (nombre, correo ni userId)', async () => {
      const evaluadorId = userId.evaluador!;
      const respuestas = [
        await get('investigador', protocolId),
        await get('secretaria', protocolId),
        await get('presidente', protocolId),
      ];
      for (const res of respuestas) {
        expect(res.status).toBe(200);
        const texto = JSON.stringify(res.body);
        expect(texto).not.toContain(email('evaluador'));
        expect(texto).not.toContain(`${PREFIX}evaluador`);
        const claves = clavesProfundas(res.body).map((k) => k.toLowerCase());
        expect(claves.filter((k) => /evalu|revis|reviewer/.test(k))).toEqual(
          [],
        );
        expect(texto).not.toContain(`"userId":${evaluadorId}`);
      }
    });
  });
});
