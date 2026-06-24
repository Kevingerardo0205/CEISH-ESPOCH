import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantSubsanacionesToInvestigator1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Otorgar el permiso EVALUACION_SUBSANACIONES al rol de Investigador (rol_id = 6)
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT 6, id FROM catalogos.permisos WHERE codigo = 'EVALUACION_SUBSANACIONES'
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el permiso
    await queryRunner.query(`
      DELETE FROM catalogos.rol_permisos
      WHERE rol_id = 6 AND permiso_id = (SELECT id FROM catalogos.permisos WHERE codigo = 'EVALUACION_SUBSANACIONES');
    `);
  }
}
