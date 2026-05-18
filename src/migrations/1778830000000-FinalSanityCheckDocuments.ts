import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinalSanityCheckDocuments1778830000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Aumentar tamaño de columna a 100 por si acaso hay códigos largos
    await queryRunner.query(`ALTER TABLE catalogos.tipos_documento ALTER COLUMN codigo_anexo TYPE VARCHAR(100)`);

    // 1. Asegurar que no hay códigos vacíos o nulos donde debería haberlos
    await queryRunner.query(`
        UPDATE catalogos.tipos_documento 
        SET codigo_anexo = 'ANEXO_2' 
        WHERE nombre = 'Anexo 2: Formulario de Protocolo' AND (codigo_anexo IS NULL OR codigo_anexo = '')
    `);

    // 2. Forzar que todos los campos codigo_anexo sean el nombre en mayúsculas si siguen vacíos
    await queryRunner.query(`
        UPDATE catalogos.tipos_documento 
        SET codigo_anexo = UPPER(REPLACE(REPLACE(nombre, ' ', '_'), ':', ''))
        WHERE codigo_anexo IS NULL OR codigo_anexo = ''
    `);

    // 3. Garantizar que la tabla relacional esté completa
    const types = await queryRunner.query("SELECT id, codigo FROM catalogos.tipos_estudio WHERE activo = true");
    
    for (const t of types) {
        await queryRunner.query(`
            INSERT INTO catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio)
            SELECT id, ${t.id}, true 
            FROM catalogos.tipos_documento 
            WHERE tipo_estudio_aplica::jsonb ? '${t.codigo}'
            ON CONFLICT DO NOTHING
        `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
