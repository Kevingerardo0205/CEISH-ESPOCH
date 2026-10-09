import { registerAs } from '@nestjs/config';
import { requireEnv } from '../shared/utils/require-env';

export default registerAs('app', () => ({
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  encryptionKey: requireEnv('ENCRYPTION_KEY'),
}));
