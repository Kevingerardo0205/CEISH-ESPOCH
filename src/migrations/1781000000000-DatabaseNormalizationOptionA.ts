import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseNormalizationOptionA1781000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Asegurar integridad migrando datos de public.protocolos a recepcion.recepciones si no existen o faltan
    await queryRunner.query(`
      INSERT INTO recepcion.recepciones (
        protocolo_id, fecha_recepcion, estado_id, lista_faltantes, 
        fecha_limite_completar, constancia_emitida, fecha_constancia, codigo_ceish_generado
      )
      SELECT 
          p.id as protocolo_id,
          COALESCE(p.fecha_recepcion, NOW()) as fecha_recepcion,
          CASE 
              WHEN p.estado_recepcion::text = 'COMPLETO' THEN 2
              WHEN p.estado_recepcion::text = 'INCOMPLETO' THEN 3
              WHEN p.estado_recepcion::text = 'EN_REVISION_SECRETARIA' THEN 5
              WHEN p.estado_recepcion::text = 'ARCHIVADO' THEN 4
              ELSE 1
          END as estado_id,
          p.requisitos_faltantes as lista_faltantes,
          p.fecha_limite_subsanacion as fecha_limite_completar,
          p.certificado_recepcion_emitido as constancia_emitida,
          p.fecha_emision_certificado as fecha_constancia,
          p.codigo_ceish as codigo_ceish_generado
      FROM public.protocolos p
      LEFT JOIN recepcion.recepciones r ON p.id = r.protocolo_id
      WHERE r.id IS NULL AND (p.fecha_recepcion IS NOT NULL OR p.codigo_ceish IS NOT NULL OR p.estado_recepcion IS NOT NULL);
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones r
      SET 
          codigo_ceish_generado = COALESCE(r.codigo_ceish_generado, p.codigo_ceish),
          fecha_recepcion = COALESCE(r.fecha_recepcion, p.fecha_recepcion),
          lista_faltantes = COALESCE(r.lista_faltantes, p.requisitos_faltantes),
          fecha_limite_completar = COALESCE(r.fecha_limite_completar, p.fecha_limite_subsanacion),
          constancia_emitida = COALESCE(r.constancia_emitida, p.certificado_recepcion_emitido),
          fecha_constancia = COALESCE(r.fecha_constancia, p.fecha_emision_certificado),
          estado_id = COALESCE(r.estado_id, 
              CASE 
                  WHEN p.estado_recepcion::text = 'COMPLETO' THEN 2
                  WHEN p.estado_recepcion::text = 'INCOMPLETO' THEN 3
                  WHEN p.estado_recepcion::text = 'EN_REVISION_SECRETARIA' THEN 5
                  WHEN p.estado_recepcion::text = 'ARCHIVADO' THEN 4
                  ELSE r.estado_id
              END
          )
      FROM public.protocolos p
      WHERE r.protocolo_id = p.id;
    `);

    // 2. Eliminar el trigger anterior que dependía de la columna estado_recepcion
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_generate_ceish_code ON public.protocolos CASCADE;
      DROP FUNCTION IF EXISTS public.trg_assign_ceish_code() CASCADE;
    `);

    // 3. Actualizar la función para que lea de la tabla de recepciones en vez de protocolos
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
                      SELECT COALESCE(MAX(CAST(split_part(codigo_ceish_generado, '-', 4) AS INTEGER)), 0) + 1 
                      INTO v_secuencial
                      FROM recepcion.recepciones 
                      WHERE codigo_ceish_generado LIKE 'CEISH-ESPOCH-' || v_tipo_sigla || '-%-' || p_year;

                      v_nuevo_codigo := 'CEISH-ESPOCH-' || v_tipo_sigla || '-' || LPAD(v_secuencial::text, 3, '0') || '-' || p_year;
                      
                      RETURN v_nuevo_codigo;
                  END;
                  $$;
    `);

    // 4. Eliminar las columnas redundantes de public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS codigo_ceish CASCADE,
      DROP COLUMN IF EXISTS fecha_recepcion CASCADE,
      DROP COLUMN IF EXISTS estado_recepcion CASCADE,
      DROP COLUMN IF EXISTS requisitos_faltantes CASCADE,
      DROP COLUMN IF EXISTS fecha_limite_subsanacion CASCADE,
      DROP COLUMN IF EXISTS fecha_limite_respuesta CASCADE,
      DROP COLUMN IF EXISTS notificado_presidente CASCADE,
      DROP COLUMN IF EXISTS fecha_notificacion_presidente CASCADE,
      DROP COLUMN IF EXISTS notificado_investigador CASCADE,
      DROP COLUMN IF EXISTS fecha_notificacion_investigador CASCADE,
      DROP COLUMN IF EXISTS certificado_recepcion_emitido CASCADE,
      DROP COLUMN IF EXISTS fecha_emision_certificado CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columnas eliminadas de vuelta a public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN codigo_ceish VARCHAR(50) UNIQUE,
      ADD COLUMN fecha_recepcion TIMESTAMP,
      ADD COLUMN estado_recepcion VARCHAR(50) DEFAULT 'PENDIENTE_SUBSANACION',
      ADD COLUMN requisitos_faltantes TEXT,
      ADD COLUMN fecha_limite_subsanacion TIMESTAMP,
      ADD COLUMN fecha_limite_respuesta TIMESTAMP,
      ADD COLUMN notificado_presidente BOOLEAN DEFAULT FALSE,
      ADD COLUMN fecha_notificacion_presidente TIMESTAMP,
      ADD COLUMN notificado_investigador BOOLEAN DEFAULT FALSE,
      ADD COLUMN fecha_notificacion_investigador TIMESTAMP,
      ADD COLUMN certificado_recepcion_emitido BOOLEAN DEFAULT FALSE,
      ADD COLUMN fecha_emision_certificado TIMESTAMP;
    `);

    // 2. Copiar los datos de vuelta de recepciones a protocolos
    await queryRunner.query(`
      UPDATE public.protocolos p
      SET 
          codigo_ceish = r.codigo_ceish_generado,
          fecha_recepcion = r.receptionDate,
          requisitos_faltantes = r.lista_faltantes,
          fecha_limite_subsanacion = r.fecha_limite_completar,
          certificado_recepcion_emitido = r.constancia_emitida,
          fecha_emision_certificado = r.fecha_constancia,
          estado_recepcion = CASE 
              WHEN r.estado_id = 2 THEN 'COMPLETO'
              WHEN r.estado_id = 3 THEN 'INCOMPLETO'
              WHEN r.estado_id = 5 THEN 'EN_REVISION_SECRETARIA'
              WHEN r.estado_id = 4 THEN 'ARCHIVADO'
              ELSE 'PENDIENTE_SUBSANACION'
          END
      FROM recepcion.recepciones r
      WHERE p.id = r.protocolo_id;
    `);

    // 3. Restaurar la función generate_codigo_ceish para que lea de protocolos
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

    // 4. Restaurar el trigger y la función original
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.trg_assign_ceish_code() RETURNS trigger
          LANGUAGE plpgsql
          AS $$
                  BEGIN
                      IF NEW.estado_recepcion = 'COMPLETO' AND (OLD.estado_recepcion IS NULL OR OLD.estado_recepcion != 'COMPLETO') AND NEW.codigo_ceish IS NULL THEN
                          NEW.codigo_ceish := catalogos.generate_codigo_ceish(NEW.tipo_estudio_id, EXTRACT(YEAR FROM CURRENT_DATE)::int);
                      END IF;
                      RETURN NEW;
                  END;
                  $$;

      CREATE TRIGGER trigger_generate_ceish_code 
      BEFORE UPDATE ON public.protocolos 
      FOR EACH ROW 
      EXECUTE FUNCTION public.trg_assign_ceish_code();
    `);
  }
}
