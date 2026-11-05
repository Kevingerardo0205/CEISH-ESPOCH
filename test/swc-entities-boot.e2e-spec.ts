/**
 * Regresión del arranque compilado con SWC (fix/swc-entidades-circulares).
 *
 * `nest build` y `nest start --watch` compilan con SWC (`nest-cli.json` → builder "swc"), que
 * emite `design:type` con la clase de cada propiedad. Si una relación entre entidades que se
 * importan en ciclo no va envuelta en `Relation<>`, el `require` de una entidad lee la clase de
 * la otra antes de que exista y el arranque falla con
 * `ReferenceError: Cannot access 'ProtocolOrmEntity' before initialization`.
 * ts-jest no reproduce el fallo, por eso esta prueba compila `src/` con las mismas opciones de
 * SWC que usa `nest build` y carga cada entidad (`*.entity.orm.js` y `*.orm-entity.js`) como
 * primer módulo de un proceso nuevo (todos los órdenes de carga posibles de los ciclos).
 *
 * No usa la base de datos ni `.env`: el proceso hijo recibe solo PATH y NODE_PATH.
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { transformFileSync, type Options } from '@swc/core';
import type { Configuration } from '@nestjs/cli/lib/configuration';
import { swcDefaultsFactory } from '@nestjs/cli/lib/compiler/defaults/swc-defaults';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
// Las dos convenciones de nombre de entidades del repo (TSK-015-N07).
const ENTITY_SUFFIXES = ['.entity.orm.ts', '.orm-entity.ts'];
// spawnSync bloquea el hilo y el timeout de Jest no lo corta: cada carga tiene su propio límite.
const LOAD_TIMEOUT_MS = 60_000;

interface LoadFailure {
  entity: string;
  output: string;
}

function listSourceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((rel) => rel.endsWith('.ts') && !rel.endsWith('.spec.ts'))
    .map((rel) => path.join(dir, rel));
}

function swcOptionsLikeNestBuild(): Options {
  const nestCli = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, 'nest-cli.json'), 'utf8'),
  ) as Configuration;
  const { swcOptions } = swcDefaultsFactory(
    { baseUrl: PROJECT_ROOT, sourceMap: false },
    nestCli,
  );
  return { ...(swcOptions as Options), sourceMaps: false };
}

describe('Arranque compilado con SWC: entidades sin ReferenceError por ciclos de import', () => {
  let outDir: string;
  let loader: string;
  let entities: string[] = [];

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ceish-swc-boot-'));
    // Script de entrada (no `node -e`): typeorm usa app-root-path, que necesita require.main.
    loader = path.join(outDir, 'load-entity.js');
    fs.writeFileSync(
      loader,
      "require('reflect-metadata');\nrequire(process.argv[2]);\n",
    );
    const options = swcOptionsLikeNestBuild();
    for (const file of listSourceFiles(SRC_DIR)) {
      const rel = path.relative(SRC_DIR, file);
      const target = path.join(outDir, rel.replace(/\.ts$/, '.js'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, transformFileSync(file, options).code);
      if (ENTITY_SUFFIXES.some((suffix) => rel.endsWith(suffix))) {
        entities.push(target);
      }
    }
    entities = entities.sort();
  }, 120_000);

  afterAll(() => {
    if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('compila todas las entidades ORM (*.entity.orm.ts y *.orm-entity.ts)', () => {
    expect(entities.length).toBeGreaterThanOrEqual(30);
    const ormEntity = entities.filter((e) => e.endsWith('.orm-entity.js'));
    expect(ormEntity.length).toBeGreaterThanOrEqual(6);
  });

  it('cada entidad se carga como primer módulo sin ReferenceError ni otro error', () => {
    const failures: LoadFailure[] = [];
    for (const entity of entities) {
      const run = spawnSync(process.execPath, [loader, entity], {
        cwd: outDir,
        encoding: 'utf8',
        timeout: LOAD_TIMEOUT_MS,
        env: {
          PATH: process.env.PATH ?? '',
          SystemRoot: process.env.SystemRoot ?? '',
          NODE_PATH: path.join(PROJECT_ROOT, 'node_modules'),
        },
      });
      const output = [run.error?.message, run.stdout, run.stderr]
        .filter(Boolean)
        .join('\n')
        .trim();
      if (run.status !== 0 || output.length > 0) {
        failures.push({
          entity: path.relative(outDir, entity),
          // Ubicación (primera línea) y el error (p. ej. «ReferenceError: Cannot access …»).
          output: [
            output.split('\n')[0],
            output.split('\n').find((line) => /\w*Error\b/.test(line)) ?? '',
          ].join('\n'),
        });
      }
    }
    expect(failures).toEqual([]);
  }, 180_000);
});
