import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseNormalizationOptionAVersions1783000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Asegurar integridad creando registros de versión inicial (1) en versiones_protocolo
    // para cualquier protocolo que no los tenga ya.
    await queryRunner.query(`
      INSERT INTO public.versiones_protocolo (protocolo_id, numero_version, estado_id, fecha_envio, plazo_subsanacion_dias)
      SELECT 
          p.id as protocolo_id,
          COALESCE(p.version_actual, 1) as numero_version,
          1 as estado_id,
          p.creado_en as fecha_envio,
          30 as plazo_subsanacion_dias
      FROM public.protocolos p
      LEFT JOIN public.versiones_protocolo vp ON p.id = vp.protocolo_id
      WHERE vp.id IS NULL;
    `);

    // 2. Eliminar la columna redundante version_actual de public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS version_actual CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar de vuelta la columna version_actual
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN version_actual INT NOT NULL DEFAULT 1;
    `);

    // 2. Repopular la columna con el máximo número de versión registrado en el historial
    await queryRunner.query(`
      UPDATE public.protocolos p
      SET version_actual = COALESCE((
          SELECT MAX(numero_version) 
          FROM public.versiones_protocolo vp 
          WHERE vp.protocolo_id = p.id
      ), 1);
    `);
  }
}
