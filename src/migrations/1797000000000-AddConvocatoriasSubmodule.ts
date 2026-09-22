import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConvocatoriasSubmodule1797000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear el nuevo submódulo bajo el Módulo 11 (MOD_RESOLUCION)
    await queryRunner.query(`
      INSERT INTO catalogos.permisos (nombre, codigo, modulo_id)
      VALUES (
        'Gestión de Convocatorias y Actas', 
        'RESOLUCION_CONVOCATORIAS', 
        (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_RESOLUCION')
      );
    `);

    // 2. Asignar los permisos a los roles SECRETARIA y ADMIN_TI
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM catalogos.roles r, catalogos.permisos p
      WHERE p.codigo = 'RESOLUCION_CONVOCATORIAS'
        AND r.codigo IN ('SECRETARIA', 'ADMIN_TI');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM catalogos.rol_permisos 
      WHERE permiso_id = (SELECT id FROM catalogos.permisos WHERE codigo = 'RESOLUCION_CONVOCATORIAS');
    `);

    await queryRunner.query(`
      DELETE FROM catalogos.permisos WHERE codigo = 'RESOLUCION_CONVOCATORIAS';
    `);
  }
}
