import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-015-N11 — spec-003 RF-17.7 (v1.6.4) y specs/001 v3.7.10: solo SECRETARIA crea
 * o sube resoluciones. Se quita la concesión (PRESIDENTE, RESOLUCION_CREAR).
 *
 * Migración de DATOS. Sin cambios de esquema. Reglas:
 * - el rol y el permiso se buscan por código, nunca por id fijo;
 * - aborta si no existe exactamente una fila de rol PRESIDENTE vigente y una de
 *   permiso RESOLUCION_CREAR vigente;
 * - up es idempotente: si la concesión ya no existe, el DELETE no afecta filas;
 * - down restaura la concesión con ON CONFLICT DO NOTHING (no duplica).
 */
export class QuitarResolucionCrearPresidente2000000000002 implements MigrationInterface {
  private static readonly ROL = 'PRESIDENTE';
  private static readonly PERMISO = 'RESOLUCION_CREAR';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const { rolId, permisoId } = await this.buscarIds(queryRunner);
    await queryRunner.query(
      `DELETE FROM catalogos.rol_permisos
        WHERE rol_id = $1 AND permiso_id = $2`,
      [rolId, permisoId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const { rolId, permisoId } = await this.buscarIds(queryRunner);
    await queryRunner.query(
      `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
       VALUES ($1, $2)
       ON CONFLICT (rol_id, permiso_id) DO NOTHING`,
      [rolId, permisoId],
    );
  }

  private async buscarIds(
    queryRunner: QueryRunner,
  ): Promise<{ rolId: number; permisoId: number }> {
    const roles = (await queryRunner.query(
      `SELECT id FROM catalogos.roles WHERE codigo = $1 AND eliminado_en IS NULL`,
      [QuitarResolucionCrearPresidente2000000000002.ROL],
    )) as Array<{ id: number }>;
    if (roles.length !== 1) {
      throw new Error(
        `[TSK-015-N11] ABORT: se esperaba 1 rol PRESIDENTE vigente y hay ${roles.length}.`,
      );
    }

    const permisos = (await queryRunner.query(
      `SELECT id FROM catalogos.permisos WHERE codigo = $1 AND eliminado_en IS NULL`,
      [QuitarResolucionCrearPresidente2000000000002.PERMISO],
    )) as Array<{ id: number }>;
    if (permisos.length !== 1) {
      throw new Error(
        `[TSK-015-N11] ABORT: se esperaba 1 permiso RESOLUCION_CREAR vigente y hay ${permisos.length}.`,
      );
    }

    return { rolId: roles[0].id, permisoId: permisos[0].id };
  }
}
