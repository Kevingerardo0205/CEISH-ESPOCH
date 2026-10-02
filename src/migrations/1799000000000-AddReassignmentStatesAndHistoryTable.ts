import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReassignmentStatesAndHistoryTable1799000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insertar nuevos estados en catalogos.estados para Reasignación de Evaluadores
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (26, 'REASIGNADO_VENCIMIENTO', 'EVALUACION', 'REASIGNADO_VENCIMIENTO'),
      (27, 'REASIGNADO_COI', 'EVALUACION', 'REASIGNADO_COI')
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        categoria = EXCLUDED.categoria,
        codigo = EXCLUDED.codigo;
    `);

    // Sincronizar la secuencia de la tabla catalogos.estados
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 27), true);
    `);

    // 2. Añadir columna es_asignado_anexo_10 a evaluacion.asignaciones_evaluacion
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD COLUMN IF NOT EXISTS es_asignado_anexo_10 BOOLEAN DEFAULT FALSE;
    `);

    // 3. Crear tabla evaluacion.asignacion_historial para la trazabilidad inmutable de reasignaciones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.asignacion_historial (
          id SERIAL PRIMARY KEY,
          asignacion_anterior_id INT NOT NULL REFERENCES evaluacion.asignaciones_evaluacion(id) ON DELETE CASCADE,
          evaluador_anterior_id INT NOT NULL REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
          perfil_id INT REFERENCES catalogos.perfiles_evaluador(id) ON DELETE SET NULL,
          motivo VARCHAR(50) NOT NULL,
          justificacion TEXT,
          evaluador_nuevo_id INT NOT NULL REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
          asignacion_nueva_id INT REFERENCES evaluacion.asignaciones_evaluacion(id) ON DELETE SET NULL,
          ejecutado_por INT NOT NULL REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar tabla evaluacion.asignacion_historial
    await queryRunner.query(`
      DROP TABLE IF EXISTS evaluacion.asignacion_historial;
    `);

    // 2. Eliminar columna es_asignado_anexo_10 de evaluacion.asignaciones_evaluacion
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP COLUMN IF EXISTS es_asignado_anexo_10;
    `);

    // 3. Eliminar estados agregados de catalogos.estados
    await queryRunner.query(`
      DELETE FROM catalogos.estados WHERE id IN (26, 27);
    `);

    // Sincronizar la secuencia de catalogos.estados
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 25), true);
    `);
  }
}
