import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConvocatoriaDeliveryParams1840000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: { exists: boolean }[] = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'evaluacion' AND table_name = 'convocatorias'
      ) AS exists
    `);
    if (!result[0].exists) {
      throw new Error(
        'La tabla evaluacion.convocatorias no existe. Aplica script.sql primero.',
      );
    }
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatorias
        ADD COLUMN IF NOT EXISTS entrega_evaluacion_dias_habiles_tras_reunion INTEGER NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS entrega_evaluacion_hora_corte VARCHAR(5) NOT NULL DEFAULT '12:00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatorias
        DROP COLUMN IF EXISTS entrega_evaluacion_dias_habiles_tras_reunion,
        DROP COLUMN IF EXISTS entrega_evaluacion_hora_corte
    `);
  }
}
