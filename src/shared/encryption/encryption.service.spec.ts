import 'reflect-metadata';
import { EncryptionService } from './encryption.service';

// Valid 32-byte key in base64 (44-char string, test-only value)
const TEST_KEY_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

describe('EncryptionService', () => {
  const ORIGINAL = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL };
  });

  afterEach(() => {
    process.env = ORIGINAL;
  });

  it('throws at construction when ENCRYPTION_KEY is absent', () => {
    delete process.env['ENCRYPTION_KEY'];
    expect(() => new EncryptionService()).toThrow(/ENCRYPTION_KEY/);
  });

  it('throws at construction when ENCRYPTION_KEY is empty', () => {
    process.env['ENCRYPTION_KEY'] = '';
    expect(() => new EncryptionService()).toThrow(/ENCRYPTION_KEY/);
  });

  it('throws when ENCRYPTION_KEY decodes to != 32 bytes', () => {
    process.env['ENCRYPTION_KEY'] = 'dG9vc2hvcnQ='; // "tooshort" decoded = 7 bytes
    expect(() => new EncryptionService()).toThrow(/32 bytes/);
  });

  it('constructs successfully with a valid 32-byte key', () => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY_B64;
    expect(() => new EncryptionService()).not.toThrow();
  });

  it('round-trips encrypt/decrypt correctly', () => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY_B64;
    const svc = new EncryptionService();
    const original = 'dato sensible de prueba';
    const encrypted = svc.encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(svc.decrypt(encrypted)).toBe(original);
  });

  it('returns null when encrypting null', () => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY_B64;
    const svc = new EncryptionService();
    expect(svc.encrypt(null)).toBeNull();
  });

  it('returns null when decrypting null', () => {
    process.env['ENCRYPTION_KEY'] = TEST_KEY_B64;
    const svc = new EncryptionService();
    expect(svc.decrypt(null)).toBeNull();
  });
});
