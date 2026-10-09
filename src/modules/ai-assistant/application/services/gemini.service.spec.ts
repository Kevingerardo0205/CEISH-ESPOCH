import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { GeminiService } from './gemini.service';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('GeminiService', () => {
  it('constructs without throwing when GEMINI_API_KEY is absent', () => {
    expect(() => new GeminiService(makeConfig({}))).not.toThrow();
  });

  it('constructs without throwing when GEMINI_API_KEY is empty string', () => {
    expect(
      () => new GeminiService(makeConfig({ GEMINI_API_KEY: '' })),
    ).not.toThrow();
  });

  it('rejects with SERVICE_UNAVAILABLE when generateResponse is called without key', async () => {
    const service = new GeminiService(makeConfig({}));
    await expect(
      service.generateResponse('hola', '', '', []),
    ).rejects.toMatchObject({ status: HttpStatus.SERVICE_UNAVAILABLE });
  });

  it('constructs successfully with a valid key', () => {
    expect(
      () => new GeminiService(makeConfig({ GEMINI_API_KEY: 'test-gemini-key' })),
    ).not.toThrow();
  });
});
