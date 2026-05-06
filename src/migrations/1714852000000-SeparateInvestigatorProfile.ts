import { MigrationInterface, QueryRunner } from "typeorm";

export class SeparateInvestigatorProfile1714852000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear la tabla de perfiles_investigador
        await queryRunner.query(`
            CREATE TABLE "catalogos"."perfiles_investigador" (
                "id" SERIAL PRIMARY KEY,
                "creado_en" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                "actualizado_en" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                "eliminado_en" TIMESTAMP WITH TIME ZONE,
                "usuario_id" integer NOT NULL UNIQUE,
                "email_personal" character varying(255),
                "telefono" character varying(255),
                "institucion_pertenece" character varying(200),
                "cargo" character varying(100),
                "registro_senescyt" character varying(50),
                CONSTRAINT "fk_perfil_usuario" FOREIGN KEY ("usuario_id") REFERENCES "catalogos"."usuarios"("id") ON DELETE CASCADE
            )
        `);

        // 2. Mover datos existentes de la tabla usuarios a perfiles_investigador
        // Solo para usuarios que tienen datos de investigador (ej: registro_senescyt o institucion)
        await queryRunner.query(`
            INSERT INTO "catalogos"."perfiles_investigador" (
                "usuario_id", "email_personal", "telefono", "institucion_pertenece", "cargo", "registro_senescyt"
            )
            SELECT 
                "id", "email_personal", "telefono", "institucion_pertenece", "cargo", "registro_senescyt"
            FROM "catalogos"."usuarios"
            WHERE "registro_senescyt" IS NOT NULL OR "institucion_pertenece" IS NOT NULL;
        `);

        // 3. Eliminar las columnas redundantes de la tabla usuarios
        await queryRunner.query(`
            ALTER TABLE "catalogos"."usuarios" 
            DROP COLUMN "email_personal",
            DROP COLUMN "telefono",
            DROP COLUMN "institucion_pertenece",
            DROP COLUMN "cargo",
            DROP COLUMN "registro_senescyt";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Volver a agregar las columnas a usuarios
        await queryRunner.query(`
            ALTER TABLE "catalogos"."usuarios" 
            ADD "email_personal" character varying(255),
            ADD "telefono" character varying(255),
            ADD "institucion_pertenece" character varying(200),
            ADD "cargo" character varying(100),
            ADD "registro_senescyt" character varying(50);
        `);

        // 2. Regresar los datos de perfiles_investigador a usuarios
        await queryRunner.query(`
            UPDATE "catalogos"."usuarios" u
            SET 
                "email_personal" = p."email_personal",
                "telefono" = p."telefono",
                "institucion_pertenece" = p."institucion_pertenece",
                "cargo" = p."cargo",
                "registro_senescyt" = p."registro_senescyt"
            FROM "catalogos"."perfiles_investigador" p
            WHERE u."id" = p."usuario_id";
        `);

        // 3. Eliminar la tabla de perfiles
        await queryRunner.query(`DROP TABLE "catalogos"."perfiles_investigador"`);
    }

}
