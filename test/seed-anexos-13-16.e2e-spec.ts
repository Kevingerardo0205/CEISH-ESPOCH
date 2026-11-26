/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

/**
 * TSK-015-N14 — spec-003 RF-17.2 (v1.6.5): anexos de la carta firmada ANEXO_13 a ANEXO_16.
 * - Migración 2000000000003: cuatro filas en catalogos.tipos_documento, una vez cada una, sin
 *   relación con tipos de estudio.
 * - Checklist del investigador (RequirementsService.calcularRequeridos) para IO, EI y EC: no
 *   devuelve ANEXO_13..16 con ningún conjunto de flags.
 * - up dos veces y down: se prueban dentro de una transacción que se revierte; no dejan datos.
 * Solo lectura sobre ceish_test_db, salvo la transacción revertida. Requiere la migración aplicada.
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

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { IEmailServicePort } from '../src/modules/notifications/domain/ports/email.service.port';
import { IStorageService } from '../src/shared/storage/domain/ports/storage.service.port';
import { RequirementsService } from '../src/modules/protocols/application/services/requirements.service';
import { SeedTiposDocumentoAnexos13a162000000000003 } from '../src/migrations/2000000000003-SeedTiposDocumentoAnexos13a16';

const CODIGOS = ['ANEXO_13', 'ANEXO_14', 'ANEXO_15', 'ANEXO_16'];
const NOMBRES: Record<string, string> = {
  ANEXO_13:
    'Carta de aprobación definitiva – estudios observacionales/de intervención',
  ANEXO_14: 'Carta de aprobación definitiva – ensayo clínico',
  ANEXO_15: 'Respuesta de estudio aprobado con condición',
  ANEXO_16: 'Respuesta de estudio no aprobado',
};
const TIPOS_ESTUDIO = ['IO', 'EI', 'EC'];
const FLAGS_TODOS = {
  muestras: true,
  vulnerable: true,
  multicentrico: true,
  riesgoMayor: true,
  institucionesPublicas: true,
  poblacionIndigena: true,
  tesis: true,
};
const FLAGS_NINGUNO = {};

describe('TSK-015-N14 — anexos 13 a 16 de la carta firmada (ceish_test_db)', () => {
  let app: INestApplication;
  let ds: DataSource;
  let requirements: RequirementsService;

  beforeAll(async () => {
    const dbName = process.env.DB_NAME || '';
    if (!dbName.includes('test')) {
      throw new Error(`ABORT: solo ceish_test_db. DB recibida: '${dbName}'`);
    }

    const fix: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IEmailServicePort)
      .useValue({})
      .overrideProvider(IStorageService)
      .useValue({})
      .compile();

    app = fix.createNestApplication();
    await app.init();
    ds = app.get(DataSource);
    requirements = app.get(RequirementsService);

    const [{ current_database: active }] = await ds.query(
      'SELECT current_database()',
    );
    if (!String(active).includes('test')) {
      throw new Error(`ABORT: DataSource conectado a '${active}'.`);
    }

    const [{ count }] = await ds.query(
      `SELECT count(*)::int AS count FROM public.migrations WHERE name ILIKE '%SeedTiposDocumentoAnexos13a16%'`,
    );
    if (count !== 1) {
      throw new Error(
        'ABORT: falta la migración 2000000000003-SeedTiposDocumentoAnexos13a16 en ceish_test_db.',
      );
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('existe una sola fila por cada código, con el nombre oficial y sin relaciones', async () => {
    const filas: Array<{
      codigo_anexo: string;
      nombre: string;
      eliminado_en: Date | null;
      es_obligatorio: boolean;
      es_condicional: boolean;
      codigo_plantilla: string | null;
      tipo_estudio_aplica: unknown;
      condicion_json: unknown;
    }> = await ds.query(
      `SELECT codigo_anexo, nombre, eliminado_en, es_obligatorio, es_condicional,
              codigo_plantilla, tipo_estudio_aplica, condicion_json
         FROM catalogos.tipos_documento
        WHERE codigo_anexo = ANY($1)
        ORDER BY codigo_anexo`,
      [CODIGOS],
    );

    expect(filas.map((f) => f.codigo_anexo)).toEqual(CODIGOS);
    for (const fila of filas) {
      expect(fila.nombre).toBe(NOMBRES[fila.codigo_anexo]);
      expect(fila.eliminado_en).toBeNull();
      expect(fila.es_obligatorio).toBe(false);
      expect(fila.es_condicional).toBe(false);
      expect(fila.codigo_plantilla).toBeNull();
      expect(fila.tipo_estudio_aplica).toBeNull();
      expect(fila.condicion_json).toBeNull();
    }

    const [{ count }] = await ds.query(
      `SELECT count(*)::int AS count
         FROM catalogos.tipo_documento_estudio tde
         JOIN catalogos.tipos_documento td ON td.id = tde.tipo_documento_id
        WHERE td.codigo_anexo = ANY($1)`,
      [CODIGOS],
    );
    expect(count).toBe(0);
  });

  it.each(TIPOS_ESTUDIO)(
    'el checklist de %s no incluye ANEXO_13..16 (con ningún flag ni con todos)',
    async (tipo) => {
      for (const flags of [FLAGS_NINGUNO, FLAGS_TODOS]) {
        const lista = await requirements.calcularRequeridos(
          tipo as Parameters<RequirementsService['calcularRequeridos']>[0],
          flags,
        );
        const codigos = lista.map((r) => r.code);
        for (const codigo of CODIGOS) {
          expect(codigos).not.toContain(codigo);
        }
      }
    },
  );

  it('up es idempotente y down deja cero residuos (transacción revertida)', async () => {
    const qr = ds.createQueryRunner();
    await qr.connect();
    const migracion = new SeedTiposDocumentoAnexos13a162000000000003();
    await qr.startTransaction();
    try {
      await migracion.up(qr);
      await migracion.up(qr);
      const tras2Up: Array<{ codigo_anexo: string; n: number }> =
        await qr.query(
          `SELECT codigo_anexo, count(*)::int AS n
             FROM catalogos.tipos_documento
            WHERE codigo_anexo = ANY($1)
            GROUP BY codigo_anexo ORDER BY codigo_anexo`,
          [CODIGOS],
        );
      expect(tras2Up).toEqual(CODIGOS.map((c) => ({ codigo_anexo: c, n: 1 })));

      await migracion.down(qr);
      const [{ residuos }] = await qr.query(
        `SELECT count(*)::int AS residuos FROM catalogos.tipos_documento
          WHERE codigo_anexo = ANY($1)`,
        [CODIGOS],
      );
      expect(residuos).toBe(0);
    } finally {
      await qr.rollbackTransaction();
      await qr.release();
    }
  });
});
