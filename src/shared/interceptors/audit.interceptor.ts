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

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip;
    const paramsId = request.params?.id ? parseInt(request.params.id, 10) : NaN;
    // TSK-001.9 (RF-02.6 a): en producción este interceptor envuelve a ResponseInterceptor
    // (main.ts:39) y recibe { data, statusCode, message }. El id de la respuesta envuelta solo se
    // usa si la ruta no tiene parámetros (con :protocolId, :documentId… sería otra entidad) y si es
    // entero (registro_id es INT: un uuid haría fallar el INSERT y se perdería la fila).
    const routeParams =
      (request as { params?: Record<string, string> }).params ?? {};
    const routeHasParams = Object.keys(routeParams).length > 0;
    const wrappedId = (data: unknown): number | undefined => {
      const id = (data as { data?: { id?: unknown } } | null)?.data?.id;
      return !routeHasParams && Number.isInteger(id)
        ? (id as number)
        : undefined;
    };

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.auditService.createLog({
            userId: user?.id,
            action,
            ipAddress,
            newData:
              request.method !== 'GET'
                ? request.auditDetails || request.body
                : null,
            recordId:
              data?.id || (!isNaN(paramsId) ? paramsId : wrappedId(data)),
            // Podríamos inferir la tabla o código de protocolo si es necesario
          });
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }),
    );
  }
}
