/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { of } from 'rxjs';
import { StreamableFile } from '@nestjs/common';
import { ResponseInterceptor } from './response.interceptor';
import type { ExecutionContext, CallHandler } from '@nestjs/common';

function makeContext(statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  it('envuelve un objeto plano con {data, statusCode, message}', (done) => {
    const ctx = makeContext(200);
    const payload = { id: 1, name: 'test' };

    interceptor
      .intercept(ctx, makeHandler(payload))
      .subscribe((result: any) => {
        expect(result.data).toEqual(payload);
        expect(result.statusCode).toBe(200);
        expect(result.message).toBe('Success');
        done();
      });
  });

  it('envuelve un array', (done) => {
    const ctx = makeContext(200);
    const payload = [1, 2, 3];

    interceptor
      .intercept(ctx, makeHandler(payload))
      .subscribe((result: any) => {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.statusCode).toBe(200);
        done();
      });
  });

  it('envuelve null', (done) => {
    const ctx = makeContext(200);

    interceptor.intercept(ctx, makeHandler(null)).subscribe((result: any) => {
      expect(result.data).toBeNull();
      expect(result.statusCode).toBe(200);
      done();
    });
  });

  it('envuelve undefined', (done) => {
    const ctx = makeContext(200);

    interceptor
      .intercept(ctx, makeHandler(undefined))
      .subscribe((result: any) => {
        expect(result.data).toBeUndefined();
        expect(result.statusCode).toBe(200);
        done();
      });
  });

  it('devuelve la misma instancia de StreamableFile sin envolver', (done) => {
    const ctx = makeContext(200);
    const file = new StreamableFile(Buffer.from('%PDF-1.4 test'));

    interceptor.intercept(ctx, makeHandler(file)).subscribe((result: any) => {
      expect(result).toBe(file);
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('message');
      done();
    });
  });

  it('usa el statusCode real de la respuesta HTTP (201)', (done) => {
    const ctx = makeContext(201);
    const payload = { created: true };

    interceptor
      .intercept(ctx, makeHandler(payload))
      .subscribe((result: any) => {
        expect(result.statusCode).toBe(201);
        done();
      });
  });
});
