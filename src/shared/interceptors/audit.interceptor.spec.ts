import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../../modules/audit/application/services/audit.service';

describe('AuditInterceptor — registro_id (spec-001 RF-02.6 a, TSK-001.9)', () => {
  let createLog: jest.Mock;
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    createLog = jest.fn().mockResolvedValue(undefined);
    const reflector = { get: jest.fn().mockReturnValue('ACCION_PRUEBA') };
    interceptor = new AuditInterceptor(
      reflector as unknown as Reflector,
      { createLog } as unknown as AuditService,
    );
  });

  async function recordIdFor(
    params: Record<string, string>,
    response: unknown,
  ): Promise<unknown> {
    const request = {
      user: { id: 7 },
      ip: '127.0.0.1',
      method: 'POST',
      params,
      body: {},
    };
    const context = {
      getHandler: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(response) };
    await lastValueFrom(interceptor.intercept(context, next));
    await new Promise((r) => setImmediate(r));
    expect(createLog).toHaveBeenCalledTimes(1);
    return (createLog.mock.calls[0] as [{ recordId?: unknown }])[0].recordId;
  }

  async function newDataFor(
    body: unknown,
    auditDetails?: unknown,
  ): Promise<unknown> {
    const request = {
      user: { id: 7 },
      ip: '127.0.0.1',
      method: 'POST',
      params: {},
      body,
      auditDetails,
    };
    const context = {
      getHandler: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of({ data: { id: 1 } }) };
    await lastValueFrom(interceptor.intercept(context, next));
    await new Promise((r) => setImmediate(r));
    expect(createLog).toHaveBeenCalledTimes(1);
    return (createLog.mock.calls[0] as [{ newData?: unknown }])[0].newData;
  }

  describe('datos_nuevos sin secretos (RF-AUD.1 a, TSK-001.15)', () => {
    it('sanea el cuerpo de la petición en cualquier nivel', async () => {
      expect(
        await newDataFor({
          email: 'persona@example.test',
          password: 'valor-ficticio',
          nested: { refresh_token: 'valor-ficticio', keep: 1 },
        }),
      ).toEqual({ email: 'persona@example.test', nested: { keep: 1 } });
    });

    it('sanea también request.auditDetails cuando el handler lo deja', async () => {
      expect(
        await newDataFor(
          { ignored: true },
          { title: 'Estudio', items: [{ token: 'valor-ficticio', a: 1 }] },
        ),
      ).toEqual({ title: 'Estudio', items: [{ a: 1 }] });
    });
  });

  it('id en data.id (respuesta sin envolver)', async () => {
    expect(await recordIdFor({}, { id: 41 })).toBe(41);
  });

  it('id en data.data.id (respuesta envuelta por ResponseInterceptor) sin parámetros de ruta', async () => {
    expect(
      await recordIdFor(
        {},
        { data: { id: 42 }, statusCode: 201, message: 'Success' },
      ),
    ).toBe(42);
  });

  it('con :id en la ruta usa el :id aunque la respuesta envuelta traiga otro id', async () => {
    expect(await recordIdFor({ id: '5' }, { data: { id: 99 } })).toBe(5);
  });

  it('con otro parámetro de ruta (:protocolId) no toma el id de la respuesta envuelta', async () => {
    expect(
      await recordIdFor({ protocolId: '5' }, { data: { id: 99 } }),
    ).toBeUndefined();
  });

  it('un id de respuesta que no es entero (uuid) no se usa: registro_id es INT', async () => {
    expect(
      await recordIdFor(
        {},
        { data: { id: '0b0e7c1e-0000-4000-8000-000000000000' } },
      ),
    ).toBeUndefined();
  });
});
