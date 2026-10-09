import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreatePropuestasRiesgoTable1810000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        schema: 'evaluacion',
        name: 'propuestas_riesgo',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'asignacion_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'nivel_riesgo_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ruta_informe_pdf',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ronda',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'es_vigente',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'fecha_propuesta',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Clave foránea a asignaciones_evaluacion con ON DELETE RESTRICT
    await queryRunner.createForeignKey(
      'evaluacion.propuestas_riesgo',
      new TableForeignKey({
        columnNames: ['asignacion_id'],
        referencedSchema: 'evaluacion',
        referencedTableName: 'asignaciones_evaluacion',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Clave foránea a niveles_riesgo con ON DELETE RESTRICT
    await queryRunner.createForeignKey(
      'evaluacion.propuestas_riesgo',
      new TableForeignKey({
        columnNames: ['nivel_riesgo_id'],
        referencedSchema: 'catalogos',
        referencedTableName: 'niveles_riesgo',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Restricción UNIQUE (asignacion_id, ronda)
    await queryRunner.createUniqueConstraint(
      'evaluacion.propuestas_riesgo',
      new TableUnique({
        name: 'uq_propuestas_riesgo_asignacion_ronda',
        columnNames: ['asignacion_id', 'ronda'],
      }),
    );

    // Índice único parcial para asignacion_id WHERE es_vigente = true
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_propuestas_riesgo_asignacion_vigente 
      ON evaluacion.propuestas_riesgo (asignacion_id) 
      WHERE es_vigente = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS evaluacion.uq_propuestas_riesgo_asignacion_vigente;
    `);
    await queryRunner.dropTable(
      'evaluacion.propuestas_riesgo',
      true,
      true,
      true,
    );
  }
}
