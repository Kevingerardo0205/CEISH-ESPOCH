import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.18 (RF-18.1 a, spec v3.7.5, 16/11/2026): relación requisito → plantilla.
 * Columna opcional `catalogos.tipos_documento.codigo_plantilla` con clave foránea a
 * `sistema.plantillas_documentos(codigo)`. Las plantillas se crean sin archivo (la Secretaría
 * lo sube en Configuración). Los requisitos se identifican por `codigo_anexo` (solo filas con
 * `eliminado_en IS NULL`); si un código falta o está repetido, la migración aborta.
 * Guard de la base: el de src/config/typeorm-cli.config.ts (MIGRATION_CONFIRM_DB = DB_NAME).
 */
const REQUIREMENT_TEMPLATES: ReadonlyArray<{
  code: string;
  name: string;
}> = [
  { code: 'ANEXO_1', name: 'Anexo 1 · Solicitud de evaluación' },
  {
    code: 'ANEXO_2',
    name: 'Anexo 2 · Formulario para la presentación del protocolo',
  },
  {
    code: 'ANEXO_3',
    name: 'Anexo 3 · Consideraciones mínimas del consentimiento informado',
  },
  {
    code: 'ANEXO_4',
    name: 'Anexo 4 · Declaración de responsabilidad del investigador principal',
  },
  { code: 'ANEXO_5', name: 'Anexo 5 · Carta de interés institucional' },
  {
    code: 'ANEXO_6',
    name: 'Anexo 6 · Carta de solicitud de evaluación de ensayos clínicos',
  },
  {
    code: 'CONFIDENCIALIDAD',
    name: 'Declaratoria de compromiso de confidencialidad',
  },
  { code: 'CONFLICTO_INTERES', name: 'Declaración de conflicto de interés' },
];

/** `codigo_anexo` del requisito → código de la plantilla. */
const REQUIREMENT_TEMPLATE_LINKS: ReadonlyArray<{
  requirementCode: string;
  templateCode: string;
}> = [
  { requirementCode: 'ANEXO_1', templateCode: 'ANEXO_1' },
  { requirementCode: 'ANEXO_2', templateCode: 'ANEXO_2' },
  { requirementCode: 'ANEXO_4', templateCode: 'ANEXO_4' },
  { requirementCode: 'ANEXO_5', templateCode: 'ANEXO_5' },
  { requirementCode: 'ANEXO_6', templateCode: 'ANEXO_6' },
  { requirementCode: 'CONFIDENCIALIDAD', templateCode: 'CONFIDENCIALIDAD' },
  { requirementCode: 'CONFLICTO_INTERES', templateCode: 'CONFLICTO_INTERES' },
  { requirementCode: 'CONSENTIMIENTO', templateCode: 'ANEXO_3' },
];

const FK_NAME = 'fk_tipos_documento_codigo_plantilla';

export class AddTemplateCodeToRequirements1950000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Validación antes de cualquier cambio: cada código existe exactamente una vez.
    const codes = REQUIREMENT_TEMPLATE_LINKS.map(
      (l) => `'${l.requirementCode}'`,
    ).join(', ');
    await queryRunner.query(`
      DO $$
      DECLARE
        req_code TEXT;
        total INT;
      BEGIN
        FOREACH req_code IN ARRAY ARRAY[${codes}]::TEXT[] LOOP
          SELECT count(*) INTO total
            FROM catalogos.tipos_documento
           WHERE codigo_anexo = req_code AND eliminado_en IS NULL;
          IF total <> 1 THEN
            RAISE EXCEPTION 'TSK-001.18: el requisito con codigo_anexo % aparece % veces (se espera 1)', req_code, total;
          END IF;
        END LOOP;
      END
      $$;
    `);

    // 2. Columna y clave foránea.
    await queryRunner.query(
      `ALTER TABLE catalogos.tipos_documento ADD COLUMN IF NOT EXISTS codigo_plantilla VARCHAR(100) NULL`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${FK_NAME}') THEN
          ALTER TABLE catalogos.tipos_documento
            ADD CONSTRAINT ${FK_NAME} FOREIGN KEY (codigo_plantilla)
            REFERENCES sistema.plantillas_documentos(codigo)
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // 3. Plantillas sin archivo.
    for (const t of REQUIREMENT_TEMPLATES) {
      await queryRunner.query(
        `INSERT INTO sistema.plantillas_documentos (codigo, nombre, ruta_archivo)
         VALUES ($1, $2, NULL)
         ON CONFLICT (codigo) DO NOTHING`,
        [t.code, t.name],
      );
    }

    // 4. Relación por codigo_anexo.
    for (const l of REQUIREMENT_TEMPLATE_LINKS) {
      await queryRunner.query(
        `UPDATE catalogos.tipos_documento
            SET codigo_plantilla = $2
          WHERE codigo_anexo = $1 AND eliminado_en IS NULL`,
        [l.requirementCode, l.templateCode],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE catalogos.tipos_documento DROP CONSTRAINT IF EXISTS ${FK_NAME}`,
    );
    await queryRunner.query(
      `ALTER TABLE catalogos.tipos_documento DROP COLUMN IF EXISTS codigo_plantilla`,
    );
    await queryRunner.query(
      `DELETE FROM sistema.plantillas_documentos
        WHERE codigo = ANY($1) AND ruta_archivo IS NULL`,
      [REQUIREMENT_TEMPLATES.map((t) => t.code)],
    );
  }
}
