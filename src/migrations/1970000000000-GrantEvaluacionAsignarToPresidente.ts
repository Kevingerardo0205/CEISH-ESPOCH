import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-002-N51 (spec-002 v1.3.1, RF-12.1): el rol PRESIDENTE recibe EVALUACION_ASIGNAR.
 *
 * Solo concede el permiso; los @Roles de las rutas de asignación no cambian aquí
 * (el 403 a la SECRETARIA va en TSK-002-N52, decisión de la usuaria 18/11/2026).
 *
 * Sigue el patrón de AddProtocolosListarPermission1900000000000: inserción por códigos,
 * idempotente (ON CONFLICT DO NOTHING). Aborta si falta el rol o el permiso.
 * Matriz resultante: SECRETARIA 36, PRESIDENTE 23, EVALUADOR 9, INVESTIGADOR 8 (76 filas).
 *
 * down() borra solo la fila PRESIDENTE → EVALUACION_ASIGNAR de rol_permisos.
 */
export class GrantEvaluacionAsignarToPresidente1970000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles = (await queryRunner.query(
      `SELECT id FROM catalogos.roles WHERE codigo = 'PRESIDENTE' AND eliminado_en IS NULL`,
    )) as Array<{ id: number }>;
    if (roles.length !== 1) {
      throw new Error(
        `[TSK-002-N51] ABORT: se esperaba 1 rol PRESIDENTE vigente y hay ${roles.length}.`,
      );
    }

    const permisos = (await queryRunner.query(
      `SELECT id FROM catalogos.permisos WHERE codigo = 'EVALUACION_ASIGNAR' AND eliminado_en IS NULL`,
    )) as Array<{ id: number }>;
    if (permisos.length !== 1) {
      throw new Error(
        `[TSK-002-N51] ABORT: se esperaba 1 permiso EVALUACION_ASIGNAR vigente y hay ${permisos.length}.`,
      );
    }

    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM catalogos.roles r
      JOIN catalogos.permisos p
        ON p.codigo = 'EVALUACION_ASIGNAR' AND p.eliminado_en IS NULL
      WHERE r.codigo = 'PRESIDENTE' AND r.eliminado_en IS NULL
      ON CONFLICT (rol_id, permiso_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM catalogos.rol_permisos
      WHERE rol_id IN (SELECT id FROM catalogos.roles WHERE codigo = 'PRESIDENTE')
        AND permiso_id IN (
          SELECT id FROM catalogos.permisos WHERE codigo = 'EVALUACION_ASIGNAR'
        )
    `);
  }
}
