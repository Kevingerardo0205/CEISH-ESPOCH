import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Insertar investigadores reales del CEISH-ESPOCH
 *
 * 1. Limpia evaluadores de prueba (usuario_id 3, 28, 29) y sus relaciones
 * 2. Elimina perfiles duplicados del catálogo (IDs 11-15, son copias sin tildes)
 * 3. Inserta 8 investigadores reales como usuarios
 * 4. Les asigna el rol EVALUADOR (rol_id = 9)
 * 5. Les asigna perfiles de evaluador según su especialidad en evaluadores_perfil
 *
 * Perfiles de evaluador vigentes (IDs 6-10):
 *   6 = Metodológico
 *   7 = Ético
 *   8 = Jurídico
 *   9 = Salud
 *  10 = Sociedad Civil
 */
export class SeedRealEvaluators1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ═══════════════════════════════════════════════════════════════
    // PASO 1: Limpiar datos de evaluadores de prueba
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      DELETE FROM catalogos.evaluadores_perfil
      WHERE usuario_id IN (3, 28, 29);
    `);

    await queryRunner.query(`
      DELETE FROM catalogos.usuarios_roles
      WHERE usuario_id IN (3, 28, 29);
    `);

    // ═══════════════════════════════════════════════════════════════
    // PASO 2: Limpiar perfiles duplicados del catálogo (IDs 11-15)
    // Son copias sin tildes creadas por migraciones anteriores
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      DELETE FROM catalogos.evaluadores_perfil
      WHERE perfil_id IN (11, 12, 13, 14, 15);
    `);

    await queryRunner.query(`
      DELETE FROM catalogos.perfiles_evaluador
      WHERE id IN (11, 12, 13, 14, 15);
    `);

    // ═══════════════════════════════════════════════════════════════
    // PASO 3: Insertar 8 investigadores reales como usuarios
    // password_hash NULL → configurarán contraseña vía invitación
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      INSERT INTO catalogos.usuarios
        (cedula, nombres_completos, email_institucional, activo, email_verificado)
      VALUES
        ('0600000001', 'Rolando Teruel Ginés',              'rolando.teruel@espoch.edu.ec',    true, true),
        ('0600000002', 'Patricia Alejandra Ríos Guarango',  'patricia.rios@espoch.edu.ec',     true, true),
        ('0600000003', 'Patricio David Ramos Padilla',      'patricio.ramos@espoch.edu.ec',    true, true),
        ('0600000004', 'Ana Karina Albuja Landi',           'ana.albuja@espoch.edu.ec',        true, true),
        ('0600000005', 'Veronica Mercedes Cando Brito',     'veronica.cando@espoch.edu.ec',    true, true),
        ('0600000006', 'Gabriel Alejandro Tamayo Becerra',  'gabriel.tamayo@espoch.edu.ec',    true, true),
        ('0600000007', 'Nelly Margarita Padilla Padilla',   'nelly.padilla@espoch.edu.ec',     true, true),
        ('0600000008', 'Jaime David Camacho Castillo',      'jaime.camacho@espoch.edu.ec',     true, true)
      ON CONFLICT (cedula) DO UPDATE
        SET nombres_completos   = EXCLUDED.nombres_completos,
            email_institucional = EXCLUDED.email_institucional,
            activo              = EXCLUDED.activo,
            email_verificado    = EXCLUDED.email_verificado;
    `);

    // ═══════════════════════════════════════════════════════════════
    // PASO 4: Asignar rol EVALUADOR (rol_id = 9) a todos
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id)
      SELECT u.id, 9
      FROM catalogos.usuarios u
      WHERE u.cedula IN (
        '0600000001','0600000002','0600000003',
        '0600000004','0600000005',
        '0600000006',
        '0600000007','0600000008'
      )
      ON CONFLICT (usuario_id, rol_id) DO NOTHING;
    `);

    // ═══════════════════════════════════════════════════════════════
    // PASO 5: Asignar perfiles de evaluador según especialidad
    // ═══════════════════════════════════════════════════════════════

    // Rolando Teruel Ginés → SALUD (9) + ÉTICO (7)
    // Especialista en Medicina Interna, Máster en Urgencias Médicas
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, unnest(ARRAY[9, 7]), true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000001'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Patricia Alejandra Ríos Guarango → SALUD (9) + ÉTICO (7)
    // Magíster en Salud Pública, Especialista en Atención Primaria
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, unnest(ARRAY[9, 7]), true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000002'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Patricio David Ramos Padilla → SALUD (9) + METODOLÓGICO (6)
    // PhD en Nutrición (C), Magister en Nutrición Clínica
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, unnest(ARRAY[9, 6]), true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000003'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Ana Karina Albuja Landi → METODOLÓGICO (6) + ÉTICO (7)
    // PhD en Química de Medicamentos, experiencia en Metodología
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, unnest(ARRAY[6, 7]), true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000004'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Veronica Mercedes Cando Brito → METODOLÓGICO (6) + ÉTICO (7)
    // PhD en Química de Medicamentos, experiencia en Metodología
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, unnest(ARRAY[6, 7]), true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000005'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Gabriel Alejandro Tamayo Becerra → JURÍDICO (8)
    // Abogado, Magíster en Derecho Procesal Constitucional
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, 8, true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000006'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Nelly Margarita Padilla Padilla → SOCIEDAD CIVIL (10)
    // Representante de la Sociedad Civil
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, 10, true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000007'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // Jaime David Camacho Castillo → SOCIEDAD CIVIL (10)
    // Representante de la Sociedad Civil
    await queryRunner.query(`
      INSERT INTO catalogos.evaluadores_perfil (usuario_id, perfil_id, activo)
      SELECT u.id, 10, true
      FROM catalogos.usuarios u WHERE u.cedula = '0600000008'
      ON CONFLICT (usuario_id, perfil_id) DO NOTHING;
    `);

    // ═══════════════════════════════════════════════════════════════
    // PASO 6: Sincronizar secuencia de autoincremento
    // ═══════════════════════════════════════════════════════════════
    await queryRunner.query(`
      SELECT pg_catalog.setval(
        'catalogos.usuarios_id_seq',
        COALESCE((SELECT MAX(id) FROM catalogos.usuarios), 1),
        true
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: eliminar usuarios insertados y sus relaciones
    await queryRunner.query(`
      DELETE FROM catalogos.evaluadores_perfil
      WHERE usuario_id IN (
        SELECT id FROM catalogos.usuarios
        WHERE cedula IN (
          '0600000001','0600000002','0600000003',
          '0600000004','0600000005',
          '0600000006',
          '0600000007','0600000008'
        )
      );
    `);

    await queryRunner.query(`
      DELETE FROM catalogos.usuarios_roles
      WHERE usuario_id IN (
        SELECT id FROM catalogos.usuarios
        WHERE cedula IN (
          '0600000001','0600000002','0600000003',
          '0600000004','0600000005',
          '0600000006',
          '0600000007','0600000008'
        )
      );
    `);

    await queryRunner.query(`
      DELETE FROM catalogos.usuarios
      WHERE cedula IN (
        '0600000001','0600000002','0600000003',
        '0600000004','0600000005',
        '0600000006',
        '0600000007','0600000008'
      );
    `);
  }
}
