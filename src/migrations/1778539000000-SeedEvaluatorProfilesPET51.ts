import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEvaluatorProfilesPET511778539000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Limpiar perfiles previos si existen (basado en nombre para no romper IDs si ya se usan)
    await queryRunner.query(
      `DELETE FROM catalogos.perfiles_evaluador WHERE nombre IN ('JURÍDICO', 'SALUD', 'METODOLOGÍA', 'BIOÉTICA', 'SOCIEDAD CIVIL')`,
    );

    // 2. Insertar los 5 perfiles obligatorios del PET 5.1
    await queryRunner.query(`
      INSERT INTO catalogos.perfiles_evaluador (nombre, descripcion, orden_prioridad, activo) VALUES 
      ('JURÍDICO', 'Profesional del área legal encargado de la revisión de normativas y leyes vigentes.', 1, true),
      ('SALUD', 'Profesional con experiencia clínica o en salud pública.', 2, true),
      ('METODOLOGÍA', 'Experto en metodología de la investigación y diseño estadístico.', 3, true),
      ('BIOÉTICA', 'Profesional con formación específica en ética de la investigación y bioética.', 4, true),
      ('SOCIEDAD CIVIL', 'Representante de la comunidad o sociedad civil sin afiliación institucional.', 5, true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM catalogos.perfiles_evaluador WHERE nombre IN ('JURÍDICO', 'SALUD', 'METODOLOGÍA', 'BIOÉTICA', 'SOCIEDAD CIVIL')`,
    );
  }
}
