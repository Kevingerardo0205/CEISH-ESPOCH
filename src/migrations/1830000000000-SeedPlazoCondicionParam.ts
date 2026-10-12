import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlazoCondicionParam1830000000000 implements MigrationInterface {
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
        ('plazo_condicion_dias', '30', 'INTEGER', 'RF-14.1: días hábiles para subsanar tras APROBADO_CON_CONDICIONES')
      ON CONFLICT (clave) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM sistema.parametros_sistema WHERE clave = 'plazo_condicion_dias'`,
    );
  }
}
