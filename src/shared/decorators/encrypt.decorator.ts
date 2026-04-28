import { SetMetadata } from '@nestjs/common';

export const ENCRYPT_KEY = 'encrypt';
export const Encrypt = () => SetMetadata(ENCRYPT_KEY, true);
