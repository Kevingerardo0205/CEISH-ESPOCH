import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeEvaluatorProfileNames1778784132273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Normalizar nombres a formato UPPER_SNAKE_CASE sin acentos para compatibilidad estricta con el Frontend
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'JURIDICO' WHERE nombre = 'JURÍDICO'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'SALUD' WHERE nombre = 'SALUD'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'METODOLOGIA' WHERE nombre = 'METODOLOGÍA'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'BIOETICA' WHERE nombre = 'BIOÉTICA'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'SOCIEDAD_CIVIL' WHERE nombre = 'SOCIEDAD CIVIL'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a los nombres originales con acentos y espacios
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'JURÍDICO' WHERE nombre = 'JURIDICO'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'METODOLOGÍA' WHERE nombre = 'METODOLOGIA'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'BIOÉTICA' WHERE nombre = 'BIOETICA'`);
    await queryRunner.query(`UPDATE catalogos.perfiles_evaluador SET nombre = 'SOCIEDAD CIVIL' WHERE nombre = 'SOCIEDAD_CIVIL'`);
  }
}
