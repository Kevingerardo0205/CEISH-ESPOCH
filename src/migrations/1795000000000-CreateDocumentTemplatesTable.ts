import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTemplatesTable1795000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sistema.plantillas_documentos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(100) UNIQUE NOT NULL,
        nombre VARCHAR(200) NOT NULL,
        ruta_archivo VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE NOT NULL,
        creado_en TIMESTAMP DEFAULT NOW() NOT NULL,
        actualizado_en TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Insertar la plantilla por defecto para la respuesta a observaciones
      INSERT INTO sistema.plantillas_documentos (codigo, nombre, ruta_archivo)
      VALUES ('RESPUESTA_OBSERVACIONES', 'Formato de Respuesta a Observaciones', 'templates/formato_respuesta_observaciones.docx')
      ON CONFLICT (codigo) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS sistema.plantillas_documentos;
    `);
  }
}
