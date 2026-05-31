import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureEvaluatorProfileFKAndSeeds1778920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Garantizar consistencia física de la Clave Foránea (FK)
    await queryRunner.query(`
      ALTER TABLE catalogos.evaluadores_perfil 
      DROP CONSTRAINT IF EXISTS fk_evaluadores_perfil_perfiles_evaluador;
    `);

    await queryRunner.query(`
      ALTER TABLE catalogos.evaluadores_perfil
      ADD CONSTRAINT fk_evaluadores_perfil_perfiles_evaluador
      FOREIGN KEY (perfil_id) REFERENCES catalogos.perfiles_evaluador(id)
      ON DELETE CASCADE;
    `);

    // 2. Insertar / actualizar de manera robusta las semillas maestras en perfiles_evaluador
    await queryRunner.query(`
      INSERT INTO catalogos.perfiles_evaluador (nombre, descripcion, orden_prioridad, activo) VALUES
      ('JURIDICO', 'Asesoría y revisión de aspectos legales del protocolo', 1, true),
      ('SALUD', 'Evaluación metodológica de salud clínica y aspectos médicos', 2, true),
      ('METODOLOGIA', 'Revisión metodológica científica y consistencia estadística', 3, true),
      ('BIOETICA', 'Aspectos puramente bioéticos y resguardo de derechos de participantes', 4, true),
      ('SOCIEDAD_CIVIL', 'Representación comunitaria y perspectiva de la sociedad civil', 5, true)
      ON CONFLICT (nombre) DO UPDATE 
      SET descripcion = EXCLUDED.descripcion, 
          orden_prioridad = EXCLUDED.orden_prioridad, 
          activo = EXCLUDED.activo;
    `);

    // 3. Sincronizar secuencia de autoincremento para evitar conflictos de IDs futuros
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.perfiles_evaluador_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.perfiles_evaluador), 1), true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir restricción FK
    await queryRunner.query(`
      ALTER TABLE catalogos.evaluadores_perfil 
      DROP CONSTRAINT IF EXISTS fk_evaluadores_perfil_perfiles_evaluador;
    `);
  }
}
