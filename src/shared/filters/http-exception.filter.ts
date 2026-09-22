import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OptimisticLockVersionMismatchError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: Record<string, unknown> = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = res as Record<string, unknown>;
      } else {
        message = { message: res };
      }
    } else if (exception instanceof OptimisticLockVersionMismatchError) {
      status = HttpStatus.CONFLICT;
      message = {
        message:
          'La versión de este protocolo ya ha sido creada o modificada por otra transacción concurrente.',
        error: 'Conflict',
        statusCode: HttpStatus.CONFLICT,
      };
    } else if (exception instanceof Error) {
      message = {
        message: exception.message || 'Internal server error',
      };
    }

    console.error('[HttpExceptionFilter] Error:', exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
