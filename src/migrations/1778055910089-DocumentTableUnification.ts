import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentTableUnification1778055910089 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Asegurar campos en recepcion.documentos
    await queryRunner.query(`
            ALTER TABLE recepcion.documentos 
            ADD COLUMN IF NOT EXISTS tipo_documento_id INTEGER REFERENCES catalogos.tipos_documento(id);
        `);

    // 2. Migración de datos (si existe la tabla public.documentos)
    // Usamos EXECUTE para evitar errores de parseo si la tabla no existe o tiene columnas diferentes
    await queryRunner.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documentos') THEN
                    EXECUTE 'INSERT INTO recepcion.documentos (protocolo_id, nombre_archivo, ruta, creado_en)
                             SELECT protocolo_id, nombre_archivo, ruta_almacenamiento, creado_en FROM public.documentos
                             ON CONFLICT DO NOTHING';
                END IF;
            END $$;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE recepcion.documentos DROP COLUMN IF EXISTS tipo_documento_id;
        `);
  }
}
