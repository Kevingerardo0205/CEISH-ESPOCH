/**
 * throttle-exception.filter.ts
 * Filtro de excepciones para las respuestas 429 generadas por @nestjs/throttler.
 *
 * Complementa al DosDefenseMiddleware (Sliding Window propio) añadiendo
 * headers RFC 6585 a las excepciones lanzadas por @Throttle() decorators
 * en los controladores (ej: auth.controller.ts).
 *
 * Normativa cubierta:
 *  - RFC 6585 — Headers HTTP para rate limiting
 *  - ISO/IEC 27002:2022 — 8.16 (Monitoreo de actividades)
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottleExceptionFilter.name);

  catch(exception: ThrottlerException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.TOO_MANY_REQUESTS;

    // Extraer IP real (soporta proxies y Docker)
    const forwarded = request.headers['x-forwarded-for'];
    const clientIp = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded)
          .split(',')[0]
          .trim()
      : (request.ip ?? 'unknown');

    this.logger.warn(
      `⚠️  ThrottlerGuard (burst/medium) — IP: ${clientIp} | ` +
        `${request.method} ${request.path}`,
    );

    // Headers RFC 6585 — Retry-After y X-RateLimit-*
    const retryAfterSeconds = 60;
    response.setHeader('Retry-After', retryAfterSeconds);
    response.setHeader('X-RateLimit-Limit', 'exceeded');
    response.setHeader('X-RateLimit-Remaining', 0);
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + retryAfterSeconds * 1000).toISOString(),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      error: {
        codigo: 'THROTTLE_EXCEDIDO',
        mensaje: 'Demasiadas solicitudes en un período muy corto de tiempo.',
        reintentar: `En ${retryAfterSeconds} segundos`,
      },
    });
  }
}
