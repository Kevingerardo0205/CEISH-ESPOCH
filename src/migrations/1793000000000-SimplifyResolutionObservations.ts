import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyResolutionObservations1793000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar la columna consolidada 'observaciones'
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones 
      ADD COLUMN observaciones text;
    `);

    // 2. Migrar los datos existentes concatenando la información
    await queryRunner.query(`
      UPDATE resolucion.resoluciones
      SET observaciones = CONCAT(
        CASE WHEN observaciones_mayores IS NOT NULL AND observaciones_mayores <> '' THEN 'Observaciones Mayores: ' || observaciones_mayores || E'\n' ELSE '' END,
        CASE WHEN observaciones_menores IS NOT NULL AND observaciones_menores <> '' THEN 'Observaciones Menores: ' || observaciones_menores || E'\n' ELSE '' END,
        CASE WHEN procedimiento_subsanacion IS NOT NULL AND procedimiento_subsanacion <> '' THEN 'Procedimiento: ' || procedimiento_subsanacion ELSE '' END
      );
    `);

    // 3. Eliminar las 3 columnas redundantes
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones DROP COLUMN observaciones_mayores;
      ALTER TABLE resolucion.resoluciones DROP COLUMN observaciones_menores;
      ALTER TABLE resolucion.resoluciones DROP COLUMN procedimiento_subsanacion;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Restaurar las 3 columnas anteriores
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones ADD COLUMN observaciones_mayores text;
      ALTER TABLE resolucion.resoluciones ADD COLUMN observaciones_menores text;
      ALTER TABLE resolucion.resoluciones ADD COLUMN procedimiento_subsanacion text;
    `);

    // 2. Copiar los datos consolidados en observaciones_mayores como fallback histórico
    await queryRunner.query(`
      UPDATE resolucion.resoluciones 
      SET observaciones_mayores = observaciones;
    `);

    // 3. Eliminar la columna observaciones
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones DROP COLUMN observaciones;
    `);
  }
}
