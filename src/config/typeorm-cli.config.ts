// src/config/typeorm-cli.config.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde la raíz del proyecto
config({ path: path.resolve(process.cwd(), '.env') });

// Guard: require explicit opt-in via MIGRATION_CONFIRM_DB=<DB_NAME> before running
// any migration.  A name-pattern check (e.g. "must contain test") silently passes
// staging/prod databases whose names happen to match; an explicit variable is harder
// to set by mistake and works regardless of naming conventions.
const dbName = process.env.DB_NAME ?? '';
const confirmDb = process.env.MIGRATION_CONFIRM_DB;
if (!confirmDb) {
  throw new Error(
    '[typeorm-cli] ABORT: La variable MIGRATION_CONFIRM_DB no está definida. ' +
      `Para confirmar la migración sobre '${dbName}', ejecute: ` +
      `MIGRATION_CONFIRM_DB=${dbName} npx typeorm migration:run`,
  );
}
if (confirmDb !== dbName) {
  throw new Error(
    `[typeorm-cli] ABORT: MIGRATION_CONFIRM_DB='${confirmDb}' no coincide con DB_NAME='${dbName}'. ` +
      'Corrija la variable antes de continuar.',
  );
}


export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // ⚠️ Para CLI: rutas relativas al CWD o imports explícitos
  entities: [
    'src/modules/**/infrastructure/database/**/*.entity.orm.ts',
    'src/modules/**/infrastructure/database/**/*.orm-entity.ts',
    'src/modules/**/infrastructure/database/*.entity.orm.ts',
    'src/modules/**/domain/entities/*.entity.ts',
  ],

  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',

  // ⚠️ IMPORTANTE: synchronize debe ser FALSE para migraciones
  synchronize: false,
  logging: ['query', 'error'],
});
