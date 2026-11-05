import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.4 (spec-001 v3.5.6, RF-EST.3 y HU-001 c): permiso PROTOCOLOS_LISTAR para
 * GET /api/protocols, asignado a SECRETARIA y PRESIDENTE.
 *
 * Sigue el patrón de FixedRolesMatrix1880000000000: inserción por códigos, idempotente.
 * Matriz resultante: SECRETARIA 36, PRESIDENTE 22, EVALUADOR 9, INVESTIGADOR 8 (75 filas).
 *
 * down() borra solo las 2 filas de rol_permisos de este permiso y el permiso.
 */
export class AddProtocolosListarPermission1900000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO catalogos.permisos (codigo, nombre, modulo_id)
      SELECT 'PROTOCOLOS_LISTAR', 'Listar protocolos', m.id
      FROM catalogos.modulos m
      WHERE m.codigo = 'MOD_RECEPCION'
        AND NOT EXISTS (
          SELECT 1 FROM catalogos.permisos WHERE codigo = 'PROTOCOLOS_LISTAR'
        )
    `);

    const inserted = (await queryRunner.query(
      `SELECT id FROM catalogos.permisos WHERE codigo = 'PROTOCOLOS_LISTAR' AND eliminado_en IS NULL`,
    )) as Array<{ id: number }>;
    if (inserted.length !== 1) {
      throw new Error(
        '[TSK-001.4] ABORT: no se pudo crear PROTOCOLOS_LISTAR (¿falta el módulo MOD_RECEPCION?).',
      );
    }

    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM catalogos.roles r
      JOIN catalogos.permisos p ON p.codigo = 'PROTOCOLOS_LISTAR'
      WHERE r.codigo IN ('SECRETARIA', 'PRESIDENTE')
      ON CONFLICT (rol_id, permiso_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM catalogos.rol_permisos
      WHERE permiso_id IN (
        SELECT id FROM catalogos.permisos WHERE codigo = 'PROTOCOLOS_LISTAR'
      )
    `);
    await queryRunner.query(`
      DELETE FROM catalogos.permisos WHERE codigo = 'PROTOCOLOS_LISTAR'
    `);
  }
}
