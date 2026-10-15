// MIGRATION_CONFIRM_DB: verifica que evaluacion.convocatoria_protocolos existe antes de ejecutar.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConvocatoriaProtocolosVersion1851000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idempotente: si la constraint ya existe, no hace nada
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const constraintResult: { exists: boolean }[] = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_convocatoria_protocolos_version'
          AND conrelid = 'evaluacion.convocatoria_protocolos'::regclass
      ) AS exists
    `);
    if (constraintResult[0].exists) {
      return;
    }

    // Pre-check: abortar si hay pares (convocatoria_id, version_id) duplicados
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dupResult: {
      convocatoria_id: string;
      version_id: number;
      count: string;
    }[] = await queryRunner.query(`
      SELECT convocatoria_id, version_id, COUNT(*) AS count
      FROM evaluacion.convocatoria_protocolos
      WHERE version_id IS NOT NULL
      GROUP BY convocatoria_id, version_id
      HAVING COUNT(*) > 1
    `);
    if (dupResult.length > 0) {
      const detail = dupResult
        .map(
          (r) =>
            `(convocatoria_id=${r.convocatoria_id}, version_id=${r.version_id}, duplicados=${r.count})`,
        )
        .join('; ');
      throw new Error(
        `ABORTAR: Se encontraron ${dupResult.length} pares duplicados en evaluacion.convocatoria_protocolos. Resolver manualmente antes de aplicar esta migración: ${detail}`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
      ADD CONSTRAINT uq_convocatoria_protocolos_version
      UNIQUE (convocatoria_id, version_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
      DROP CONSTRAINT IF EXISTS uq_convocatoria_protocolos_version
    `);
  }
}
