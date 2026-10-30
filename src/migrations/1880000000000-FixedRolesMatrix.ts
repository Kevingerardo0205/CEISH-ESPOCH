import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.1a — Matriz de roles fija (HU-001 c/d/e/f/h del spec v3.5.1)
 *
 * up():
 *   0. Aborta si no existe secretaria@test.com con SECRETARIA vigente.
 *   1. Respalda rol_permisos en catalogos.rol_permisos_bk_tsk001_1a (si vacía).
 *   2. Crea USUARIOS_GESTIONAR en MOD_USUARIOS (si no existe).
 *   3. Retira 5 permisos con eliminado_en (si no tienen ya).
 *   4. DELETE + INSERT de la matriz fija (73 filas) por códigos.
 *   5. Desactiva cuentas con ADMIN_TI vigente.
 *   6. Revoca ADMIN_TI vigente (fecha_fin = NOW()).
 *   7. Revoca SECRETARIA vigente excepto secretaria@test.com.
 *   8. Marca rol '43' y ADMIN_TI con activo=false + eliminado_en.
 *   9. Quita ADMIN_TI de ai_assistant_config.allowed_roles.
 *
 * down() restaura rol_permisos, los 5 permisos, ADMIN_TI y el rol '43'.
 * NO revierte fecha_fin ni activo de las cuentas de usuario: ese estado
 * previo no se almacena aquí y revertirlo podría comprometer la seguridad.
 */
export class FixedRolesMatrix1880000000000 implements MigrationInterface {
  private static readonly TEST_SECRETARIA_EMAIL = 'secretaria@test.com';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Paso 0: Verificar cuenta de prueba ───────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const guardRows: unknown[] = await queryRunner.query(
      `SELECT ur.usuario_id
       FROM catalogos.usuarios_roles ur
       JOIN catalogos.usuarios u ON u.id = ur.usuario_id
       JOIN catalogos.roles r ON r.id = ur.rol_id
       WHERE u.email_institucional = $1
         AND r.codigo = 'SECRETARIA'
         AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
       LIMIT 1`,
      [FixedRolesMatrix1880000000000.TEST_SECRETARIA_EMAIL],
    );
    if (guardRows.length === 0) {
      throw new Error(
        `[TSK-001.1a] ABORT: no existe una cuenta con email ` +
          `'${FixedRolesMatrix1880000000000.TEST_SECRETARIA_EMAIL}' con rol SECRETARIA vigente. ` +
          `La migración requiere esta cuenta de prueba para preservar al menos una SECRETARIA.`,
      );
    }

