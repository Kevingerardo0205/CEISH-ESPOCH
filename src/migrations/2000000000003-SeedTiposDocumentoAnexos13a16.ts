import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-015-N14 — spec-003 RF-17.2 (v1.6.5): anexos de la carta firmada ANEXO_13 a ANEXO_16.
 * Migración de DATOS. Sin cambios de esquema. Reglas:
 * - Solo siembra filas en catalogos.tipos_documento. NO inserta en tipo_documento_estudio: el
 *   checklist del investigador (RequirementsService.calcularRequeridos) lee solo esa relación, así
 *   que estos anexos —cartas de la Secretaría— no aparecen como requisito del investigador.
 * - Columnas obligatorio/condicional en false y tipo_estudio_aplica/condicion_json en NULL.
 * - up es idempotente: WHERE NOT EXISTS por codigo_anexo (no hay UNIQUE sobre esa columna).
 *   La búsqueda incluye filas con eliminado_en, para no duplicar un código borrado lógicamente.
 * - down borra primero las relaciones de esos ids y luego las 4 filas por codigo_anexo.
 */
const ANEXOS_CARTA_FIRMADA: ReadonlyArray<{ code: string; name: string }> = [
  {
    code: 'ANEXO_13',
    name: 'Carta de aprobación definitiva – estudios observacionales/de intervención',
  },
  {
    code: 'ANEXO_14',
    name: 'Carta de aprobación definitiva – ensayo clínico',
  },
  {
    code: 'ANEXO_15',
    name: 'Respuesta de estudio aprobado con condición',
  },
  {
    code: 'ANEXO_16',
    name: 'Respuesta de estudio no aprobado',
  },
];

export class SeedTiposDocumentoAnexos13a162000000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const anexo of ANEXOS_CARTA_FIRMADA) {
      await queryRunner.query(
        `INSERT INTO catalogos.tipos_documento
           (nombre, codigo_anexo, es_obligatorio, es_condicional, condicion_json, tipo_estudio_aplica)
         SELECT $1::varchar, $2::varchar, false, false, NULL::jsonb, NULL::jsonb
          WHERE NOT EXISTS (
            SELECT 1 FROM catalogos.tipos_documento WHERE codigo_anexo = $2::varchar
          )`,
        [anexo.name, anexo.code],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codigos = ANEXOS_CARTA_FIRMADA.map((a) => a.code);
    await queryRunner.query(
      `DELETE FROM catalogos.tipo_documento_estudio
        WHERE tipo_documento_id IN (
          SELECT id FROM catalogos.tipos_documento WHERE codigo_anexo = ANY($1)
        )`,
      [codigos],
    );
    await queryRunner.query(
      `DELETE FROM catalogos.tipos_documento WHERE codigo_anexo = ANY($1)`,
      [codigos],
    );
  }
}
