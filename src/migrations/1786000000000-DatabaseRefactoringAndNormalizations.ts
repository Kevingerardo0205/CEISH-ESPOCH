import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseRefactoringAndNormalizations1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // === 1. Campo codigo_ceish Duplicado ===

    // A. Re-agregar codigo_ceish a public.protocolos si no existe
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN IF NOT EXISTS codigo_ceish VARCHAR(50);
    `);

    // B. Crear índice único parcial para codigo_ceish
    await queryRunner.query(`
      DROP INDEX IF EXISTS public.idx_codigo_ceish_unique;
      CREATE UNIQUE INDEX idx_codigo_ceish_unique 
      ON public.protocolos(codigo_ceish) 
      WHERE codigo_ceish IS NOT NULL;
    `);

    // C. Migrar datos de recepcion.recepciones.codigo_ceish_generado a public.protocolos.codigo_ceish
    await queryRunner.query(`
      UPDATE public.protocolos p
      SET codigo_ceish = r.codigo_ceish_generado
      FROM recepcion.recepciones r
      WHERE r.protocolo_id = p.id AND p.codigo_ceish IS NULL;
    `);

    // D. Eliminar la columna codigo_ceish_generado de recepcion.recepciones
    await queryRunner.query(`
      ALTER TABLE recepcion.recepciones 
      DROP COLUMN IF EXISTS codigo_ceish_generado;
    `);

    // E. Actualizar la función catalogos.generate_codigo_ceish para leer de public.protocolos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION catalogos.generate_codigo_ceish(p_tipo_id integer, p_year integer) RETURNS character varying
          LANGUAGE plpgsql
          AS $$
                  DECLARE
                      v_tipo_sigla varchar;
                      v_secuencial int;
                      v_nuevo_codigo varchar;
                  BEGIN
                      -- Obtener sigla según tipo_estudio_id
                      SELECT CASE 
                          WHEN codigo = 'IO' THEN 'IO'
                          WHEN codigo = 'EI' THEN 'EI'
                          WHEN codigo = 'EC' THEN 'EC'
                          ELSE 'EX'
                      END INTO v_tipo_sigla
                      FROM catalogos.tipos_estudio WHERE id = p_tipo_id;

                      -- Calcular secuencial
                      SELECT COALESCE(MAX(CAST(split_part(codigo_ceish, '-', 4) AS INTEGER)), 0) + 1 
                      INTO v_secuencial
                      FROM public.protocolos 
                      WHERE codigo_ceish LIKE 'CEISH-ESPOCH-' || v_tipo_sigla || '-%-' || p_year;

                      v_nuevo_codigo := 'CEISH-ESPOCH-' || v_tipo_sigla || '-' || LPAD(v_secuencial::text, 3, '0') || '-' || p_year;
                      
                      RETURN v_nuevo_codigo;
                  END;
                  $$;
    `);

    // F. Eliminar trigger y función obsoleta que dependía de estado_recepcion en protocolos
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_generate_ceish_code ON public.protocolos CASCADE;
      DROP FUNCTION IF EXISTS public.trg_assign_ceish_code() CASCADE;
    `);

    // === 2. versiones_protocolo sin FK a tipo_resolucion ===

    // A. Seed de catalogos.tipos_resolucion si está vacío
    await queryRunner.query(`
      INSERT INTO catalogos.tipos_resolucion (id, nombre) VALUES
      (1, 'APROBADO'),
      (2, 'APROBADO_CON_OBSERVACIONES'),
      (3, 'RECHAZADO'),
      (4, 'PENDIENTE_SUBSANACION')
      ON CONFLICT (nombre) DO NOTHING;
      
      -- Sincronizar secuencia
      SELECT pg_catalog.setval('catalogos.tipos_resolucion_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.tipos_resolucion), 1), true);
    `);

    // B. Agregar tipo_resolucion_id a public.versiones_protocolo
    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      ADD COLUMN IF NOT EXISTS tipo_resolucion_id INT;
    `);

    // C. Agregar FK constraint
    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      DROP CONSTRAINT IF EXISTS FK_versiones_protocolo_tipo_resolucion;
      
      ALTER TABLE public.versiones_protocolo 
      ADD CONSTRAINT FK_versiones_protocolo_tipo_resolucion 
      FOREIGN KEY (tipo_resolucion_id) REFERENCES catalogos.tipos_resolucion(id) ON DELETE SET NULL;
    `);

    // D. Migrar datos antiguos a tipo_resolucion_id
    await queryRunner.query(`
      UPDATE public.versiones_protocolo
      SET tipo_resolucion_id = CASE
        WHEN tipo_resolucion = 'APROBADO' THEN 1
        WHEN tipo_resolucion = 'APROBADO_CON_OBSERVACIONES' THEN 2
        WHEN tipo_resolucion = 'RECHAZADO' THEN 3
        WHEN tipo_resolucion = 'PENDIENTE_SUBSANACION' THEN 4
        ELSE NULL
      END
      WHERE tipo_resolucion IS NOT NULL;
    `);

    // E. Eliminar tipo_resolucion como columna de texto
    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      DROP COLUMN IF EXISTS tipo_resolucion;
    `);

    // === 3. asignado_por y aprobado_asignacion_por sin FK en BD ===
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_asignado_por,
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_aprobado_por;

      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD CONSTRAINT FK_asignaciones_evaluacion_asignado_por 
      FOREIGN KEY (asignado_por) REFERENCES catalogos.usuarios(id) ON DELETE SET NULL;

      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD CONSTRAINT FK_asignaciones_evaluacion_aprobado_por 
      FOREIGN KEY (aprobado_asignacion_por) REFERENCES catalogos.usuarios(id) ON DELETE SET NULL;
    `);

    // === 4. modalidad_id sin FK a catalogos.modalidades_revision ===
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_modalidad;

      ALTER TABLE evaluacion.asignaciones_evaluacion 
      ADD CONSTRAINT FK_asignaciones_evaluacion_modalidad 
      FOREIGN KEY (modalidad_id) REFERENCES catalogos.modalidades_revision(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir Modalidad FK
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_modalidad;
    `);

    // Revertir Asignaciones FKs
    await queryRunner.query(`
      ALTER TABLE evaluacion.asignaciones_evaluacion 
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_asignado_por,
      DROP CONSTRAINT IF EXISTS FK_asignaciones_evaluacion_aprobado_por;
    `);

    // Revertir Versiones FK
    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      DROP CONSTRAINT IF EXISTS FK_versiones_protocolo_tipo_resolucion;
      
      ALTER TABLE public.versiones_protocolo 
      ADD COLUMN tipo_resolucion VARCHAR(50);
    `);

    // Restaurar los datos a tipo_resolucion texto
    await queryRunner.query(`
      UPDATE public.versiones_protocolo p
      SET tipo_resolucion = tr.nombre
      FROM catalogos.tipos_resolucion tr
      WHERE p.tipo_resolucion_id = tr.id;
    `);

    await queryRunner.query(`
      ALTER TABLE public.versiones_protocolo 
      DROP COLUMN IF EXISTS tipo_resolucion_id;
    `);

    // Revertir codigo_ceish
    await queryRunner.query(`
      ALTER TABLE recepcion.recepciones 
      ADD COLUMN codigo_ceish_generado VARCHAR(50);
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones r
      SET codigo_ceish_generado = p.codigo_ceish
      FROM public.protocolos p
      WHERE r.protocolo_id = p.id;
    `);

    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS codigo_ceish;
    `);
  }
}
