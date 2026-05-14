import { MigrationInterface, QueryRunner } from 'typeorm';

export class HierarchicalPermissionsRefactor1778536000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla de Módulos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS catalogos.modulos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        icono VARCHAR(50),
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        creado_en TIMESTAMP DEFAULT NOW() NOT NULL,
        actualizado_en TIMESTAMP DEFAULT NOW() NOT NULL,
        eliminado_en TIMESTAMP
      )
    `);

    // 2. Añadir columna modulo_id a catalogos.permisos
    await queryRunner.query(`
      ALTER TABLE catalogos.permisos 
      ADD COLUMN IF NOT EXISTS modulo_id INT;
    `);

    await queryRunner.query(`
      ALTER TABLE catalogos.permisos 
      ADD CONSTRAINT FK_permisos_modulos 
      FOREIGN KEY (modulo_id) REFERENCES catalogos.modulos(id)
      ON DELETE SET NULL;
    `);

    // 3. Poblar Módulos
    await queryRunner.query(`
      INSERT INTO catalogos.modulos (nombre, codigo, icono, orden) VALUES 
      ('Gestión de Usuarios', 'MOD_USUARIOS', 'users-icon', 1),
      ('Recepción de Protocolos', 'MOD_RECEPCION', 'file-upload-icon', 2),
      ('Validación Documental', 'MOD_VALIDACION', 'check-shield-icon', 3),
      ('Asignación de Evaluadores', 'MOD_EVALUADORES', 'user-assign-icon', 4),
      ('Evaluación Ética', 'MOD_ETICA', 'microscope-icon', 5),
      ('Resoluciones y Seguimiento', 'MOD_RESOLUCIONES', 'gavel-icon', 6),
      ('Reportes y Dashboard', 'MOD_REPORTES', 'chart-bar-icon', 7);
    `);

    // 4. Vincular permisos existentes a los nuevos módulos
    // Módulo de Usuarios
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_USUARIOS')
      WHERE codigo LIKE 'USUARIOS_%' OR codigo LIKE 'ROLES_%' OR codigo = 'PERMISOS_GESTIONAR';
    `);

    // Módulo de Recepción
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_RECEPCION')
      WHERE codigo LIKE 'RECEPCION_%';
    `);

    // Módulo de Validación
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_VALIDACION')
      WHERE codigo LIKE 'DOCUMENTOS_%' OR codigo = 'CHECKLIST_GESTIONAR';
    `);

    // Módulo de Evaluadores
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_EVALUADORES')
      WHERE codigo LIKE 'EVALUADORES_%';
    `);

    // Módulo de Evaluación Ética
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_ETICA')
      WHERE codigo LIKE 'EVALUACION_%';
    `);

    // Módulo de Resoluciones
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_RESOLUCIONES')
      WHERE codigo LIKE 'RESOLUCION_%' OR codigo LIKE 'FOLLOW_UP_%' OR codigo LIKE 'SEGUIMIENTO_%';
    `);

    // Módulo de Reportes
    await queryRunner.query(`
      UPDATE catalogos.permisos SET modulo_id = (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_REPORTES')
      WHERE codigo LIKE 'DASHBOARD_%' OR codigo LIKE 'REPORTS_%' OR codigo LIKE 'REPORTES_%';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE catalogos.permisos DROP CONSTRAINT IF EXISTS FK_permisos_modulos`);
    await queryRunner.query(`ALTER TABLE catalogos.permisos DROP COLUMN IF EXISTS modulo_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS catalogos.modulos`);
  }
}
