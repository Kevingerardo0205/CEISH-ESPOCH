import { MigrationInterface, QueryRunner } from 'typeorm';

export class AggressiveFixDocumentCodes1778840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Aumentar tamaño a 100 DE INMEDIATO para evitar truncamiento
    await queryRunner.query('ALTER TABLE catalogos.tipos_documento ALTER COLUMN codigo_anexo TYPE VARCHAR(100)');

    // 1. Limpiar espacios en blanco en nombres y códigos
    await queryRunner.query('UPDATE catalogos.tipos_documento SET nombre = TRIM(nombre), codigo_anexo = TRIM(codigo_anexo)');

    // 2. Mapeo forzado de códigos conocidos (PET Oficial)
    const mapping = {
      'Anexo 1: Solicitud de Evaluación': 'ANEXO_1',
      'Anexo 2: Formulario de Protocolo': 'ANEXO_2',
      'Formulario de Consentimiento Informado': 'CONSENTIMIENTO',
      'Instrumentos de Investigación (Fichas, encuestas, manuales)': 'INSTRUMENTOS_INV',
      'Currículos Vitae de Investigadores': 'CV_INVESTIGADORES',
      'Declaración de Responsabilidad (Anexo 4)': 'DECLARACION_RESP',
      'Traducción a idiomas ancestrales': 'TRADUCCION_ANCESTRAL',
      'Consentimiento Colectivo o Comunitario (Líder/Asamblea)': 'CONSENTIMIENTO_COMUNITARIO',
      'Declaratoria de Compromiso de Confidencialidad': 'DECLARATORIA_CONF',
      'Declaración de Conflicto de Interés': 'DECLARACION_CI',
      'Carta de Interés Institucional (Anexo 5)': 'CARTA_INTERES',
      'Ficha Descriptiva de la Intervención y Riesgos': 'FICHA_INTERVENCION',
      'Copia de Póliza de Seguro de Responsabilidad Civil': 'POLIZA_SEGURO',
      'Documentos de Idoneidad de Instalaciones': 'IDONEIDAD_INST',
      'Anexo 6: Carta de Solicitud de Evaluación': 'ANEXO_6',
      'Hoja de Vida del IP e Investigadores': 'CV_IP',
      'Protocolo de Investigación (Original y Castellano)': 'PROTOCOLO_COMPLETO',
      'Ficha Descriptiva de Ensayos Clínicos': 'FICHA_DESCRIPTIVA',
      'Manual del Investigador (Buenas Prácticas Clínicas)': 'MANUAL_INV',
      'Procedimientos e Instrumentos de Reclutamiento y Recolección': 'INSTRUMENTOS_REC',
      'Certificados de Capacitación y Experiencia (Bioética)': 'CERT_CAPACITACION',
      'Registro SENESCYT del Investigador Principal': 'REGISTRO_SENESCYT',
      'Información sobre Seguridad del Fármaco Experimental': 'INFO_SEG_FARMACO',
      'Copia del Contrato entre Promotor e Investigadores': 'CONTRATO_PROMOTOR',
      'Plan de Monitoreo del Ensayo Clínico': 'PLAN_MONITOREO',
      'Plan de Seguridad del Participante': 'PLAN_SEGURIDAD',
      'Carta de Aprobación del Comité de Ética del País de Origen': 'APROBACION_PAIS_ORIGEN',
    };

    for (const [nombre, codigo] of Object.entries(mapping)) {
      await queryRunner.query(
        'UPDATE catalogos.tipos_documento SET codigo_anexo = $1 WHERE nombre = $2',
        [codigo, nombre]
      );
    }

    // 3. Fallback para cualquier otro que haya quedado vacío (Generar código del nombre)
    await queryRunner.query(`
        UPDATE catalogos.tipos_documento 
        SET codigo_anexo = UPPER(REPLACE(REPLACE(REPLACE(nombre, ' ', '_'), ':', ''), '/', '_'))
        WHERE codigo_anexo IS NULL OR codigo_anexo = ''
    `);

    // 4. Asegurar que las relaciones existan en la tabla relacional para los 3 tipos activos
    const types = await queryRunner.query('SELECT id, codigo FROM catalogos.tipos_estudio WHERE activo = true');
    for (const t of types) {
        await queryRunner.query(`
            INSERT INTO catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio)
            SELECT id, $1, true 
            FROM catalogos.tipos_documento 
            WHERE tipo_estudio_aplica::jsonb ? $2
            ON CONFLICT DO NOTHING
        `, [t.id, t.codigo]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
      // No revertimos cambios de datos críticos
  }
}
