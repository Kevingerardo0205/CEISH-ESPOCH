import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-002-N50 (RF-12.1 a/f, EARS 1c, spec v1.3.1, 18/11/2026): el perfil «Ético» (id 7)
 * se renombra a «Bioético». No se crea un perfil nuevo; no se tocan miembros
 * (`catalogos.evaluadores_perfil`), asignaciones, historial ni `orden_prioridad`.
 * Si id 7 ya se llama «Bioético», no hace nada. Si id 7 no se llama «Ético», o si otra
 * fila tiene un nombre normalizado (sin tildes, en mayúsculas) que empiece por «BIOETIC»,
 * aborta sin cambiar nada y dice qué fila lo impide.
 * Guard de la base: el de src/config/typeorm-cli.config.ts (MIGRATION_CONFIRM_DB = DB_NAME).
 */
const PROFILE_ID = 7;
const OLD_NAME = 'Ético';
const OLD_DESCRIPTION =
  'Analiza principios éticos, consentimiento informado y protección de participantes';
const NEW_NAME = 'Bioético';
const NEW_DESCRIPTION = 'Profesional con conocimientos en bioética';

function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
}

export class RenameEticoToBioeticoEvaluatorProfile1960000000000 implements MigrationInterface {
  name = 'RenameEticoToBioeticoEvaluatorProfile1960000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT id, nombre FROM catalogos.perfiles_evaluador ORDER BY id`,
    )) as Array<{ id: number; nombre: string }>;
    const target = rows.find((r) => Number(r.id) === PROFILE_ID);
    if (!target) {
      throw new Error(
        `TSK-002-N50: no existe el perfil de evaluador id ${PROFILE_ID}; no se cambió nada.`,
      );
    }
    if (target.nombre === NEW_NAME) {
      return;
    }
    if (target.nombre !== OLD_NAME) {
      throw new Error(
        `TSK-002-N50: el perfil id ${PROFILE_ID} se llama '${target.nombre}', no '${OLD_NAME}'; no se cambió nada.`,
      );
    }
    const blocking = rows.filter(
      (r) =>
        Number(r.id) !== PROFILE_ID &&
        normalizeName(r.nombre).startsWith('BIOETIC'),
    );
    if (blocking.length > 0) {
      const detail = blocking.map((r) => `id ${r.id} '${r.nombre}'`).join(', ');
      throw new Error(
        `TSK-002-N50: ya existe otro perfil Bioético (${detail}); no se cambió nada.`,
      );
    }

    const updated = (await queryRunner.query(
      `WITH u AS (
         UPDATE catalogos.perfiles_evaluador
            SET nombre = $1, descripcion = $2
          WHERE id = $3 AND nombre = $4
          RETURNING id
       )
       SELECT count(*)::int AS n FROM u`,
      [NEW_NAME, NEW_DESCRIPTION, PROFILE_ID, OLD_NAME],
    )) as Array<{ n: number }>;
    if (Number(updated[0]?.n) !== 1) {
      throw new Error(
        `TSK-002-N50: se esperaba renombrar 1 fila (id ${PROFILE_ID}) y se renombraron ${updated[0]?.n ?? 0}; no se cambió nada.`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE catalogos.perfiles_evaluador
          SET nombre = $1, descripcion = $2
        WHERE id = $3 AND nombre = $4`,
      [OLD_NAME, OLD_DESCRIPTION, PROFILE_ID, NEW_NAME],
    );
  }
}
