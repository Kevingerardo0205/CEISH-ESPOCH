import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignReceptionStatuses1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insertar el estado EN_REVISION_SECRETARIA si no existe
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (15, 'EN REVISION SECRETARIA', 'RECEPCION', 'EN_REVISION_SECRETARIA')
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, 
          categoria = EXCLUDED.categoria, 
          codigo = EXCLUDED.codigo;
    `);

    // Sincronizar secuencia del catálogo
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 15), true);
    `);

    // 2. Actualizar recepciones existentes a los nuevos ID correctos del catálogo
    // 1 -> 9 (INICIADO)
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 9 
      WHERE estado_id = 1;
    `);

    // 2 -> 10 (COMPLETO)
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 10 
      WHERE estado_id = 2;
    `);

    // 3 -> 11 (INCOMPLETO)
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 11 
      WHERE estado_id = 3;
    `);

    // 4 -> 12 (ARCHIVADO POR VENCIMIENTO)
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 12 
      WHERE estado_id = 4;
    `);

    // 5 -> 15 (EN REVISION SECRETARIA)
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 15 
      WHERE estado_id = 5;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a los estados antiguos
    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 1 
      WHERE estado_id = 9;
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 2 
      WHERE estado_id = 10;
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 3 
      WHERE estado_id = 11;
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 4 
      WHERE estado_id = 12;
    `);

    await queryRunner.query(`
      UPDATE recepcion.recepciones 
      SET estado_id = 5 
      WHERE estado_id = 15;
    `);

    // Eliminar el estado EN_REVISION_SECRETARIA
    await queryRunner.query(`
      DELETE FROM catalogos.estados WHERE id = 15;
    `);

    // Sincronizar secuencia
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 14), true);
    `);
  }
}
