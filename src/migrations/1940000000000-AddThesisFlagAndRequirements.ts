import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.12 (RF-19.1 v3.7.4, 14/11/2026): bandera de trabajo de titulación (tesis) y sus dos
 * requisitos. Con `es_tesis = true` el checklist suma TESIS_ANTIPLAGIO y TESIS_OFICIO_TUTOR en
 * todos los tipos de estudio (activos o no), por la condición `tesis` de `condiciones_por_tipo`.
 * Los requisitos se identifican por `codigo_anexo` y solo se insertan si no existen; no se
 * modifica ninguna fila existente.
 */
const THESIS_REQUIREMENTS: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'TESIS_ANTIPLAGIO', name: 'Captura del informe antiplagio' },
  { code: 'TESIS_OFICIO_TUTOR', name: 'Oficio o certificado del tutor' },
];

export class AddThesisFlagAndRequirements1940000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.protocolos ADD COLUMN IF NOT EXISTS es_tesis BOOLEAN NOT NULL DEFAULT FALSE`,
    );

    const studyTypes = (await queryRunner.query(
      `SELECT id, codigo FROM catalogos.tipos_estudio ORDER BY id`,
    )) as Array<{ id: number; codigo: string }>;
    const codes = studyTypes.map((st) => st.codigo);
    const condition = {
      condiciones_por_tipo: Object.fromEntries(
        codes.map((code) => [code, ['tesis']]),
      ),
    };

    for (const req of THESIS_REQUIREMENTS) {
      const existing = (await queryRunner.query(
        `SELECT id FROM catalogos.tipos_documento WHERE codigo_anexo = $1`,
        [req.code],
      )) as Array<{ id: number }>;
      if (existing.length > 0) continue;

      const inserted = (await queryRunner.query(
        `INSERT INTO catalogos.tipos_documento
           (nombre, codigo_anexo, es_obligatorio, es_condicional, condicion_json, tipo_estudio_aplica)
         VALUES ($1, $2, true, true, $3::jsonb, $4::jsonb)
         RETURNING id`,
        [req.name, req.code, JSON.stringify(condition), JSON.stringify(codes)],
      )) as Array<{ id: number }>;
      const documentTypeId = inserted[0].id;

      for (const st of studyTypes) {
        await queryRunner.query(
          `INSERT INTO catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio)
           VALUES ($1, $2, true)
           ON CONFLICT (tipo_documento_id, tipo_estudio_id) DO NOTHING`,
          [documentTypeId, st.id],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = THESIS_REQUIREMENTS.map((r) => r.code);
    await queryRunner.query(
      `DELETE FROM catalogos.tipo_documento_estudio
        WHERE tipo_documento_id IN (SELECT id FROM catalogos.tipos_documento WHERE codigo_anexo = ANY($1))`,
      [codes],
    );
    await queryRunner.query(
      `DELETE FROM catalogos.tipos_documento WHERE codigo_anexo = ANY($1)`,
      [codes],
    );
    await queryRunner.query(
      `ALTER TABLE public.protocolos DROP COLUMN IF EXISTS es_tesis`,
    );
  }
}
