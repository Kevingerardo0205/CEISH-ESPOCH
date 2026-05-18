import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedTiposDocumento1778800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Aumentar tamaño de columna codigo_anexo
    await queryRunner.query(`ALTER TABLE catalogos.tipos_documento ALTER COLUMN codigo_anexo TYPE VARCHAR(50)`);

    // 1. Limpieza de Tipos de Estudio (Desactivar EX para no romper integridad referencial)
    await queryRunner.query(`UPDATE catalogos.tipos_estudio SET activo = false WHERE codigo = 'EX'`);

    // 2. Insertar Tipos de Documento
    const docs = [
      {
        nombre: 'Anexo 1: Solicitud de Evaluación',
        codigo_anexo: 'ANEXO_1',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [] } },
      },
      {
        nombre: 'Anexo 2: Formulario de Protocolo',
        codigo_anexo: 'ANEXO_2',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [] } },
      },
      {
        nombre: 'Formulario de Consentimiento Informado',
        codigo_anexo: 'CONSENTIMIENTO',
        aplica: ['IO', 'EI', 'EC'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [], EC: [] } },
      },
      {
        nombre: 'Instrumentos de Investigación (Fichas, encuestas, manuales)',
        codigo_anexo: 'INSTRUMENTOS_INV',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [] } },
      },
      {
        nombre: 'Currículos Vitae de Investigadores',
        codigo_anexo: 'CV_INVESTIGADORES',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [] } },
      },
      {
        nombre: 'Declaración de Responsabilidad (Anexo 4)',
        codigo_anexo: 'DECLARACION_RESP',
        aplica: ['IO', 'EI', 'EC'],
        condicion: { condiciones_por_tipo: { IO: [], EI: [], EC: [] } },
      },
      {
        nombre: 'Traducción a idiomas ancestrales',
        codigo_anexo: 'TRADUCCION_ANCESTRAL',
        aplica: ['IO', 'EI', 'EC'],
        condicion: { condiciones_por_tipo: { IO: ['poblacionIndigena'], EI: ['poblacionIndigena'], EC: ['poblacionIndigena'] } },
      },
      {
        nombre: 'Consentimiento Colectivo o Comunitario (Líder/Asamblea)',
        codigo_anexo: 'CONSENTIMIENTO_COMUNITARIO',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: ['poblacionIndigena'], EI: ['poblacionIndigena'] } },
      },
      {
        nombre: 'Declaratoria de Compromiso de Confidencialidad',
        codigo_anexo: 'DECLARATORIA_CONF',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: ['muestras', 'vulnerable'], EI: ['muestras', 'vulnerable'] } },
      },
      {
        nombre: 'Declaración de Conflicto de Interés',
        codigo_anexo: 'DECLARACION_CI',
        aplica: ['IO', 'EI'],
        condicion: { condiciones_por_tipo: { IO: ['muestras', 'vulnerable'], EI: ['muestras', 'vulnerable'] } },
      },
      {
        nombre: 'Carta de Interés Institucional (Anexo 5)',
        codigo_anexo: 'CARTA_INTERES',
        aplica: ['IO', 'EI', 'EC'],
        condicion: { condiciones_por_tipo: { IO: ['institucionesPublicas'], EI: ['institucionesPublicas'], EC: [] } },
      },
      {
        nombre: 'Ficha Descriptiva de la Intervención y Riesgos',
        codigo_anexo: 'FICHA_INTERVENCION',
        aplica: ['EI'],
        condicion: { condiciones_por_tipo: { EI: [] } },
      },
      {
        nombre: 'Copia de Póliza de Seguro de Responsabilidad Civil',
        codigo_anexo: 'POLIZA_SEGURO',
        aplica: ['EI', 'EC'],
        condicion: { condiciones_por_tipo: { EI: ['riesgoMayor'], EC: [] } },
      },
      {
        nombre: 'Documentos de Idoneidad de Instalaciones',
        codigo_anexo: 'IDONEIDAD_INST',
        aplica: ['EI'],
        condicion: { condiciones_por_tipo: { EI: ['riesgoMayor'] } },
      },
      {
        nombre: 'Anexo 6: Carta de Solicitud de Evaluación',
        codigo_anexo: 'ANEXO_6',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Hoja de Vida del IP e Investigadores',
        codigo_anexo: 'CV_IP',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Protocolo de Investigación (Original y Castellano)',
        codigo_anexo: 'PROTOCOLO_COMPLETO',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Ficha Descriptiva de Ensayos Clínicos',
        codigo_anexo: 'FICHA_DESCRIPTIVA',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Manual del Investigador (Buenas Prácticas Clínicas)',
        codigo_anexo: 'MANUAL_INV',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Procedimientos e Instrumentos de Reclutamiento y Recolección',
        codigo_anexo: 'INSTRUMENTOS_REC',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Certificados de Capacitación y Experiencia (Bioética)',
        codigo_anexo: 'CERT_CAPACITACION',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Registro SENESCYT del Investigador Principal',
        codigo_anexo: 'REGISTRO_SENESCYT',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Información sobre Seguridad del Fármaco Experimental',
        codigo_anexo: 'INFO_SEG_FARMACO',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Copia del Contrato entre Promotor e Investigadores',
        codigo_anexo: 'CONTRATO_PROMOTOR',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Plan de Monitoreo del Ensayo Clínico',
        codigo_anexo: 'PLAN_MONITOREO',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Plan de Seguridad del Participante',
        codigo_anexo: 'PLAN_SEGURIDAD',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: [] } },
      },
      {
        nombre: 'Carta de Aprobación del Comité de Ética del País de Origen',
        codigo_anexo: 'APROBACION_PAIS_ORIGEN',
        aplica: ['EC'],
        condicion: { condiciones_por_tipo: { EC: ['multicentrico'] } },
      },
    ];

    for (const doc of docs) {
      const exists = await queryRunner.query(
        `SELECT id FROM catalogos.tipos_documento WHERE nombre = $1`,
        [doc.nombre]
      );

      if (exists.length > 0) {
        await queryRunner.query(
          `UPDATE catalogos.tipos_documento SET 
            codigo_anexo = $1,
            tipo_estudio_aplica = $2,
            condicion_json = $3,
            es_obligatorio = $4
           WHERE nombre = $5`,
          [doc.codigo_anexo, JSON.stringify(doc.aplica), JSON.stringify(doc.condicion), true, doc.nombre]
        );
      } else {
        await queryRunner.query(
          `INSERT INTO catalogos.tipos_documento (nombre, codigo_anexo, tipo_estudio_aplica, condicion_json, es_obligatorio) 
           VALUES ($1, $2, $3, $4, $5)`,
          [doc.nombre, doc.codigo_anexo, JSON.stringify(doc.aplica), JSON.stringify(doc.condicion), true]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM catalogos.tipos_documento`);
  }
}
