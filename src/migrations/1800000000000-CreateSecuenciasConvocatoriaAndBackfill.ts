import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecuenciasConvocatoriaAndBackfill1800000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Backfill de convocatorias huérfanas o con numero_convocatoria NULL
    await queryRunner.query(`
      UPDATE evaluacion.convocatorias
      SET numero_convocatoria = '000-2026',
          anio_lectivo = COALESCE(anio_lectivo, 2026)
      WHERE numero_convocatoria IS NULL;
    `);

    // Asegurar anio_lectivo para registros existentes
    await queryRunner.query(`
      UPDATE evaluacion.convocatorias
      SET anio_lectivo = 2026
      WHERE anio_lectivo IS NULL;
    `);

    // 2. Crear tabla evaluacion.secuencias_convocatoria
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.secuencias_convocatoria (
        anio_lectivo INTEGER PRIMARY KEY,
        ultimo_secuencial INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Inicializar o sincronizar el secuencial para 2026 basado en los datos existentes
    await queryRunner.query(`
      INSERT INTO evaluacion.secuencias_convocatoria (anio_lectivo, ultimo_secuencial)
      SELECT 
        COALESCE(anio_lectivo, 2026) AS anio_lectivo,
        COALESCE(MAX(
          CASE 
            WHEN numero_convocatoria ~ '^[0-9]{3}-[0-9]{4}$' 
            THEN SUBSTRING(numero_convocatoria FROM 1 FOR 3)::INTEGER 
            ELSE 0 
          END
        ), 0) AS ultimo_secuencial
      FROM evaluacion.convocatorias
      GROUP BY COALESCE(anio_lectivo, 2026)
      ON CONFLICT (anio_lectivo) DO UPDATE 
      SET ultimo_secuencial = GREATEST(evaluacion.secuencias_convocatoria.ultimo_secuencial, EXCLUDED.ultimo_secuencial);
    `);

    // Asegurar que 2026 tenga al menos fila en tabla de secuencias
    await queryRunner.query(`
      INSERT INTO evaluacion.secuencias_convocatoria (anio_lectivo, ultimo_secuencial)
      VALUES (2026, 0)
      ON CONFLICT (anio_lectivo) DO NOTHING;
    `);

    // 4. Aplicar restricción NOT NULL sobre numero_convocatoria
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatorias 
      ALTER COLUMN numero_convocatoria SET NOT NULL;
    `);

    // 5. Aplicar constraint UNIQUE sobre numero_convocatoria si no existe
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'uq_convocatorias_numero' 
             OR (conrelid = 'evaluacion.convocatorias'::regclass AND contype = 'u' AND conname LIKE '%numero_convocatoria%')
        ) THEN
          ALTER TABLE evaluacion.convocatorias ADD CONSTRAINT uq_convocatorias_numero UNIQUE (numero_convocatoria);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar constraint UNIQUE si existe
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatorias 
      DROP CONSTRAINT IF EXISTS uq_convocatorias_numero;
    `);

    // 2. Permitir NULL nuevamente en numero_convocatoria
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatorias 
      ALTER COLUMN numero_convocatoria DROP NOT NULL;
    `);

    // 3. Eliminar tabla de secuencias
    await queryRunner.query(`
      DROP TABLE IF EXISTS evaluacion.secuencias_convocatoria;
    `);
  }
}
