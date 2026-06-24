import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIteration2States1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Modificar las restricciones UNIQUE de catalogos.estados para permitir nombres/códigos iguales en diferentes categorías
    await queryRunner.query(`
      ALTER TABLE catalogos.estados DROP CONSTRAINT IF EXISTS estados_nombre_key;
      ALTER TABLE catalogos.estados DROP CONSTRAINT IF EXISTS estados_codigo_key;
    `);

    await queryRunner.query(`
      ALTER TABLE catalogos.estados 
      ADD CONSTRAINT UQ_estados_nombre_categoria UNIQUE (nombre, categoria);

      ALTER TABLE catalogos.estados 
      ADD CONSTRAINT UQ_estados_codigo_categoria UNIQUE (codigo, categoria);
    `);

    // 2. Insertar nuevos estados de la Iteración 2 en catalogos.estados
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (17, 'APROBADO', 'PROTOCOLO', 'APROBADO'),
      (18, 'RECHAZADO', 'PROTOCOLO', 'RECHAZADO'),
      (19, 'REQUIERE_SUBSANACION_VERSION', 'PROTOCOLO', 'REQUIERE_SUBSANACION_VERSION'),
      (20, 'REQUIERE_SUBSANACION_DOCUMENTAL', 'RECEPCION', 'REQUIERE_SUBSANACION_DOC'),
      (21, 'EN_CONTROL_DOCUMENTAL', 'PROTOCOLO', 'EN_CONTROL_DOCUMENTAL')
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        categoria = EXCLUDED.categoria,
        codigo = EXCLUDED.codigo;
    `);

    // Sincronizar la secuencia de la tabla catalogos.estados
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 21), true);
    `);

    // 3. Simplificar catalogos.tipos_resolucion
    // Primero, migrar referencias existentes de tipo_resolucion_id = 4 (PENDIENTE_SUBSANACION) a 2 (APROBADO_CON_OBSERVACIONES)
    await queryRunner.query(`
      UPDATE public.versiones_protocolo 
      SET tipo_resolucion_id = 2 
      WHERE tipo_resolucion_id = 4;
    `);

    await queryRunner.query(`
      UPDATE resolucion.resoluciones 
      SET tipo_resolucion_id = 2 
      WHERE tipo_resolucion_id = 4;
    `);

    // Luego, eliminar el tipo de resolución 4
    await queryRunner.query(`
      DELETE FROM catalogos.tipos_resolucion WHERE id = 4;
    `);

    // Sincronizar la secuencia de la tabla catalogos.tipos_resolucion
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.tipos_resolucion_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.tipos_resolucion), 3), true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Restaurar tipo de resolución 4
    await queryRunner.query(`
      INSERT INTO catalogos.tipos_resolucion (id, nombre) VALUES
      (4, 'PENDIENTE_SUBSANACION')
      ON CONFLICT (id) DO NOTHING;
    `);

    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.tipos_resolucion_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.tipos_resolucion), 4), true);
    `);

    // 2. Eliminar estados agregados
    await queryRunner.query(`
      DELETE FROM catalogos.estados WHERE id IN (17, 18, 19, 20, 21);
    `);

    // 3. Revertir las restricciones UNIQUE
    await queryRunner.query(`
      ALTER TABLE catalogos.estados DROP CONSTRAINT IF EXISTS UQ_estados_nombre_categoria;
      ALTER TABLE catalogos.estados DROP CONSTRAINT IF EXISTS UQ_estados_codigo_categoria;
    `);

    await queryRunner.query(`
      ALTER TABLE catalogos.estados 
      ADD CONSTRAINT estados_nombre_key UNIQUE (nombre);

      ALTER TABLE catalogos.estados 
      ADD CONSTRAINT estados_codigo_key UNIQUE (codigo);
    `);

    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 16), true);
    `);
  }
}
