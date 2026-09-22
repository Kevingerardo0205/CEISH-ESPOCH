import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('PermissionsGuard (Phase 3 - Cache & Temporal Rules)', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no permissions are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: 1 });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should query DB and cache active permissions on first call', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ROLES_ASSIGN']);
    (dataSource.query as jest.Mock).mockResolvedValue([
      { code: 'ROLES_ASSIGN' },
    ]);

    const context = createMockContext({ id: 999 });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(dataSource.query).toHaveBeenCalledTimes(1);

    // Second call should hit the cache without calling DB again
    const resultCached = await guard.canActivate(context);
    expect(resultCached).toBe(true);
    expect(dataSource.query).toHaveBeenCalledTimes(1);
  });

  it('should throw ForbiddenException if user lacks required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['SYSTEM_AUDIT']);
    (dataSource.query as jest.Mock).mockResolvedValue([
      { code: 'ROLES_ASSIGN' },
    ]);

    const context = createMockContext({ id: 888 });
    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
