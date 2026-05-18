import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForceDocumentCodesById1778850000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ASEGURAR TAMAÑO COLUMNA
    await queryRunner.query('ALTER TABLE catalogos.tipos_documento ALTER COLUMN codigo_anexo TYPE VARCHAR(100)');

    // Usamos los IDs detectados en los logs del usuario para asegurar el tiro
    const updates = [
      { id: 21, code: 'CONSENTIMIENTO' },
      { id: 22, code: 'ANEXO_1' },
      { id: 23, code: 'ANEXO_2' },
      { id: 24, code: 'DECLARACION_RESP' },
      { id: 25, code: 'TRADUCCION_ANCESTRAL' },
      { id: 26, code: 'INSTRUMENTOS_INV' },
      { id: 27, code: 'CV_INVESTIGADORES' },
      { id: 28, code: 'CONSENTIMIENTO_COMUNITARIO' },
      { id: 29, code: 'CARTA_INTERES' },
      { id: 30, code: 'FICHA_INTERVENCION' },
      { id: 31, code: 'POLIZA_SEGURO' },
      { id: 32, code: 'IDONEIDAD_INST' },
      { id: 33, code: 'ANEXO_6' },
      { id: 34, code: 'CV_IP' },
      { id: 35, code: 'PROTOCOLO_COMPLETO' },
      { id: 36, code: 'FICHA_DESCRIPTIVA' },
      { id: 37, code: 'MANUAL_INV' },
      { id: 38, code: 'INSTRUMENTOS_REC' },
      { id: 39, code: 'CERT_CAPACITACION' },
      { id: 40, code: 'REGISTRO_SENESCYT' },
      { id: 41, code: 'INFO_SEG_FARMACO' },
      { id: 42, code: 'CONTRATO_PROMOTOR' },
      { id: 43, code: 'PLAN_MONITOREO' },
      { id: 44, code: 'PLAN_SEGURIDAD' },
      { id: 45, code: 'APROBACION_PAIS_ORIGEN' },
    ];

    for (const item of updates) {
      await queryRunner.query(
        'UPDATE catalogos.tipos_documento SET codigo_anexo = $1 WHERE id = $2',
        [item.code, item.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