    // ─── Paso 1: Respaldo idempotente de rol_permisos ─────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS catalogos.rol_permisos_bk_tsk001_1a (
        rol_codigo    VARCHAR(20) NOT NULL,
        permiso_codigo VARCHAR(50) NOT NULL,
        respaldado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos_bk_tsk001_1a (rol_codigo, permiso_codigo, respaldado_en)
      SELECT r.codigo, p.codigo, NOW()
      FROM catalogos.rol_permisos rp
      JOIN catalogos.roles r ON r.id = rp.rol_id
      JOIN catalogos.permisos p ON p.id = rp.permiso_id
      WHERE NOT EXISTS (SELECT 1 FROM catalogos.rol_permisos_bk_tsk001_1a LIMIT 1)
    `);

    // ─── Paso 2: Crear USUARIOS_GESTIONAR ─────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO catalogos.permisos (codigo, nombre, modulo_id)
      SELECT 'USUARIOS_GESTIONAR', 'Gestionar usuarios y roles', m.id
      FROM catalogos.modulos m
      WHERE m.codigo = 'MOD_USUARIOS'
        AND NOT EXISTS (
          SELECT 1 FROM catalogos.permisos WHERE codigo = 'USUARIOS_GESTIONAR'
        )
    `);

    // ─── Paso 3: Retirar 5 permisos con eliminado_en ─────────────────────────
    await queryRunner.query(`
      UPDATE catalogos.permisos
      SET eliminado_en = NOW()
      WHERE codigo IN (
        'PERMISOS_GESTIONAR', 'SEGUIMIENTO_ENMIENDAS', 'TRADUCCION_ANCESTRAL',
        'DASHBOARD_SLA', 'CONFIG_INTEGRACIONES'
      )
      AND eliminado_en IS NULL
    `);

    // ─── Paso 4: Sembrar la matriz fija (73 filas) ────────────────────────────
    await queryRunner.query(`DELETE FROM catalogos.rol_permisos`);
    await queryRunner.query(`
      WITH matrix(rol_codigo, permiso_codigo) AS (
        VALUES
          ('SECRETARIA', 'DASHBOARD_RESUMEN'),
          ('SECRETARIA', 'DASHBOARD_NOTIF'),
          ('SECRETARIA', 'DASHBOARD_VENCIMIENTOS'),
          ('SECRETARIA', 'RECEPCION_LISTA'),
          ('SECRETARIA', 'RECEPCION_VALIDAR'),
          ('SECRETARIA', 'RECEPCION_BUSCAR'),
          ('SECRETARIA', 'RECEPCION_CONSTANCIAS'),
          ('SECRETARIA', 'RECEPCION_NUEVO'),
          ('SECRETARIA', 'EVALUACION_ASIGNAR'),
          ('SECRETARIA', 'EVALUACION_INFORMES'),
          ('SECRETARIA', 'EVALUACION_RIESGO'),
          ('SECRETARIA', 'EVALUACION_EXPEDITA'),
          ('SECRETARIA', 'EVALUACION_PLENO'),
          ('SECRETARIA', 'EVALUACION_SUBSANACIONES'),
          ('SECRETARIA', 'RESOLUCION_CREAR'),
          ('SECRETARIA', 'RESOLUCION_NOTIF'),
          ('SECRETARIA', 'RESOLUCION_HISTORIAL'),
          ('SECRETARIA', 'RESOLUCION_CONVOCATORIAS'),
          ('SECRETARIA', 'SEGUIMIENTO_AVANCE'),
          ('SECRETARIA', 'SEGUIMIENTO_FINAL'),
          ('SECRETARIA', 'SEGUIMIENTO_EVENTOS'),
          ('SECRETARIA', 'SEGUIMIENTO_RENOVACIONES'),
          ('SECRETARIA', 'SEGUIMIENTO_SUSPENSION'),
          ('SECRETARIA', 'USUARIOS_VER'),
          ('SECRETARIA', 'USUARIOS_GESTIONAR'),
          ('SECRETARIA', 'USUARIOS_CONFLICTOS'),
          ('SECRETARIA', 'EVALUADORES_PERFILES'),
          ('SECRETARIA', 'REPORTES_CARGA'),
          ('SECRETARIA', 'REPORTES_EXPORTAR'),
          ('SECRETARIA', 'REPORTES_AUDITORIA'),
          ('SECRETARIA', 'AUDITORIA_ACCESOS'),
          ('SECRETARIA', 'CONFIG_PARAMETROS'),
          ('SECRETARIA', 'CONFIG_PLANTILLAS'),
          ('SECRETARIA', 'CONFIG_CATALOGOS'),
          ('SECRETARIA', 'CONFIG_NOTIF'),
          ('PRESIDENTE', 'DASHBOARD_RESUMEN'),
          ('PRESIDENTE', 'DASHBOARD_NOTIF'),
          ('PRESIDENTE', 'DASHBOARD_VENCIMIENTOS'),
          ('PRESIDENTE', 'EVALUACION_INFORMES'),
          ('PRESIDENTE', 'EVALUACION_RIESGO'),
          ('PRESIDENTE', 'EVALUACION_EXPEDITA'),
          ('PRESIDENTE', 'EVALUACION_PLENO'),
          ('PRESIDENTE', 'RESOLUCION_CREAR'),
          ('PRESIDENTE', 'RESOLUCION_NOTIF'),
          ('PRESIDENTE', 'RESOLUCION_HISTORIAL'),
          ('PRESIDENTE', 'RESOLUCION_CONVOCATORIAS'),
          ('PRESIDENTE', 'RESOLUCION_FIRMAR'),
          ('PRESIDENTE', 'SEGUIMIENTO_AVANCE'),
          ('PRESIDENTE', 'SEGUIMIENTO_FINAL'),
          ('PRESIDENTE', 'SEGUIMIENTO_EVENTOS'),
          ('PRESIDENTE', 'SEGUIMIENTO_RENOVACIONES'),
          ('PRESIDENTE', 'SEGUIMIENTO_SUSPENSION'),
          ('PRESIDENTE', 'REPORTES_CARGA'),
          ('PRESIDENTE', 'REPORTES_EXPORTAR'),
          ('PRESIDENTE', 'REPORTES_AUDITORIA'),
          ('PRESIDENTE', 'AUDITORIA_ACCESOS'),
          ('EVALUADOR', 'DASHBOARD_RESUMEN'),
          ('EVALUADOR', 'DASHBOARD_NOTIF'),
          ('EVALUADOR', 'EVALUACION_RIESGO'),
          ('EVALUADOR', 'EVALUACION_EXPEDITA'),
          ('EVALUADOR', 'EVALUACION_PLENO'),
          ('EVALUADOR', 'SEGUIMIENTO_AVANCE'),
          ('EVALUADOR', 'SEGUIMIENTO_FINAL'),
          ('EVALUADOR', 'SEGUIMIENTO_EVENTOS'),
          ('EVALUADOR', 'SEGUIMIENTO_RENOVACIONES'),
          ('INVESTIGADOR', 'DASHBOARD_RESUMEN'),
          ('INVESTIGADOR', 'DASHBOARD_NOTIF'),
          ('INVESTIGADOR', 'RECEPCION_NUEVO'),
          ('INVESTIGADOR', 'EVALUACION_SUBSANACIONES'),
          ('INVESTIGADOR', 'SEGUIMIENTO_AVANCE'),
          ('INVESTIGADOR', 'SEGUIMIENTO_FINAL'),
          ('INVESTIGADOR', 'SEGUIMIENTO_EVENTOS'),
          ('INVESTIGADOR', 'SEGUIMIENTO_RENOVACIONES')
      )
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM matrix m
      JOIN catalogos.roles r ON r.codigo = m.rol_codigo
      JOIN catalogos.permisos p ON p.codigo = m.permiso_codigo
        AND p.eliminado_en IS NULL
    `);

    // ─── Paso 5: Desactivar cuentas con ADMIN_TI vigente ─────────────────────
    await queryRunner.query(`
      UPDATE catalogos.usuarios
      SET activo = false
      WHERE id IN (
        SELECT ur.usuario_id
        FROM catalogos.usuarios_roles ur
        JOIN catalogos.roles r ON r.id = ur.rol_id
        WHERE r.codigo = 'ADMIN_TI'
          AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
      )
    `);

    // ─── Paso 6: Revocar ADMIN_TI vigente ────────────────────────────────────
    await queryRunner.query(`
      UPDATE catalogos.usuarios_roles
      SET fecha_fin = NOW(),
          motivo_delegacion = 'TSK-001.1a: ADMIN_TI absorbido por SECRETARIA (28/10/2026)'
      WHERE rol_id = (SELECT id FROM catalogos.roles WHERE codigo = 'ADMIN_TI')
        AND (fecha_fin IS NULL OR fecha_fin >= NOW())
    `);

    // ─── Paso 7: Revocar SECRETARIA vigente excepto cuenta de prueba ──────────
    await queryRunner.query(
      `UPDATE catalogos.usuarios_roles
       SET fecha_fin = NOW(),
           motivo_delegacion = 'TSK-001.1a: unicidad SECRETARIA (28/10/2026)'
       WHERE rol_id = (SELECT id FROM catalogos.roles WHERE codigo = 'SECRETARIA')
         AND (fecha_fin IS NULL OR fecha_fin >= NOW())
         AND usuario_id != (
           SELECT u.id FROM catalogos.usuarios u
           WHERE u.email_institucional = $1
           LIMIT 1
         )`,
      [FixedRolesMatrix1880000000000.TEST_SECRETARIA_EMAIL],
    );

    // ─── Paso 8: Marcar rol '43' y ADMIN_TI ──────────────────────────────────
    await queryRunner.query(`
      UPDATE catalogos.roles
      SET activo = false, eliminado_en = NOW()
      WHERE codigo IN ('43', 'ADMIN_TI')
        AND eliminado_en IS NULL
    `);

    // ─── Paso 9: Quitar ADMIN_TI de allowed_roles ────────────────────────────
    await queryRunner.query(`
      UPDATE catalogos.ai_assistant_config
      SET allowed_roles = TRIM(BOTH ',' FROM
        REGEXP_REPLACE(
          REGEXP_REPLACE(allowed_roles, '(^|,)\\s*ADMIN_TI\\s*(,|$)', ',', 'g'),
          ',+', ',', 'g'
        )
      )
      WHERE allowed_roles LIKE '%ADMIN_TI%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NOTA: down() NO revierte fecha_fin ni activo de las cuentas de usuario.
    // El estado anterior de esos campos no se almacena aquí; revertirlo podría
    // reactivar cuentas que el operador quiso mantener desactivadas.

    // 1. Restaurar rol_permisos desde el respaldo
    await queryRunner.query(`DELETE FROM catalogos.rol_permisos`);
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id)
      SELECT r.id, p.id
      FROM catalogos.rol_permisos_bk_tsk001_1a bk
      JOIN catalogos.roles r ON r.codigo = bk.rol_codigo
      JOIN catalogos.permisos p ON p.codigo = bk.permiso_codigo
    `);

    // 2. Quitar eliminado_en de los 5 permisos retirados
    await queryRunner.query(`
      UPDATE catalogos.permisos
      SET eliminado_en = NULL
      WHERE codigo IN (
        'PERMISOS_GESTIONAR', 'SEGUIMIENTO_ENMIENDAS', 'TRADUCCION_ANCESTRAL',
        'DASHBOARD_SLA', 'CONFIG_INTEGRACIONES'
      )
    `);

    // 3. Borrar USUARIOS_GESTIONAR (sus filas ya fueron reemplazadas en el paso 1)
    await queryRunner.query(`
      DELETE FROM catalogos.permisos WHERE codigo = 'USUARIOS_GESTIONAR'
    `);

    // 4. Restaurar rol '43' y ADMIN_TI
    // ADMIN_TI vuelve activo=true; el rol '43' se queda activo=false como estaba antes
    await queryRunner.query(`
      UPDATE catalogos.roles
      SET activo = true, eliminado_en = NULL
      WHERE codigo = 'ADMIN_TI'
    `);
    await queryRunner.query(`
      UPDATE catalogos.roles
      SET eliminado_en = NULL
      WHERE codigo = '43'
    `);

    // 5. Re-agregar ADMIN_TI a allowed_roles si falta
    await queryRunner.query(`
      UPDATE catalogos.ai_assistant_config
      SET allowed_roles = allowed_roles || ',ADMIN_TI'
      WHERE allowed_roles NOT LIKE '%ADMIN_TI%'
    `);

    // 6. Borrar la tabla de respaldo
    await queryRunner.query(`
      DROP TABLE IF EXISTS catalogos.rol_permisos_bk_tsk001_1a
    `);
  }
}
