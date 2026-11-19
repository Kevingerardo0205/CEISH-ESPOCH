import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-002-N52 (spec-002 v1.3.2, RF-12.7 c.1): fecha límite del plazo de evaluación.
 *
 * Cambio de esquema aditivo (visto bueno de la usuaria 18/11/2026):
 *   evaluacion.asignaciones_evaluacion.fecha_limite_revision timestamptz NULL.
 *
 * Relleno de las asignaciones en estado 5 (SUGGESTED), 6 (ASSIGNED) y 7 (COMPLETED)
 * que aún tengan fecha_limite_revision NULL, calculado en SQL (sin importar código de src/):
 *   día de fecha_asignacion en America/Guayaquil
 *   + plazo_revision_oficio_dias días laborables (lunes a viernes, sin contar el día de inicio)
 *   a las 23:59:59.999 de Ecuador.
 * Es la misma regla que BusinessDayCalculator.calculateDetailedDeadline con holidays: []
 * (lo comprueba test/presidente-assignment.e2e-spec.ts).
 *
 * fecha_asignacion es timestamp sin zona con DEFAULT now() y la base está en UTC, así que
 * guarda la hora UTC: se lee con AT TIME ZONE 'UTC' y luego se pasa a America/Guayaquil.
 *
 * Las filas sin fecha_asignacion quedan en NULL y se cuentan aparte (no aborta).
 * Aborta en español si falta el parámetro plazo_revision_oficio_dias o no es un entero ≥ 1.
 * up() imprime en la consola las filas rellenadas por estado.
 *
 * down() borra la columna.
 */
export class AddFechaLimiteRevisionToAssignments1980000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const params = (await queryRunner.query(
      `SELECT valor FROM sistema.parametros_sistema WHERE clave = 'plazo_revision_oficio_dias'`,
    )) as Array<{ valor: string | null }>;
    if (params.length !== 1) {
      throw new Error(
        `[TSK-002-N52] ABORT: se esperaba 1 parámetro plazo_revision_oficio_dias en sistema.parametros_sistema y hay ${params.length}.`,
      );
    }
    const rawDays = (params[0].valor ?? '').trim();
    if (!/^\d+$/.test(rawDays) || parseInt(rawDays, 10) < 1) {
      throw new Error(
        `[TSK-002-N52] ABORT: el parámetro plazo_revision_oficio_dias debe ser un entero mayor o igual a 1; vale "${rawDays}".`,
      );
    }
    const businessDays = parseInt(rawDays, 10);

    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion
      ADD COLUMN IF NOT EXISTS fecha_limite_revision timestamptz NULL
    `);

    const withoutAssignedAt = (await queryRunner.query(`
      SELECT estado_id, count(*)::int AS filas
      FROM evaluacion.asignaciones_evaluacion
      WHERE estado_id IN (5, 6, 7)
        AND fecha_limite_revision IS NULL
        AND fecha_asignacion IS NULL
      GROUP BY estado_id
    `)) as Array<{ estado_id: number; filas: number }>;

    const updated = (await queryRunner.query(
      `
      WITH calc AS (
        SELECT b.id,
               (
                 SELECT g.dia::date
                 FROM generate_series(
                        b.dia_inicio + 1,
                        b.dia_inicio + ($1::int * 2 + 7),
                        interval '1 day'
                      ) AS g(dia)
                 WHERE extract(isodow FROM g.dia) < 6
                 ORDER BY g.dia
                 OFFSET ($1::int - 1)
                 LIMIT 1
               ) AS fecha_limite_dia
        FROM (
          SELECT x.id,
                 ((x.fecha_asignacion AT TIME ZONE 'UTC') AT TIME ZONE 'America/Guayaquil')::date
                   AS dia_inicio
          FROM evaluacion.asignaciones_evaluacion x
          WHERE x.estado_id IN (5, 6, 7)
            AND x.fecha_limite_revision IS NULL
            AND x.fecha_asignacion IS NOT NULL
        ) b
      ),
      upd AS (
        UPDATE evaluacion.asignaciones_evaluacion a
        SET fecha_limite_revision =
          (calc.fecha_limite_dia + time '23:59:59.999') AT TIME ZONE 'America/Guayaquil'
        FROM calc
        WHERE a.id = calc.id
        RETURNING a.estado_id
      )
      SELECT estado_id, count(*)::int AS filas FROM upd GROUP BY estado_id
      `,
      [businessDays],
    )) as Array<{ estado_id: number; filas: number }>;

    const countFor = (
      rows: Array<{ estado_id: number; filas: number }>,
      estado: number,
    ): number =>
      Number(rows.find((r) => Number(r.estado_id) === estado)?.filas ?? 0);
    const total = [5, 6, 7].reduce((acc, e) => acc + countFor(updated, e), 0);

    console.log(
      `[TSK-002-N52] fecha_limite_revision rellenada (${businessDays} días laborables): ` +
        `estado 5 = ${countFor(updated, 5)}, ` +
        `estado 6 = ${countFor(updated, 6)}, ` +
        `estado 7 = ${countFor(updated, 7)}, ` +
        `total = ${total}. ` +
        `Sin fecha_asignacion (quedan en NULL): ` +
        `estado 5 = ${countFor(withoutAssignedAt, 5)}, ` +
        `estado 6 = ${countFor(withoutAssignedAt, 6)}, ` +
        `estado 7 = ${countFor(withoutAssignedAt, 7)}.`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion
      DROP COLUMN IF EXISTS fecha_limite_revision
    `);
  }
}
