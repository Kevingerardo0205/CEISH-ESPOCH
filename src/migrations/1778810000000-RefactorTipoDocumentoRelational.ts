import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorTipoDocumentoRelational1778810000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Obtener los IDs de los tipos de estudio actuales
    const studyTypes = await queryRunner.query(
      `SELECT id, codigo FROM catalogos.tipos_estudio WHERE activo = true`,
    );
    const stMap = {};
    studyTypes.forEach((st) => (stMap[st.codigo] = st.id));

    // 2. Obtener los documentos insertados anteriormente para mapearlos
    const docs = await queryRunner.query(
      `SELECT id, codigo_anexo, tipo_estudio_aplica FROM catalogos.tipos_documento`,
    );

    // 3. Poblar la tabla relacional catalogos.tipo_documento_estudio
    for (const doc of docs) {
      const aplicaCodes = doc.tipo_estudio_aplica || [];
      for (const code of aplicaCodes) {
        if (stMap[code]) {
          await queryRunner.query(
            `INSERT INTO catalogos.tipo_documento_estudio (tipo_documento_id, tipo_estudio_id, obligatorio) 
                     VALUES ($1, $2, $3)
                     ON CONFLICT (tipo_documento_id, tipo_estudio_id) DO NOTHING`,
            [doc.id, stMap[code], true],
          );
        }
      }
    }

    // Nota: Mantenemos 'condicion_json' en tipos_documento para la lógica de flags (poblacionIndigena, etc.)
    // ya que la tabla relacional es ideal para la relación N:M con Tipos de Estudio,
    // pero los flags dependen de variables dinámicas del protocolo.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM catalogos.tipo_documento_estudio`);
  }
}
