import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProtocolsCoreRefactor1778055836405 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.protocolos 
            -- E2: Declaración Jurada
            ADD COLUMN IF NOT EXISTS declaracion_no_iniciado BOOLEAN DEFAULT FALSE NOT NULL,
            ADD COLUMN IF NOT EXISTS fecha_declaracion_no_iniciado TIMESTAMP WITHOUT TIME ZONE,
            ADD COLUMN IF NOT EXISTS ip_declaracion_no_iniciado VARCHAR(45),
            
            -- E5: Datos del Patrocinador
            ADD COLUMN IF NOT EXISTS patrocinador_ruc VARCHAR(20),
            ADD COLUMN IF NOT EXISTS patrocinador_telefono_institucional VARCHAR(30),
            ADD COLUMN IF NOT EXISTS patrocinador_direccion VARCHAR(500),
            ADD COLUMN IF NOT EXISTS patrocinador_pagina_web VARCHAR(200),
            ADD COLUMN IF NOT EXISTS patrocinador_organo_ejecutor VARCHAR(200);

            -- E7: Asegurar flags de estudio (si no existen)
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='protocolos' AND column_name='tiene_instituciones_externas') THEN
                    ALTER TABLE public.protocolos ADD COLUMN tiene_instituciones_externas BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.protocolos 
            DROP COLUMN IF EXISTS declaracion_no_iniciado,
            DROP COLUMN IF EXISTS fecha_declaracion_no_iniciado,
            DROP COLUMN IF EXISTS ip_declaracion_no_iniciado,
            DROP COLUMN IF EXISTS patrocinador_ruc,
            DROP COLUMN IF EXISTS patrocinador_telefono_institucional,
            DROP COLUMN IF EXISTS patrocinador_direccion,
            DROP COLUMN IF EXISTS patrocinador_pagina_web,
            DROP COLUMN IF EXISTS patrocinador_organo_ejecutor,
            DROP COLUMN IF EXISTS tiene_instituciones_externas;
        `);
  }
}
