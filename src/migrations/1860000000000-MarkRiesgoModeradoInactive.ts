import { MigrationInterface, QueryRunner } from 'typeorm';

export class MarkRiesgoModeradoInactive1860000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE catalogos.niveles_riesgo
      SET activo = false
      WHERE codigo = 'RIESGO_MODERADO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE catalogos.niveles_riesgo
      SET activo = true
      WHERE codigo = 'RIESGO_MODERADO'
    `);
  }
}
