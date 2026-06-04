import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportPathToAssignments1785000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna a asignaciones_evaluacion
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD COLUMN IF NOT EXISTS ruta_informe_pdf VARCHAR(500);
    `);

    // 2. Agregar columna a asignaciones_pares_riesgo
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_pares_riesgo 
      ADD COLUMN IF NOT EXISTS ruta_informe_pdf VARCHAR(500);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar columna de asignaciones_evaluacion
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP COLUMN IF EXISTS ruta_informe_pdf;
    `);

    // 2. Eliminar columna de asignaciones_pares_riesgo
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_pares_riesgo 
      DROP COLUMN IF EXISTS ruta_informe_pdf;
    `);
  }
}
