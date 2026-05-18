import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDocumentDataAndNames1778820000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Corregir el typo en el nombre del Anexo 2
    await queryRunner.query(
      `UPDATE catalogos.tipos_documento 
       SET nombre = 'Anexo 2: Formulario de Protocolo' 
       WHERE nombre = 'Anexo 2:: Formulario de Protocolo'`
    );

    // 2. Asegurar que todos los documentos para EC estén en la tabla relacional
    // (A veces la migración anterior falla si los códigos no coinciden exactamente)
    const ecType = await queryRunner.query(`SELECT id FROM catalogos.tipos_estudio WHERE codigo = 'EC' LIMIT 1`);
    if (ecType.length > 0) {
        const ecId = ecType[0].id;
        // Insertar relaciones faltantes para EC que marcamos como aplica=['EC']
        await queryRunner.query(`
            INSERT INTO catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio)
            SELECT id, ${ecId}, true 
            FROM catalogos.tipos_documento 
            WHERE tipo_estudio_aplica::jsonb ? 'EC'
            ON CONFLICT DO NOTHING
        `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
