import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRedundantVersionColumn1782000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar la columna versión redundante de public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS version CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar de vuelta la columna versión
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN version VARCHAR(20) DEFAULT '1.0';
    `);

    // 2. Poblar la columna con el formato versión_actual.0
    await queryRunner.query(`
      UPDATE public.protocolos 
      SET version = CAST(version_actual AS VARCHAR) || '.0'
      WHERE version_actual IS NOT NULL;
    `);
  }
}
