import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEstadosCatalog1778900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Limpiar estados previos para evitar conflictos de nombres
    await queryRunner.query(`DELETE FROM catalogos.estados`);

    // 2. Insertar los 14 estados base requeridos por los distintos flujos
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (1, 'APROBADO', 'DOCUMENTO', 'APROBADO'),
      (2, 'RECHAZADO', 'DOCUMENTO', 'RECHAZADO'),
      (3, 'OBSERVADO', 'DOCUMENTO', 'OBSERVADO'),
      (4, 'PENDIENTE', 'DOCUMENTO', 'PENDIENTE'),
      (5, 'SUGERIDO', 'EVALUACION', 'SUGERIDO'),
      (6, 'ASIGNADO', 'EVALUACION', 'ASIGNADO'),
      (7, 'COMPLETADO', 'EVALUACION', 'COMPLETADO'),
      (8, 'ARCHIVADO', 'EVALUACION', 'ARCHIVADO'),
      (9, 'INICIADO', 'RECEPCION', 'INICIADO'),
      (10, 'COMPLETO', 'RECEPCION', 'COMPLETO'),
      (11, 'INCOMPLETO', 'RECEPCION', 'INCOMPLETO'),
      (12, 'ARCHIVADO POR VENCIMIENTO', 'RECEPCION', 'ARCHIVADO_VENCIMIENTO'),
      (13, 'EN EVALUACION', 'PROTOCOLO', 'EN_EVALUACION'),
      (14, 'EVALUADO', 'PROTOCOLO', 'EVALUADO')
      ON CONFLICT (id) DO UPDATE 
      SET nombre = EXCLUDED.nombre, 
          categoria = EXCLUDED.categoria, 
          codigo = EXCLUDED.codigo;
    `);

    // 3. Ajustar el valor de la secuencia para evitar colisiones de IDs en el futuro
    await queryRunner.query(
      `SELECT pg_catalog.setval('catalogos.estados_id_seq', 14, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM catalogos.estados WHERE id BETWEEN 1 AND 14`,
    );
  }
}
