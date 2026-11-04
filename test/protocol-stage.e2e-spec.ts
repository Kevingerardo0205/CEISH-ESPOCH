/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * TSK-001.2 — spec-001 RF-EST.1 / RF-EST.2 (parcial) v3.5.5.
 * Etapa y orden en catalogos.estados, y `etapa` / `etapaOrden` en
 * GET /protocols y GET /reception/protocols. Corre solo contra ceish_test_db.
 * Datos: protocolos con título ZZ_TEST_EST_ y un usuario @e2e-etapas.test,
 * borrados en beforeAll y afterAll.
 */
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
process.env.DB_HOST =
  process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || process.env.DB_PORT || '3100';
if (process.env.TEST_DB_USER)
  process.env.DB_USERNAME = process.env.TEST_DB_USER;
if (process.env.TEST_DB_PASSWORD)
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;

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
import { AuditService } from '../src/modules/audit/application/services/audit.service';

const TITLE_PREFIX = 'ZZ_TEST_EST_';
const EMAIL_DOMAIN = '@e2e-etapas.test';
const TEST_IP = '10.0.7.2';

/** Tabla E3 de spec-001 RF-EST.1 (por id del catálogo). */
const EXPECTED_CATALOG: Record<number, [string | null, number | null]> = {
  1: [null, null],
  2: [null, null],
  3: [null, null],
  4: [null, null],
  5: [null, null],
  6: [null, null],
  7: [null, null],
  8: [null, null],
  9: ['RECEPCION', 1],
  10: ['ASIGNACION', 2],
  11: ['RECEPCION', 1],
  12: ['RECEPCION', 1],
  13: ['EVALUACION', 3],
  14: ['RESOLUCION', 4],
  15: ['RECEPCION', 1],
  16: ['EVALUACION', 3],
  17: ['RESOLUCION', 4],
  18: ['RESOLUCION', 4],
  19: ['RESOLUCION', 4],
  20: ['RECEPCION', 1],
  21: ['RECEPCION', 1],
  22: [null, null],
  23: [null, null],
  24: [null, null],
  25: ['RESOLUCION', 4],
  26: [null, null],
  27: [null, null],
};

interface Scenario {
  key: string;
  protocolStatusId: number | null;
  receptionStatusId: number | null;
  withResolution: boolean;
  expected: [string, number];
}

const SCENARIOS: Scenario[] = [
  {
    key: 'NULL_COMPLETO',
    protocolStatusId: null,
    receptionStatusId: 10,
    withResolution: false,
    expected: ['ASIGNACION', 2],
  },
  {
    key: 'EN_EVALUACION',
    protocolStatusId: 13,
    receptionStatusId: 10,
    withResolution: false,
    expected: ['EVALUACION', 3],
  },
  {
    key: 'APROBADO_SIN_RES',
    protocolStatusId: 17,
    receptionStatusId: 10,
    withResolution: false,
    expected: ['RESOLUCION', 4],
  },
  {
    key: 'APROBADO_CON_RES',
    protocolStatusId: 17,
    receptionStatusId: 10,
    withResolution: true,
    expected: ['SEGUIMIENTO', 5],
  },
  {
    key: 'NULL_INICIADO',
    protocolStatusId: null,
    receptionStatusId: 9,
    withResolution: false,
    expected: ['RECEPCION', 1],
  },
  {
    key: 'NULL_SIN_RECEPCION',
    protocolStatusId: null,
    receptionStatusId: null,
    withResolution: false,
    expected: ['RECEPCION', 1],
  },
];

