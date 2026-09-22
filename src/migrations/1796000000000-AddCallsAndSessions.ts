import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCallsAndSessions1796000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla evaluacion.lugares
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.lugares (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(150) NOT NULL UNIQUE,
          ubicacion VARCHAR(250),
          activo BOOLEAN DEFAULT TRUE,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Insertar nuevos estados en catalogos.estados para Convocatorias y Evaluaciones
    await queryRunner.query(`
      INSERT INTO catalogos.estados (id, nombre, categoria, codigo) VALUES
      (22, 'CREADA', 'CONVOCATORIA', 'CREADA'),
      (23, 'ENVIADA', 'CONVOCATORIA', 'ENVIADA'),
      (24, 'FINALIZADA', 'CONVOCATORIA', 'FINALIZADA'),
      (25, 'APROBADO_CON_CONDICION', 'PROTOCOLO', 'APROBADO_CON_CONDICION')
      ON CONFLICT (id) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        categoria = EXCLUDED.categoria,
        codigo = EXCLUDED.codigo;
    `);

    // Sincronizar la secuencia de la tabla catalogos.estados
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 25), true);
    `);

    // 3. Crear tabla evaluacion.convocatorias
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.convocatorias (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE,
          fecha DATE NOT NULL,
          hora TIME NOT NULL,
          lugar_id INT REFERENCES evaluacion.lugares(id),
          tipo_sesion VARCHAR(50) NOT NULL,
          estado_id INT REFERENCES catalogos.estados(id),
          resumen_agenda TEXT,
          creado_por INT REFERENCES catalogos.usuarios(id),
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Crear tabla evaluacion.convocatoria_protocolos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS evaluacion.convocatoria_protocolos (
          id SERIAL PRIMARY KEY,
          convocatoria_id INT REFERENCES evaluacion.convocatorias(id) ON DELETE CASCADE,
          version_protocolo_id INT REFERENCES public.versiones_protocolo(id) ON DELETE CASCADE,
          orden INT NOT NULL,
          fecha_reunion DATE NOT NULL,
          fecha_entrega_evaluacion DATE NOT NULL,
          resultado_id INT REFERENCES catalogos.estados(id) NULL,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_convocatoria_version UNIQUE (convocatoria_id, version_protocolo_id)
      );
    `);

    // 5. Alterar la tabla evaluacion.sesiones
    await queryRunner.query(`
      ALTER TABLE evaluacion.sesiones 
      ADD COLUMN IF NOT EXISTS convocatoria_id INT REFERENCES evaluacion.convocatorias(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Revertir alteración de sesiones
    await queryRunner.query(`
      ALTER TABLE evaluacion.sesiones 
      DROP COLUMN IF EXISTS convocatoria_id;
    `);

    // 2. Eliminar tabla  convocatoria_protocolos
    await queryRunner.query(
      `DROP TABLE IF EXISTS evaluacion.convocatoria_protocolos;`,
    );

    // 3. Eliminar tabla convocatorias
    await queryRunner.query(`DROP TABLE IF EXISTS evaluacion.convocatorias;`);

    // 4. Eliminar estados agregados
    await queryRunner.query(`
      DELETE FROM catalogos.estados WHERE id IN (22, 23, 24, 25);
    `);

    // Sincronizar la secuencia de la tabla catalogos.estados
    await queryRunner.query(`
      SELECT pg_catalog.setval('catalogos.estados_id_seq', COALESCE((SELECT MAX(id) FROM catalogos.estados), 21), true);
    `);

    // 5. Eliminar tabla lugares
    await queryRunner.query(`DROP TABLE IF EXISTS evaluacion.lugares;`);
  }
}
