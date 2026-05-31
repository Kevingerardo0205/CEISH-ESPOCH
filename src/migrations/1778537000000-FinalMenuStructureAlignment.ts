import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinalMenuStructureAlignment1778537000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Limpiar estructuras previas para asegurar consistencia total
    await queryRunner.query(`DELETE FROM catalogos.rol_permisos`);
    await queryRunner.query(`DELETE FROM catalogos.permisos`);
    await queryRunner.query(`DELETE FROM catalogos.modulos`);

    // 2. Crear los 8 Módulos solicitados
    await queryRunner.query(`
      INSERT INTO catalogos.modulos (nombre, codigo, icono, orden) VALUES 
      ('DASHBOARD', 'MOD_DASHBOARD', 'home-outline', 1),
      ('RECEPCIÓN DE PROTOCOLOS', 'MOD_RECEPCION', 'download-outline', 2),
      ('EVALUACIÓN ÉTICA', 'MOD_EVALUACION', 'shield-checkmark-outline', 3),
      ('RESOLUCIONES', 'MOD_RESOLUCION', 'document-text-outline', 4),
      ('CICLO DE VIDA', 'MOD_SEGUIMIENTO', 'sync-outline', 5),
      ('GESTIÓN DE USUARIOS', 'MOD_USUARIOS', 'people-outline', 6),
      ('REPORTES', 'MOD_REPORTES', 'bar-chart-outline', 7),
      ('CONFIGURACIÓN', 'MOD_CONFIG', 'settings-outline', 8);
    `);

    // 3. Crear Permisos por Módulo (Sub-ítems)
    const modules = {
      MOD_DASHBOARD: [
        ['Resumen ejecutivo', 'DASHBOARD_RESUMEN'],
        ['Notificaciones pendientes', 'DASHBOARD_NOTIF'],
        ['Próximos vencimientos', 'DASHBOARD_VENCIMIENTOS'],
        ['Indicadores SLA', 'DASHBOARD_SLA'],
      ],
      MOD_RECEPCION: [
        ['Nuevo protocolo', 'RECEPCION_NUEVO'],
        ['Lista de ingresos', 'RECEPCION_LISTA'],
        ['Validación documental', 'RECEPCION_VALIDAR'],
        ['Búsqueda avanzada', 'RECEPCION_BUSCAR'],
        ['Constancias de recepción', 'RECEPCION_CONSTANCIAS'],
      ],
      MOD_EVALUACION: [
        ['Estratificación de riesgo', 'EVALUACION_RIESGO'],
        ['Asignación de evaluadores', 'EVALUACION_ASIGNAR'],
        ['Evaluación expedita', 'EVALUACION_EXPEDITA'],
        ['Evaluación en pleno', 'EVALUACION_PLENO'],
        ['Subsanaciones', 'EVALUACION_SUBSANACIONES'],
        ['Consolidación de informes', 'EVALUACION_INFORMES'],
      ],
      MOD_RESOLUCION: [
        ['Generar dictamen', 'RESOLUCION_CREAR'],
        ['Firma electrónica', 'RESOLUCION_FIRMAR'],
        ['Notificaciones a investigadores', 'RESOLUCION_NOTIF'],
        ['Historial de resoluciones', 'RESOLUCION_HISTORIAL'],
        ['Urgencias sanitarias', 'RESOLUCION_URGENCIAS'],
      ],
      MOD_SEGUIMIENTO: [
        ['Informes de avance', 'SEGUIMIENTO_AVANCE'],
        ['Informes finales', 'SEGUIMIENTO_FINAL'],
        ['Enmiendas', 'SEGUIMIENTO_ENMIENDAS'],
        ['Renovaciones', 'SEGUIMIENTO_RENOVACIONES'],
        ['Eventos adversos', 'SEGUIMIENTO_EVENTOS'],
        ['Suspensión/Revocatoria', 'SEGUIMIENTO_SUSPENSION'],
      ],
      MOD_USUARIOS: [
        ['Usuarios y roles', 'USUARIOS_VER'],
        ['Permisos y accesos', 'PERMISOS_GESTIONAR'],
        ['Conflictos de interés', 'USUARIOS_CONFLICTOS'],
        ['Perfiles de evaluadores', 'EVALUADORES_PERFILES'],
        ['Auditoría de accesos', 'AUDITORIA_ACCESOS'],
      ],
      MOD_REPORTES: [
        ['KPIs de gestión', 'REPORTES_KPIS'],
        ['Tiempos de respuesta', 'REPORTES_TIEMPOS'],
        ['Carga por evaluador', 'REPORTES_CARGA'],
        ['Exportar Excel/PDF', 'REPORTES_EXPORTAR'],
        ['Auditoría integral', 'REPORTES_AUDITORIA'],
      ],
      MOD_CONFIG: [
        ['Catálogos', 'CONFIG_CATALOGOS'],
        ['Plantillas de anexos', 'CONFIG_PLANTILLAS'],
        ['Reglas de notificación', 'CONFIG_NOTIF'],
        ['Integraciones', 'CONFIG_INTEGRACIONES'],
        ['Parámetros del sistema', 'CONFIG_PARAMETROS'],
      ],
    };

    for (const [modCode, perms] of Object.entries(modules)) {
      for (const [name, code] of perms) {
        await queryRunner.query(`
          INSERT INTO catalogos.permisos (nombre, codigo, modulo_id) 
          VALUES ('${name}', '${code}', (SELECT id FROM catalogos.modulos WHERE codigo = '${modCode}'))
        `);
      }
    }

    // 4. Implementar Matriz de Visibilidad por Rol (IDs según tu tabla: 6:INV, 7:SEC, 8:PRE, 9:EVA, 10:ADM)

    // ADMIN (10): Todo
    await queryRunner.query(
      `INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) SELECT 10, id FROM catalogos.permisos`,
    );

    // PRESIDENTE (8): Casi todo menos Configuración
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) 
      SELECT 8, id FROM catalogos.permisos 
      WHERE modulo_id NOT IN (SELECT id FROM catalogos.modulos WHERE codigo = 'MOD_CONFIG')
    `);

    // SECRETARIO (7): Casi todo menos Configuración y Gestión de Usuarios
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) 
      SELECT 7, id FROM catalogos.permisos 
      WHERE modulo_id NOT IN (SELECT id FROM catalogos.modulos WHERE codigo IN ('MOD_CONFIG', 'MOD_USUARIOS'))
    `);

    // EVALUADOR (9): Dashboard, Evaluación (Propio), Ciclo Vida (Propio), Reportes (Propio)
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) 
      SELECT 9, id FROM catalogos.permisos 
      WHERE modulo_id IN (SELECT id FROM catalogos.modulos WHERE codigo IN ('MOD_DASHBOARD', 'MOD_EVALUACION', 'MOD_SEGUIMIENTO', 'MOD_REPORTES'))
    `);

    // INVESTIGADOR (6): Dashboard, Ciclo Vida (Propio), Reportes (Propio)
    await queryRunner.query(`
      INSERT INTO catalogos.rol_permisos (rol_id, permiso_id) 
      SELECT 6, id FROM catalogos.permisos 
      WHERE modulo_id IN (SELECT id FROM catalogos.modulos WHERE codigo IN ('MOD_DASHBOARD', 'MOD_SEGUIMIENTO', 'MOD_REPORTES'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM catalogos.rol_permisos`);
    await queryRunner.query(`DELETE FROM catalogos.permisos`);
    await queryRunner.query(`DELETE FROM catalogos.modulos`);
  }
}
