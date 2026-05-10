// src/config/typeorm-cli.config.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde la raíz del proyecto
config({ path: path.resolve(process.cwd(), '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // ⚠️ Para CLI: rutas relativas al CWD o imports explícitos
  entities: [
    'src/modules/**/infrastructure/database/*.entity.orm.ts',
    'src/modules/**/domain/entities/*.entity.ts',
  ],

  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',

  // ⚠️ IMPORTANTE: synchronize debe ser FALSE para migraciones
  synchronize: false,
  logging: ['query', 'error'],
});
