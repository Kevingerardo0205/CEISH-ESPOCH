import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeerRiskEvaluation1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar la columna nivel_riesgo_confirmado a la tabla public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN nivel_riesgo_confirmado BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // 2. Crear la tabla evaluacion.asignaciones_pares_riesgo
    await queryRunner.query(`
      CREATE TABLE evaluacion.asignaciones_pares_riesgo (
        id SERIAL PRIMARY KEY,
        protocolo_id INT NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
        evaluador_id INT NOT NULL REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
        nivel_riesgo_propuesto_id INT REFERENCES catalogos.niveles_riesgo(id) ON DELETE SET NULL,
        observaciones TEXT,
        fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_envio TIMESTAMP,
        CONSTRAINT uq_protocolo_evaluador UNIQUE (protocolo_id, evaluador_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar la tabla asignaciones_pares_riesgo
    await queryRunner.query(`
      DROP TABLE IF EXISTS evaluacion.asignaciones_pares_riesgo;
    `);

    // 2. Eliminar la columna nivel_riesgo_confirmado de public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS nivel_riesgo_confirmado;
    `);
  }
}
