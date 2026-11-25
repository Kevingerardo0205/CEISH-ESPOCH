import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-015-N08 — spec-003 v1.6.2 RF-17.1 y specs/001 v3.7.10: permiso
 * PLENO_RESULTADO_REGISTRAR, concedido solo a SECRETARIA.
 *
 * Migración de DATOS separada de la de esquema. Reglas:
 * - el módulo se busca por codigo (MOD_EVALUACION) y se verifica que sea el mismo
 *   de EVALUACION_PLENO; no se asume un id fijo;
 * - el rol SECRETARIA se busca por codigo y debe existir exactamente una vez;
 * - el id del permiso lo asigna la secuencia (no se fija);
 * - idempotente: no se inserta si ya existe el código, y la concesión usa
 *   ON CONFLICT sobre la PK (rol_id, permiso_id).
 *
 * down() borra la concesión y el permiso creados aquí. El código es nuevo, así que
 * no puede pertenecer a otra fila.
 */
export class PermisoPlenoResultadoRegistrar2000000000001 implements MigrationInterface {
  private static readonly CODIGO = 'PLENO_RESULTADO_REGISTRAR';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const modulos = (await queryRunner.query(
      `SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_EVALUACION'`,
    )) as Array<{ id: number }>;
    if (modulos.length !== 1) {
      throw new Error(
        `[TSK-015-N08] ABORT: se esperaba 1 módulo MOD_EVALUACION y hay ${modulos.length}.`,
      );
    }
    const moduloId = modulos[0].id;

    const plenoModulo = (await queryRunner.query(
      `SELECT p.modulo_id AS id FROM catalogos.permisos p
        WHERE p.codigo = 'EVALUACION_PLENO' AND p.eliminado_en IS NULL`,
    )) as Array<{ id: number | null }>;
    if (plenoModulo.length !== 1 || plenoModulo[0].id !== moduloId) {
      throw new Error(
        `[TSK-015-N08] ABORT: EVALUACION_PLENO no está en MOD_EVALUACION (id ${moduloId}).`,
      );
    }

    const secretarias = (await queryRunner.query(
      `SELECT id FROM catalogos.roles WHERE codigo = 'SECRETARIA' AND eliminado_en IS NULL`,
    )) as Array<{ id: number }>;
    if (secretarias.length !== 1) {
      throw new Error(
        `[TSK-015-N08] ABORT: se esperaba 1 rol SECRETARIA vigente y hay ${secretarias.length}.`,
      );
    }

    await queryRunner.query(
      `INSERT INTO catalogos.permisos (nombre, codigo, modulo_id)
       SELECT 'Registrar resultado del pleno', $1::varchar, $2::integer
       WHERE NOT EXISTS (
         SELECT 1 FROM catalogos.permisos WHERE codigo = $1::varchar
       )`,
      [PermisoPlenoResultadoRegistrar2000000000001.CODIGO, moduloId],
    );

    await queryRunner.query(
      `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
       SELECT r.id, p.id
         FROM catalogos.roles r
         JOIN catalogos.permisos p
           ON p.codigo = $1 AND p.eliminado_en IS NULL
        WHERE r.codigo = 'SECRETARIA' AND r.eliminado_en IS NULL
       ON CONFLICT (rol_id, permiso_id) DO NOTHING`,
      [PermisoPlenoResultadoRegistrar2000000000001.CODIGO],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM catalogos.rol_permisos
        WHERE permiso_id IN (
          SELECT id FROM catalogos.permisos WHERE codigo = $1
        )`,
      [PermisoPlenoResultadoRegistrar2000000000001.CODIGO],
    );

    await queryRunner.query(
      `DELETE FROM catalogos.permisos WHERE codigo = $1`,
      [PermisoPlenoResultadoRegistrar2000000000001.CODIGO],
    );
  }
}
