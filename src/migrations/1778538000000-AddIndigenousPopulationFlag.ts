import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndigenousPopulationFlag1778538000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN IF NOT EXISTS poblacion_indigena BOOLEAN DEFAULT FALSE;
    `);

    // También actualizamos el catálogo de permisos por si acaso (aunque ya lo hicimos en la migración anterior,
    // es bueno asegurar que el código de permiso exista para el checklist)
    const checkPermiso = await queryRunner.query(`
      SELECT id FROM catalogos.permisos WHERE codigo = 'TRADUCCION_ANCESTRAL'
    `);

    if (checkPermiso.length === 0) {
      await queryRunner.query(`
        INSERT INTO catalogos.permisos (nombre, codigo, modulo_id) 
        VALUES ('Traducción a idiomas ancestrales', 'TRADUCCION_ANCESTRAL', (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_RECEPCION'))
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.protocolos DROP COLUMN IF EXISTS poblacion_indigena`,
    );
  }
}
