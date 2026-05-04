import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationAndResetFields1714752000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "catalogos"."usuarios" 
            ADD "email_verificado" boolean NOT NULL DEFAULT false,
            ADD "token_confirmacion_hash" character varying(255),
            ADD "token_recuperacion_hash" character varying(255),
            ADD "token_recuperacion_expira" TIMESTAMP WITH TIME ZONE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "catalogos"."usuarios" 
            DROP COLUMN "token_recuperacion_expira",
            DROP COLUMN "token_recuperacion_hash",
            DROP COLUMN "token_confirmacion_hash",
            DROP COLUMN "email_verificado";
        `);
    }

}
