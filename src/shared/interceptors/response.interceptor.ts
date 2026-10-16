import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  statusCode: number;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // StreamableFile (descarga de archivos) se devuelve tal cual para que
        // NestJS lo envíe como stream binario, no como JSON envuelto.
        if (data instanceof StreamableFile)
          return data as unknown as Response<T>;
        const res = context
          .switchToHttp()
          .getResponse<{ statusCode: number }>();
        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data,
          statusCode: res.statusCode,
          message: 'Success',
        };
      }),
    );
  }
}
