import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCriteriosEvaluacion1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Limpiar tabla antes de poblarla
    await queryRunner.query(`DELETE FROM catalogos.criterios_evaluacion;`);

    // Insertar los 3 criterios técnicos del PET
    await queryRunner.query(`
      INSERT INTO catalogos.criterios_evaluacion (id, tipo, descripcion) VALUES
      (1, 'EVALUACION ETICA', 'Aspectos éticos y consentimiento informado'),
      (2, 'EVALUACION METODOLOGICA', 'Aspectos metodológicos y validez científica'),
      (3, 'EVALUACION JURIDICA', 'Aspectos jurídicos y viabilidad legal')
      ON CONFLICT (tipo, descripcion) DO UPDATE SET tipo = EXCLUDED.tipo;
    `);

    // Sincronizar secuencia
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.criterios_evaluacion_id_seq', 3, true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM catalogos.criterios_evaluacion WHERE id IN (1, 2, 3);
    `);

    // Sincronizar secuencia
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.criterios_evaluacion_id_seq', 1, false);
    `);
  }
}
