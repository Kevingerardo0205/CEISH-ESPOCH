import { MigrationInterface, QueryRunner } from 'typeorm';

const SEEDED_KEYS = [
  'plazo_subsanacion_documental_dias',
  'plazo_revision_oficio_dias',
  'entrega_evaluacion_dias_habiles_tras_reunion',
  'evaluador_urgente_umbral_dias',
] as const;

export class CreateSystemParamsTable1820000000000 implements MigrationInterface {
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
        ('plazo_subsanacion_documental_dias',          '30', 'INTEGER', 'RF-07.1/RF-13: días hábiles para subsanar documentación incompleta'),
        ('plazo_revision_oficio_dias',                  '8', 'INTEGER', 'RF-12.7(c): días hábiles mínimos de revisión antes de la reunión (advertencia no bloqueante)'),
        ('entrega_evaluacion_dias_habiles_tras_reunion','2',  'INTEGER', 'RF-09.1: días hábiles tras reunión para entregar evaluación'),
        ('evaluador_urgente_umbral_dias',               '2',  'INTEGER', 'RF-09.1: umbral de días restantes para marcar asignación como urgente')
      ON CONFLICT (clave) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const keys = SEEDED_KEYS.map((k) => `'${k}'`).join(', ');
    await queryRunner.query(
      `DELETE FROM sistema.parametros_sistema WHERE clave IN (${keys})`,
    );
  }
}
