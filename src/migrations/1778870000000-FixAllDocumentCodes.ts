import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAllDocumentCodes1778870000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Definimos el mapeo de IDs a Códigos de Anexo basado en los datos proporcionados
    const codes = {
      // Documentos Base / PET 3.0
      19: 'ANEXO_1',
      20: 'ANEXO_2',
      21: 'CONSENTIMIENTO',
      22: 'INSTRUMENTOS',
      23: 'CV_INVESTIGADORES',
      24: 'ANEXO_4',
      25: 'TRADUCCION_ANCESTRAL',
      26: 'CONSENTIMIENTO_COM',
      27: 'CONFIDENCIALIDAD',
      28: 'CONFLICTO_INTERES',
      29: 'ANEXO_5',
      30: 'FICHA_INTERVENCION',
      31: 'POLIZA_RC',
      32: 'IDONEIDAD_INST',
      33: 'ANEXO_6',
      34: 'CV_IP',
      35: 'PROTOCOLO_EC',
      36: 'FICHA_EC',
      37: 'MANUAL_BPC',
      38: 'PROCEDIMIENTOS_REC',
      39: 'CERT_BIOETICA',
      40: 'REG_SENESCYT',
      41: 'SEG_FARMACO',
      42: 'CONTRATO_PROMOTOR',
      43: 'PLAN_MONITOREO',
      44: 'PLAN_SEGURIDAD',
      45: 'APROB_ORIGEN',

      // Documentos Legados / Genéricos (IDs 1-11)
      1: 'PROTOCOLO_GEN',
      2: 'CONSENTIMIENTO_GEN',
      3: 'INSTRUMENTOS_GEN',
      4: 'CV_GEN',
      5: 'FORM_EXPEDITA',
      6: 'CARTA_EXPEDITA',
      7: 'FORM_PLENO',
      8: 'CARTA_PLENO',
      9: 'FORM_EC',
      10: 'MANUAL_INV_GEN',
      11: 'POLIZA_GEN',
    };

    for (const [id, code] of Object.entries(codes)) {
      await queryRunner.query(`
        UPDATE "catalogos"."tipos_documento" 
        SET "codigo_anexo" = '${code}', 
            "actualizado_en" = NOW() 
        WHERE "id" = ${id}
      `);
    }

    // Fallback preventivo para cualquier nulo restante o vacío
    await queryRunner.query(`
      UPDATE "catalogos"."tipos_documento" 
      SET "codigo_anexo" = 'REQ_' || id 
      WHERE "codigo_anexo" IS NULL OR "codigo_anexo" = ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a NULL si es necesario
    await queryRunner.query(
      `UPDATE "catalogos"."tipos_documento" SET "codigo_anexo" = NULL WHERE id <= 45`,
    );
  }
}
