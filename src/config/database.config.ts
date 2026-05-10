import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'ceish_user',
    password: process.env.DB_PASSWORD || 'ceish_password',
    database: process.env.DB_NAME || 'ceish_db',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production', // ¡Cuidado en prod!
    logging: process.env.NODE_ENV !== 'production',
  }),
);
