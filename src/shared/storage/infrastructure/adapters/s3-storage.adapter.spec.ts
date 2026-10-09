import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3-storage.adapter';

function makeConfig(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key in values) {
        const val = values[key];
        if (val === undefined)
          throw new Error(`Configuration key "${key}" does not exist`);
        return val;
      }
      return 'test-default';
    },
    get: (key: string, fallback?: string) => values[key] ?? fallback ?? 'test-default',
  } as unknown as ConfigService;
}

const GOOD = {
  S3_ACCESS_KEY_ID: 'test-access-key',
  S3_SECRET_ACCESS_KEY: 'test-secret-key',
};

describe('S3StorageAdapter — credential guard', () => {
  it('throws at construction when S3_ACCESS_KEY_ID is absent', () => {
    expect(
      () => new S3StorageAdapter(makeConfig({ ...GOOD, S3_ACCESS_KEY_ID: undefined })),
    ).toThrow(/S3_ACCESS_KEY_ID/);
  });

  it('throws at construction when S3_SECRET_ACCESS_KEY is absent', () => {
    expect(
      () => new S3StorageAdapter(makeConfig({ ...GOOD, S3_SECRET_ACCESS_KEY: undefined })),
    ).toThrow(/S3_SECRET_ACCESS_KEY/);
  });

  it('constructs successfully when both credentials are provided', () => {
    expect(() => new S3StorageAdapter(makeConfig(GOOD))).not.toThrow();
  });
});
