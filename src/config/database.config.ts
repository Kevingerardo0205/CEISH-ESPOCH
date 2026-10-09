import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { requireEnv } from '../shared/utils/require-env';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: requireEnv('DB_USERNAME'),
  password: requireEnv('DB_PASSWORD'),
  database: process.env.DB_NAME || 'ceish_db',
  autoLoadEntities: true,
  synchronize: false,
  logging: process.env.DB_LOG_QUERIES === 'true' ? true : ['error'],
}));
