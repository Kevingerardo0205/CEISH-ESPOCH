import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUnusedResolutionBooleanColumns1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar las 3 columnas booleanas no utilizadas de la tabla resolucion.resoluciones
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones DROP COLUMN IF EXISTS firmada_por_presidente;
      ALTER TABLE resolucion.resoluciones DROP COLUMN IF EXISTS firmada_por_secretario;
      ALTER TABLE resolucion.resoluciones DROP COLUMN IF EXISTS firma_electronica_valida;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Restaurar las 3 columnas booleanas con sus respectivos defaults
    await queryRunner.query(`
      ALTER TABLE resolucion.resoluciones ADD COLUMN firmada_por_presidente bool DEFAULT false NOT NULL;
      ALTER TABLE resolucion.resoluciones ADD COLUMN firmada_por_secretario bool DEFAULT false NOT NULL;
      ALTER TABLE resolucion.resoluciones ADD COLUMN firma_electronica_valida bool DEFAULT false NOT NULL;
    `);
  }
}
