import { MigrationInterface, QueryRunner } from 'typeorm';

export class CeishCodeAutomation1778055855774 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. UNIQUE Parcial y CHECK Condicional
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_codigo_ceish_unique 
            ON public.protocolos(codigo_ceish) 
            WHERE codigo_ceish IS NOT NULL;

            ALTER TABLE public.protocolos 
            ADD CONSTRAINT chk_codigo_ceish_completo 
            CHECK ( (estado_recepcion != 'COMPLETO') OR (codigo_ceish IS NOT NULL) );
        `);

    // 2. Función Generadora de Código
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION catalogos.generate_codigo_ceish(p_tipo_id int, p_year int) 
            RETURNS varchar AS $$
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
            $$ LANGUAGE plpgsql;
        `);

    // 3. Trigger
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.trg_assign_ceish_code()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.estado_recepcion = 'COMPLETO' AND (OLD.estado_recepcion IS NULL OR OLD.estado_recepcion != 'COMPLETO') AND NEW.codigo_ceish IS NULL THEN
                    NEW.codigo_ceish := catalogos.generate_codigo_ceish(NEW.tipo_estudio_id, EXTRACT(YEAR FROM CURRENT_DATE)::int);
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trigger_generate_ceish_code ON public.protocolos;
            CREATE TRIGGER trigger_generate_ceish_code
            BEFORE UPDATE ON public.protocolos
            FOR EACH ROW
            EXECUTE FUNCTION public.trg_assign_ceish_code();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_generate_ceish_code ON public.protocolos;
            DROP FUNCTION IF EXISTS public.trg_assign_ceish_code();
            DROP FUNCTION IF EXISTS catalogos.generate_codigo_ceish(int, int);
            ALTER TABLE public.protocolos DROP CONSTRAINT IF EXISTS chk_codigo_ceish_completo;
            DROP INDEX IF EXISTS public.idx_codigo_ceish_unique;
        `);
  }
}
