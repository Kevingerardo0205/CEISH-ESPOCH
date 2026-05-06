import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePhotoPathFromInvestigatorProfile1714854000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "catalogos"."perfiles_investigador" 
            DROP COLUMN "foto_ruta";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "catalogos"."perfiles_investigador" 
            ADD "foto_ruta" character varying(500);
        `);
    }

}
