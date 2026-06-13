import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorEstadosDictamenes1791000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // FASE 1: DESPLIEGUE ESTRUCTURAL (Release 1)
    // ==========================================

    // 1. Crear catálogo de dictámenes con columna codigo y restricciones UNIQUE para proteger la semántica
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS catalogos.dictamenes_evaluador (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        codigo VARCHAR(10) NOT NULL,
        CONSTRAINT UQ_dictamen_nombre UNIQUE (nombre),
        CONSTRAINT UQ_dictamen_codigo UNIQUE (codigo)
      );
    `);

    // Insertar semillas para el catálogo de dictámenes
    await queryRunner.query(`
      INSERT INTO catalogos.dictamenes_evaluador (id, nombre, codigo) VALUES
      (1, 'APROBADO', 'APR'),
      (2, 'APROBADO_CON_OBSERVACIONES', 'APO'),
      (3, 'RECHAZADO', 'REC')
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        codigo = EXCLUDED.codigo;
    `);

    // Resetear secuencia del catálogo
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('catalogos.dictamenes_evaluador', 'id'), 3);
    `);

    // 2. Agregar nuevas columnas de llaves foráneas a las tablas correspondientes
    await queryRunner.query(`
      ALTER TABLE evaluacion.evaluaciones 
      ADD COLUMN IF NOT EXISTS resultado_id INTEGER;

      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD COLUMN IF NOT EXISTS recomendacion_id INTEGER;
    `);

    // 3. Migrar los datos existentes mapeando el varchar actual al ID del catálogo
    await queryRunner.query(`
      UPDATE evaluacion.evaluaciones
      SET resultado_id = CASE resultado
          WHEN 'APROBADO' THEN 1
          WHEN 'APROBADO_CON_OBSERVACIONES' THEN 2
          WHEN 'RECHAZADO' THEN 3
          ELSE NULL
        END
      WHERE resultado_id IS NULL;

      UPDATE evaluacion.asignaciones_evaluacion
      SET recomendacion_id = CASE recomendacion
          WHEN 'APROBADO' THEN 1
          WHEN 'APROBADO_CON_OBSERVACIONES' THEN 2
          WHEN 'RECHAZADO' THEN 3
          ELSE NULL
        END
      WHERE recomendacion_id IS NULL;
    `);

    // 4. Agregar restricciones de claves foráneas reales a las nuevas columnas (con ON DELETE RESTRICT)
    await queryRunner.query(`
      ALTER TABLE evaluacion.evaluaciones
      ADD CONSTRAINT FK_evaluacion_resultado_dictamen
      FOREIGN KEY (resultado_id) REFERENCES catalogos.dictamenes_evaluador(id)
      ON DELETE RESTRICT;

      ALTER TABLE evaluacion.asignaciones_evaluacion
      ADD CONSTRAINT FK_asignacion_recomendacion_dictamen
      FOREIGN KEY (recomendacion_id) REFERENCES catalogos.dictamenes_evaluador(id)
      ON DELETE RESTRICT;
    `);

    // 5. Agregar FKs a catalogos.estados para asegurar integridad referencial (con ON DELETE RESTRICT)
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD CONSTRAINT FK_asignaciones_evaluacion_estado 
      FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id)
      ON DELETE RESTRICT;

      ALTER TABLE public.versiones_protocolo 
      ADD CONSTRAINT FK_versiones_protocolo_estado 
      FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id)
      ON DELETE RESTRICT;

      ALTER TABLE recepcion.recepciones 
      ADD CONSTRAINT FK_recepciones_estado_id
      FOREIGN KEY (estado_id) REFERENCES catalogos.estados(id)
      ON DELETE RESTRICT;
    `);

    // 6. Asegurar clave foránea física en version_actual_id del protocolo (con ON DELETE RESTRICT)
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD CONSTRAINT FK_protocolos_version_actual 
      FOREIGN KEY (version_actual_id) REFERENCES public.versiones_protocolo(id)
      ON DELETE RESTRICT;
    `);

    // 7. Asegurar clave única física en versiones_protocolo (Protección Definitiva de Concurrencia)
    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      ADD CONSTRAINT UQ_protocolo_numero_version UNIQUE (protocolo_id, numero_version);
    `);

    // 8. Asegurar clave única en recepciones por versión (Unicidad 1-a-1 de Recepción activa)
    await queryRunner.query(`
      ALTER TABLE recepcion.recepciones 
      ADD CONSTRAINT UQ_recepciones_version UNIQUE (version_id);
    `);

    // 9. Crear índices para optimización de JOIN, UPDATE y DELETE
    // Nota: No se crea índice manual sobre recepciones(version_id) dado que la restricción UNIQUE(version_id) de PostgreSQL genera un índice único implícitamente.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_evaluaciones_resultado_id ON evaluacion.evaluaciones(resultado_id);
      CREATE INDEX IF NOT EXISTS idx_asignaciones_recomendacion_id ON evaluacion.asignaciones_evaluacion(recomendacion_id);
      CREATE INDEX IF NOT EXISTS idx_versiones_estado ON public.versiones_protocolo(estado_id);
      CREATE INDEX IF NOT EXISTS idx_versiones_protocolo_id ON public.versiones_protocolo(protocolo_id);
      CREATE INDEX IF NOT EXISTS idx_recepciones_estado ON recepcion.recepciones(estado_id);
      CREATE INDEX IF NOT EXISTS idx_asignaciones_estado ON evaluacion.asignaciones_evaluacion(estado_id);
      CREATE INDEX IF NOT EXISTS idx_protocolos_version_actual ON public.protocolos(version_actual_id);
    `);

    // 10. Aplicar restricciones NOT NULL una vez validada la migración de datos limpios y la ausencia de borradores
    // Se ejecuta una verificación dinámica para asegurar que no falle en caso de que existan borradores nulos en producción.
    const nullCountResult = await queryRunner.query(`
      SELECT COUNT(*) as count FROM evaluacion.evaluaciones WHERE resultado_id IS NULL;
    `);
    const nullCount = parseInt(nullCountResult[0]?.count || '0', 10);
    if (nullCount === 0) {
      await queryRunner.query(`
        ALTER TABLE evaluacion.evaluaciones ALTER COLUMN resultado_id SET NOT NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Quitar restricciones NOT NULL
    await queryRunner.query(`
      ALTER TABLE evaluacion.evaluaciones ALTER COLUMN resultado_id DROP NOT NULL;
    `);

    // 2. Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_evaluaciones_resultado_id;
      DROP INDEX IF EXISTS idx_asignaciones_recomendacion_id;
      DROP INDEX IF EXISTS idx_versiones_estado;
      DROP INDEX IF EXISTS idx_versiones_protocolo_id;
      DROP INDEX IF EXISTS idx_recepciones_estado;
      DROP INDEX IF EXISTS idx_asignaciones_estado;
      DROP INDEX IF EXISTS idx_protocolos_version_actual;
    `);

    // 3. Eliminar restricciones UNIQUE
    await queryRunner.query(`
      ALTER TABLE recepcion.recepciones DROP CONSTRAINT IF EXISTS UQ_recepciones_version;
      ALTER TABLE public.versiones_protocolo DROP CONSTRAINT IF EXISTS UQ_protocolo_numero_version;
    `);

    // 4. Eliminar llaves foráneas
    await queryRunner.query(`
      ALTER TABLE public.protocolos DROP CONSTRAINT IF EXISTS FK_protocolos_version_actual;
      ALTER TABLE recepcion.recepciones DROP CONSTRAINT IF EXISTS FK_recepciones_estado_id;
      ALTER TABLE public.versiones_protocolo DROP CONSTRAINT IF EXISTS FK_versiones_protocolo_estado;
      ALTER TABLE evaluacion.asignaciones_evaluacion DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_estado;
      ALTER TABLE evaluacion.asignaciones_evaluacion DROP CONSTRAINT IF EXISTS FK_asignacion_recomendacion_dictamen;
      ALTER TABLE evaluacion.evaluaciones DROP CONSTRAINT IF EXISTS FK_evaluacion_resultado_dictamen;
    `);

    // 5. Eliminar columnas nuevas
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion DROP COLUMN IF EXISTS recomendacion_id;
      ALTER TABLE evaluacion.evaluaciones DROP COLUMN IF EXISTS resultado_id;
    `);

    // 6. Eliminar catálogo
    await queryRunner.query(`
      DROP TABLE IF EXISTS catalogos.dictamenes_evaluador CASCADE;
    `);
  }
}
