import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateDatabaseStructure1778930000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columna de texto obsoleta 'version' de public.protocolos de forma segura
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS version CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar columna de texto 'version' si es necesario revertir
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0';
    `);
  }
}
