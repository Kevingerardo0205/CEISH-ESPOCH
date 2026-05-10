import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandInvestigatorProfile1714853000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "catalogos"."perfiles_investigador" 
            ADD "tipo_documento" character varying(50),
            ADD "primer_nombre" character varying(100),
            ADD "segundo_nombre" character varying(100),
            ADD "primer_apellido" character varying(100),
            ADD "segundo_apellido" character varying(100),
            ADD "nacionalidad" character varying(100),
            ADD "foto_ruta" character varying(500),
            ADD "acepta_terminos" boolean NOT NULL DEFAULT false,
            ADD "acepta_reglamento" boolean NOT NULL DEFAULT false;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "catalogos"."perfiles_investigador" 
            DROP COLUMN "acepta_reglamento",
            DROP COLUMN "acepta_terminos",
            DROP COLUMN "foto_ruta",
            DROP COLUMN "nacionalidad",
            DROP COLUMN "segundo_apellido",
            DROP COLUMN "primer_apellido",
            DROP COLUMN "segundo_nombre",
            DROP COLUMN "primer_nombre",
            DROP COLUMN "tipo_documento";
        `);
  }
}
