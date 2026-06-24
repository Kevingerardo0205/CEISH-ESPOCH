import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationResponsesDetailTable1790000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columnas para documentos auto-generados
    await queryRunner.query(`
      ALTER TABLE evaluacion.evaluaciones 
      ADD COLUMN IF NOT EXISTS ruta_docx CHARACTER VARYING(500),
      ADD COLUMN IF NOT EXISTS ruta_pdf CHARACTER VARYING(500);
    `);

    // 2. Crear tipos enum si no existen en el esquema evaluacion
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'criterio_tipo_enum' AND n.nspname = 'evaluacion') THEN
          CREATE TYPE evaluacion.criterio_tipo_enum AS ENUM ('ETICA', 'METODOLOGIA', 'JURIDICA');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'item_estado_enum' AND n.nspname = 'evaluacion') THEN
          CREATE TYPE evaluacion.item_estado_enum AS ENUM ('C', 'NC', 'NA');
        END IF;
      END $$;
    `);

    // 3. Crear la tabla detallada
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.evaluacion_respuestas_detalles (
        id SERIAL PRIMARY KEY,
        evaluacion_id INTEGER NOT NULL REFERENCES evaluacion.evaluaciones(id) ON DELETE CASCADE,
        criterio_tipo evaluacion.criterio_tipo_enum NOT NULL,
        item_codigo VARCHAR(50) NOT NULL,
        estado evaluacion.item_estado_enum NOT NULL,
        observaciones TEXT,
        creado_en TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );
    `);

    // 4. Crear índice para optimización
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_eval_resp_detalles_evaluacion ON evaluacion.evaluacion_respuestas_detalles(evaluacion_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar tabla
    await queryRunner.query(`
      DROP TABLE IF EXISTS evaluacion.evaluacion_respuestas_detalles CASCADE;
    `);

    // 2. Eliminar tipos enum
    await queryRunner.query(`
      DROP TYPE IF EXISTS evaluacion.criterio_tipo_enum CASCADE;
      DROP TYPE IF EXISTS evaluacion.item_estado_enum CASCADE;
    `);

    // 3. Eliminar columnas
    await queryRunner.query(`
      ALTER TABLE evaluacion.evaluaciones 
      DROP COLUMN IF EXISTS ruta_docx CASCADE,
      DROP COLUMN IF EXISTS ruta_pdf CASCADE;
    `);
  }
}
