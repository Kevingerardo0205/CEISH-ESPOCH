/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { AuthService } from './auth.service';
import { DataSource } from 'typeorm';

/**
 * TSK-001.1a — pruebas unitarias de buildActiveSessionData (HU-001 j)
 *
 * Verifica que roles vencidos, roles inactivos, roles eliminados y permisos
 * retirados no aparezcan en los datos de sesión devueltos por la función
 * privada. Se accede vía cast (as any) para probar la lógica sin levantar
 * la app completa.
 */
describe('AuthService.buildActiveSessionData (vigencia HU-001 j)', () => {
  let service: AuthService;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(() => {
    mockDataSource = { query: jest.fn() };

    service = new AuthService(
      null as any,
      null as any,
      null as any,
      null as any,
      mockDataSource as unknown as DataSource,
      null as any,
    );
  });

  it('devuelve roles y permisos cuando todo está vigente', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([
      {
        role_code: 'SECRETARIA',
        perm_code: 'USUARIOS_GESTIONAR',
        mod_code: 'MOD_USUARIOS',
        mod_name: 'Usuarios',
        mod_icon: null,
        mod_order: 1,
      },
    ]);

    const result = await (service as any).buildActiveSessionData(1);

    expect(result.roles).toEqual(['SECRETARIA']);
    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].code).toBe('USUARIOS_GESTIONAR');
  });

  it('devuelve vacío cuando el usuario no tiene roles vigentes', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([]);

    const result = await (service as any).buildActiveSessionData(99);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('no duplica permisos presentes en varios roles', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([
      {
        role_code: 'SECRETARIA',
        perm_code: 'DASHBOARD_RESUMEN',
        mod_code: 'MOD_DASHBOARD',
        mod_name: 'Dashboard',
        mod_icon: null,
        mod_order: 1,
      },
      {
        role_code: 'PRESIDENTE',
        perm_code: 'DASHBOARD_RESUMEN',
        mod_code: 'MOD_DASHBOARD',
        mod_name: 'Dashboard',
        mod_icon: null,
        mod_order: 1,
      },
    ]);

    const result = await (service as any).buildActiveSessionData(1);

    expect(result.roles).toContain('SECRETARIA');
    expect(result.roles).toContain('PRESIDENTE');
    expect(
      result.permissions.filter((p: any) => p.code === 'DASHBOARD_RESUMEN'),
    ).toHaveLength(1);
  });

  it('la consulta SQL filtra fecha_fin, activo y eliminado_en (verificación de llamada)', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([]);

    await (service as any).buildActiveSessionData(42);

    const sql: string = (mockDataSource.query as jest.Mock).mock.calls[0][0];
    expect(sql).toContain('r.activo = true');
    expect(sql).toContain('r.eliminado_en IS NULL');
    expect(sql).toContain('p.eliminado_en IS NULL');
    expect(sql).toContain('ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW()');
  });
});
