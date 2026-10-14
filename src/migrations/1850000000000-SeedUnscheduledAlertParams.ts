// MIGRATION_CONFIRM_DB: verifica que sistema.parametros_sistema existe antes de ejecutar.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedUnscheduledAlertParams1850000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: { exists: boolean }[] = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'sistema' AND table_name = 'parametros_sistema'
      ) AS exists
    `);
    if (!result[0].exists) {
      throw new Error(
        'La tabla sistema.parametros_sistema no existe. Aplica script.sql primero.',
      );
    }
    await queryRunner.query(`
      INSERT INTO sistema.parametros_sistema (clave, valor, tipo_dato, descripcion) VALUES
        ('dias_max_sin_convocatoria',              '8', 'INTEGER', 'RF-12.7(d): días hábiles máximos desde la asignación activa más antigua sin convocatoria antes de alertar'),
        ('dias_alerta_normativo_sin_convocatoria', '5', 'INTEGER', 'RF-12.7(d): días hábiles restantes de plazo normativo que activan la alerta (provisional, confirmar con secretaría)')
      ON CONFLICT (clave) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM sistema.parametros_sistema
      WHERE clave IN ('dias_max_sin_convocatoria', 'dias_alerta_normativo_sin_convocatoria')
    `);
  }
}
