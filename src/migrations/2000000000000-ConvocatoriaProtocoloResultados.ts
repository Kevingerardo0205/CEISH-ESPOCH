import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-015-N08 — spec-003 v1.6.2 RF-17.1: resultado del pleno por protocolo.
 *
 * Migración de ESQUEMA aditiva (no toca datos existentes):
 * - evaluacion.convocatoria_protocolos: columnas del valor vigente del resultado
 *   (dictamen_motivo, dictamen_observaciones, dictamen_registrado_por con FK a
 *   catalogos.usuarios.id, dictamen_registrado_en) y CHECK sobre dictamen_resultado
 *   (tres valores o NULL), motivo para NO_APROBADO y observaciones para
 *   APROBADO_CON_CONDICION. Las filas actuales tienen dictamen_resultado NULL
 *   (verificado en ceish_db y ceish_test_db), así que los CHECK no fallan.
 * - evaluacion.convocatoria_protocolo_resultados: historial. Cada registro o
 *   corrección inserta una fila; la aplicación nunca hace UPDATE ni DELETE.
 *   Las FK usan ON DELETE RESTRICT: el historial no se borra en cascada.
 *
 * down() deshace solo lo creado aquí: la tabla de historial, las constraints y las
 * columnas nuevas. No toca otras tablas.
 */
export class ConvocatoriaProtocoloResultados2000000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
        ADD COLUMN IF NOT EXISTS dictamen_motivo TEXT NULL,
        ADD COLUMN IF NOT EXISTS dictamen_observaciones TEXT NULL,
        ADD COLUMN IF NOT EXISTS dictamen_registrado_por INTEGER NULL,
        ADD COLUMN IF NOT EXISTS dictamen_registrado_en TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
        ADD CONSTRAINT fk_cp_dictamen_registrado_por
          FOREIGN KEY (dictamen_registrado_por) REFERENCES catalogos.usuarios(id),
        ADD CONSTRAINT ck_cp_dictamen_resultado CHECK (
          dictamen_resultado IS NULL
          OR dictamen_resultado IN ('APROBADO_DEFINITIVO', 'APROBADO_CON_CONDICION', 'NO_APROBADO')
        ),
        ADD CONSTRAINT ck_cp_dictamen_motivo CHECK (
          dictamen_resultado IS DISTINCT FROM 'NO_APROBADO'
          OR (dictamen_motivo IS NOT NULL AND btrim(dictamen_motivo) <> '')
        ),
        ADD CONSTRAINT ck_cp_dictamen_observaciones CHECK (
          dictamen_resultado IS DISTINCT FROM 'APROBADO_CON_CONDICION'
          OR (dictamen_observaciones IS NOT NULL AND btrim(dictamen_observaciones) <> '')
        )
    `);

    await queryRunner.query(`
      CREATE TABLE evaluacion.convocatoria_protocolo_resultados (
        id BIGSERIAL PRIMARY KEY,
        convocatoria_protocolo_id UUID NOT NULL
          REFERENCES evaluacion.convocatoria_protocolos(id) ON DELETE RESTRICT,
        resultado VARCHAR NOT NULL,
        motivo TEXT NULL,
        observaciones TEXT NULL,
        motivo_correccion TEXT NULL,
        registrado_por INTEGER NOT NULL REFERENCES catalogos.usuarios(id) ON DELETE RESTRICT,
        registrado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT ck_cpr_resultado CHECK (
          resultado IN ('APROBADO_DEFINITIVO', 'APROBADO_CON_CONDICION', 'NO_APROBADO')
        ),
        CONSTRAINT ck_cpr_motivo CHECK (
          resultado <> 'NO_APROBADO' OR (motivo IS NOT NULL AND btrim(motivo) <> '')
        ),
        CONSTRAINT ck_cpr_observaciones CHECK (
          resultado <> 'APROBADO_CON_CONDICION'
          OR (observaciones IS NOT NULL AND btrim(observaciones) <> '')
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_cpr_cp_registrado
        ON evaluacion.convocatoria_protocolo_resultados (convocatoria_protocolo_id, registrado_en)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS evaluacion.convocatoria_protocolo_resultados`,
    );

    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
        DROP CONSTRAINT IF EXISTS ck_cp_dictamen_observaciones,
        DROP CONSTRAINT IF EXISTS ck_cp_dictamen_motivo,
        DROP CONSTRAINT IF EXISTS ck_cp_dictamen_resultado,
        DROP CONSTRAINT IF EXISTS fk_cp_dictamen_registrado_por,
        DROP COLUMN IF EXISTS dictamen_registrado_en,
        DROP COLUMN IF EXISTS dictamen_registrado_por,
        DROP COLUMN IF EXISTS dictamen_observaciones,
        DROP COLUMN IF EXISTS dictamen_motivo
    `);
  }
}
