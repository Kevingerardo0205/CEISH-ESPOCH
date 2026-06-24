import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscrepanciaRiesgoEstado1788000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insertar el estado DISCREPANCIA_RIESGO si no existe
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (16, 'DISCREPANCIA DE RIESGO', 'PROTOCOLO', 'DISCREPANCIA_RIESGO')
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, 
          categoria = EXCLUDED.categoria, 
          codigo = EXCLUDED.codigo;
    `);

    // Sincronizar secuencia del catálogo
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 16), true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM catalogos.estados WHERE id = 16;
    `);

    // Sincronizar secuencia
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 15), true);
    `);
  }
}
