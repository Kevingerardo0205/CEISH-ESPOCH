import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

// Valid 32-byte key in base64 (44-char string, test-only value)
const TEST_KEY_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

function makeConfig(key: string | undefined): ConfigService {
  return {
    getOrThrow: (path: string) => {
      if (path === 'app.encryptionKey') {
        if (key === undefined) throw new Error(`Config key "${path}" not found`);
        return key;
      }
      throw new Error(`Config key "${path}" not found`);
    },
  } as unknown as ConfigService;
}

describe('EncryptionService', () => {
  it('throws at construction when ENCRYPTION_KEY is absent', () => {
    expect(() => new EncryptionService(makeConfig(undefined))).toThrow();
  });

  it('throws when ENCRYPTION_KEY decodes to != 32 bytes', () => {
    expect(
      () => new EncryptionService(makeConfig('dG9vc2hvcnQ=')), // "tooshort" = 7 bytes
    ).toThrow(/32 bytes/);
  });

  it('constructs successfully with a valid 32-byte key', () => {
    expect(() => new EncryptionService(makeConfig(TEST_KEY_B64))).not.toThrow();
  });

  it('round-trips encrypt/decrypt correctly', () => {
    const svc = new EncryptionService(makeConfig(TEST_KEY_B64));
    const original = 'dato sensible de prueba';
    const encrypted = svc.encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(svc.decrypt(encrypted)).toBe(original);
  });

  it('returns null when encrypting null', () => {
    const svc = new EncryptionService(makeConfig(TEST_KEY_B64));
    expect(svc.encrypt(null)).toBeNull();
  });

  it('returns null when decrypting null', () => {
    const svc = new EncryptionService(makeConfig(TEST_KEY_B64));
    expect(svc.decrypt(null)).toBeNull();
  });
});
