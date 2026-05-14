import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemCodesToCatalogos1778535605589 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Añadir columna codigo a catalogos.roles
    await queryRunner.query(
      `ALTER TABLE catalogos.roles ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE`,
    );
    await queryRunner.query(
      `UPDATE catalogos.roles SET codigo = UPPER(nombre)`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.roles ALTER COLUMN codigo SET NOT NULL`,
    );

    // 2. Añadir columna codigo a catalogos.permisos
    await queryRunner.query(
      `ALTER TABLE catalogos.permisos ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) UNIQUE`,
    );
    // Mapear nombres actuales a códigos estandarizados (limpiando puntos y espacios)
    await queryRunner.query(
      `UPDATE catalogos.permisos SET codigo = UPPER(REPLACE(nombre, '.', '_'))`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.permisos ALTER COLUMN codigo SET NOT NULL`,
    );

    // 3. Añadir columna codigo a catalogos.estados
    await queryRunner.query(
      `ALTER TABLE catalogos.estados ADD COLUMN IF NOT EXISTS codigo VARCHAR(30) UNIQUE`,
    );
    await queryRunner.query(
      `UPDATE catalogos.estados SET codigo = UPPER(nombre)`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.estados ALTER COLUMN codigo SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE catalogos.estados DROP COLUMN IF EXISTS codigo`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.permisos DROP COLUMN IF EXISTS codigo`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.roles DROP COLUMN IF EXISTS codigo`,
    );
  }
}
