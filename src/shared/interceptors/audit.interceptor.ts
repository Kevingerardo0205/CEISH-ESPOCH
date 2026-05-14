import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditService } from '../../modules/audit/application/services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip;

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.auditService.createLog({
            userId: user?.id,
            action,
            ipAddress,
            newData: request.method !== 'GET' ? request.body : null,
            recordId: data?.id,
            // Podríamos inferir la tabla o código de protocolo si es necesario
          });
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }),
    );
  }
}
