import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';

let encryptionService: EncryptionService;
export const setEncryptionService = (service: EncryptionService) => {
  encryptionService = service;
};

export const EncryptionTransformer: ValueTransformer = {
  to: (value: string | null) => {
    if (value == null || !encryptionService) return value;
    return encryptionService.encrypt(value);
  },
  from: (value: string | null) => {
    if (value == null || !encryptionService) return value;
    return encryptionService.decrypt(value);
  },
};
