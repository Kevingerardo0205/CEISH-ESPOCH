import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFechaLimiteTsToAsignaciones1870000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion
      ADD COLUMN fecha_limite_ts timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion
      DROP COLUMN fecha_limite_ts
    `);
  }
}