describe('Etapa del protocolo — RF-EST.1 / RF-EST.2 (ceish_test_db)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userId: number;
  const protocolIds: Record<string, number> = {};

  async function cleanup(ds: DataSource): Promise<void> {
    const ids = `SELECT id FROM public.protocolos WHERE titulo LIKE '${TITLE_PREFIX}%'`;
    await ds.query(
      `DELETE FROM resolucion.resoluciones WHERE protocolo_id IN (${ids})`,
    );
    await ds.query(
      `DELETE FROM recepcion.recepciones WHERE version_id IN (SELECT id FROM public.versiones_protocolo WHERE protocolo_id IN (${ids}))`,
    );
    await ds.query(
      `UPDATE public.protocolos SET version_actual_id = NULL WHERE titulo LIKE '${TITLE_PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM public.versiones_protocolo WHERE protocolo_id IN (${ids})`,
    );
    await ds.query(
      `DELETE FROM public.protocolos WHERE titulo LIKE '${TITLE_PREFIX}%'`,
    );
    await ds.query(
      `DELETE FROM catalogos.usuarios WHERE email_institucional LIKE '%${EMAIL_DOMAIN}'`,
    );
  }

  beforeAll(async () => {
    const dbName = process.env.DB_NAME ?? '';
    if (!dbName.endsWith('test') && !dbName.endsWith('test_db')) {
      throw new Error(`ABORT: BD no autorizada '${dbName}'. Solo bases *test.`);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: userId,
            email: `secretaria${EMAIL_DOMAIN}`,
            roles: ['SECRETARIA'],
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
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new GlobalValidationPipe());
    await app.init();
    dataSource = app.get(DataSource);

    const [{ current_database: active }] = await dataSource.query(
      'SELECT current_database()',
    );
    if (
      !String(active).endsWith('test_db') &&
      !String(active).endsWith('test')
    ) {
      throw new Error(`ABORT (NestApp): BD activa '${active}' no es de tests.`);
    }

    await cleanup(dataSource);

    const [user] = await dataSource.query(
      `INSERT INTO catalogos.usuarios (cedula, nombres_completos, email_institucional, activo, email_verificado)
       VALUES ('ZZ0000000001', 'ZZ_TEST_EST Investigador', 'investigador${EMAIL_DOMAIN}', true, true)
       RETURNING id`,
    );
    userId = user.id;

    for (const sc of SCENARIOS) {
      const [p] = await dataSource.query(
        `INSERT INTO public.protocolos (titulo, investigador_principal_id, estado_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [`${TITLE_PREFIX}${sc.key}`, userId, sc.protocolStatusId],
      );
      protocolIds[sc.key] = p.id;

      const [v] = await dataSource.query(
        `INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id)
         VALUES ($1, 1, $2) RETURNING id`,
        [p.id, sc.protocolStatusId],
      );
      await dataSource.query(
        `UPDATE public.protocolos SET version_actual_id = $1 WHERE id = $2`,
        [v.id, p.id],
      );
      if (sc.receptionStatusId !== null) {
        await dataSource.query(
          `INSERT INTO recepcion.recepciones (version_id, estado_id) VALUES ($1, $2)`,
          [v.id, sc.receptionStatusId],
        );
      }
      if (sc.withResolution) {
        await dataSource.query(
          `INSERT INTO resolucion.resoluciones (protocolo_id, version_id, tipo_resolucion_id)
           VALUES ($1, $2, 1)`,
          [p.id, v.id],
        );
      }
    }
  }, 60000);

  afterAll(async () => {
    if (dataSource?.isInitialized) await cleanup(dataSource);
    if (app) await app.close();
  }, 30000);

  it('el catálogo tiene la etapa y el orden esperados por id (E3)', async () => {
    const rows: Array<{
      id: number;
      etapa: string | null;
      orden: number | null;
    }> = await dataSource.query(
      'SELECT id, etapa, orden FROM catalogos.estados ORDER BY id',
    );
    const actual = Object.fromEntries(
      rows.map((r) => [
        r.id,
        [r.etapa, r.orden === null ? null : Number(r.orden)],
      ]),
    );
    expect(actual).toEqual(EXPECTED_CATALOG);
  });

  describe('GET /api/protocols', () => {
    let rows: any[];

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/protocols?investigatorId=${userId}&limit=50`)
        .set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
      rows = Array.isArray(res.body.data) ? res.body.data : res.body.data.data;
    });

    it.each(SCENARIOS.map((s) => [s.key, s.expected[0], s.expected[1]]))(
      '%s → etapa %s, etapaOrden %i',
      (key, etapa, orden) => {
        const row = rows.find((r) => r.id === protocolIds[key]);
        expect(row).toBeDefined();
        expect({ etapa: row.etapa, etapaOrden: row.etapaOrden }).toEqual({
          etapa,
          etapaOrden: orden,
        });
      },
    );
  });

  describe('GET /api/reception/protocols', () => {
    let rows: any[];

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reception/protocols')
        .set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
      rows = Array.isArray(res.body) ? res.body : res.body.data;
    });

    it.each(
      SCENARIOS.filter((s) => s.receptionStatusId !== null).map((s) => [
        s.key,
        s.expected[0],
        s.expected[1],
      ]),
    )('%s → etapa %s, etapaOrden %i', (key, etapa, orden) => {
      const row = rows.find((r) => r.id === protocolIds[key]);
      expect(row).toBeDefined();
      expect({ etapa: row.etapa, etapaOrden: row.etapaOrden }).toEqual({
        etapa,
        etapaOrden: orden,
      });
    });
  });
});
