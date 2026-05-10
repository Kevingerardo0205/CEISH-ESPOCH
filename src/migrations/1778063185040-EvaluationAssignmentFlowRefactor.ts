import { MigrationInterface, QueryRunner } from 'typeorm';

export class EvaluationAssignmentFlowRefactor1778063185040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE evaluacion.asignaciones_evaluacion 
            ADD COLUMN IF NOT EXISTS fecha_sugerencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS fecha_confirmacion TIMESTAMP,
            ADD COLUMN IF NOT EXISTS sugerido_por INTEGER REFERENCES catalogos.usuarios(id),
            ADD COLUMN IF NOT EXISTS confirmado_por INTEGER REFERENCES catalogos.usuarios(id);

            -- Sincronizar estados si existen registros
            UPDATE evaluacion.asignaciones_evaluacion SET estado_id = 1 WHERE estado_id IS NULL;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE evaluacion.asignaciones_evaluacion 
            DROP COLUMN IF EXISTS fecha_sugerencia,
            DROP COLUMN IF EXISTS fecha_confirmacion,
            DROP COLUMN IF EXISTS sugerido_por,
            DROP COLUMN IF EXISTS confirmado_por;
        `);
  }
}
