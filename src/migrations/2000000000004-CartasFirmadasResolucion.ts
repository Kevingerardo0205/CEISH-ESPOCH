import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-015-N09 — spec-003 RF-17.2, RF-17.4 (v1.6.6). Migración de ESQUEMA ADITIVA.
 * Crea resolucion.cartas_firmadas: una fila por versión de la carta firmada por convocatoria-protocolo.
 * No modifica resolucion.resoluciones ni ninguna otra tabla.
 * - numero_version independiente por convocatoria-protocolo (UNIQUE).
 * - Como máximo una fila vigente por convocatoria-protocolo (índice parcial).
 * - Motivo obligatorio desde la versión 2 (reemplazo).
 * - Resultado y anexo deben corresponder (APROBADO_DEFINITIVO → 13 o 14; APROBADO_CON_CONDICION → 15;
 *   NO_APROBADO → 16).
 * - clave_archivo única.
 * down elimina la tabla (solo en ceish_test_db durante la verificación; sin datos de producción).
 */
export class CartasFirmadasResolucion2000000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE resolucion.cartas_firmadas (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        convocatoria_protocolo_id uuid NOT NULL
          REFERENCES evaluacion.convocatoria_protocolos(id) ON DELETE RESTRICT,
        protocolo_id integer NOT NULL REFERENCES public.protocolos(id),
        version_id integer NOT NULL REFERENCES public.versiones_protocolo(id),
        numero_version integer NOT NULL CHECK (numero_version >= 1),
        resultado varchar(30) NOT NULL CHECK (
          resultado IN ('APROBADO_DEFINITIVO', 'APROBADO_CON_CONDICION', 'NO_APROBADO')
        ),
        anexo_codigo varchar(50) NOT NULL CHECK (
          anexo_codigo IN ('ANEXO_13', 'ANEXO_14', 'ANEXO_15', 'ANEXO_16')
        ),
        clave_archivo varchar(500) NOT NULL,
        vigente boolean NOT NULL DEFAULT true,
        motivo_reemplazo text NULL,
        subido_por integer NOT NULL REFERENCES catalogos.usuarios(id),
        subido_en timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_cartas_firmadas_version
          UNIQUE (convocatoria_protocolo_id, numero_version),
        CONSTRAINT uq_cartas_firmadas_clave_archivo
          UNIQUE (clave_archivo),
        CONSTRAINT ck_cartas_motivo CHECK (
          numero_version = 1
          OR (motivo_reemplazo IS NOT NULL AND btrim(motivo_reemplazo) <> '')
        ),
        CONSTRAINT ck_cartas_resultado_anexo CHECK (
          (resultado = 'APROBADO_DEFINITIVO' AND anexo_codigo IN ('ANEXO_13', 'ANEXO_14'))
          OR (resultado = 'APROBADO_CON_CONDICION' AND anexo_codigo = 'ANEXO_15')
          OR (resultado = 'NO_APROBADO' AND anexo_codigo = 'ANEXO_16')
        )
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_cartas_firmadas_vigente
        ON resolucion.cartas_firmadas (convocatoria_protocolo_id)
        WHERE vigente
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS resolucion.cartas_firmadas`);
  }
}
