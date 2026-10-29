import { Permission } from './permission.enum';

describe('Permission enum (TSK-001.1a)', () => {
  describe('alias values', () => {
    it('USUARIOS_GESTIONAR tiene su propio código', () => {
      expect(Permission.USUARIOS_GESTIONAR).toBe('USUARIOS_GESTIONAR');
    });

    it('ROLES_ASSIGN apunta a USUARIOS_GESTIONAR', () => {
      expect(Permission.ROLES_ASSIGN).toBe('USUARIOS_GESTIONAR');
    });

    it('USERS_CREATE apunta a USUARIOS_GESTIONAR', () => {
      expect(Permission.USERS_CREATE).toBe('USUARIOS_GESTIONAR');
    });

    it('USERS_EDIT apunta a USUARIOS_GESTIONAR', () => {
      expect(Permission.USERS_EDIT).toBe('USUARIOS_GESTIONAR');
    });

    it('USERS_STATUS_TOGGLE apunta a USUARIOS_GESTIONAR', () => {
      expect(Permission.USERS_STATUS_TOGGLE).toBe('USUARIOS_GESTIONAR');
    });

    it('PERMISSIONS_MANAGE apunta a EVALUADORES_PERFILES', () => {
      expect(Permission.PERMISSIONS_MANAGE).toBe('EVALUADORES_PERFILES');
    });

    it('EVALUATORS_WORKLOAD_VIEW apunta a REPORTES_CARGA', () => {
      expect(Permission.EVALUATORS_WORKLOAD_VIEW).toBe('REPORTES_CARGA');
    });

    it('USERS_VIEW sigue en USUARIOS_VER', () => {
      expect(Permission.USERS_VIEW).toBe('USUARIOS_VER');
    });

    it('PERMISOS_GESTIONAR sigue con su propio código (se elimina en 1c)', () => {
      expect(Permission.PERMISOS_GESTIONAR).toBe('PERMISOS_GESTIONAR');
    });
  });
});
