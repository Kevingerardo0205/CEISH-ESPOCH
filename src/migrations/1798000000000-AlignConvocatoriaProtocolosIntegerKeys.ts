import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignConvocatoriaProtocolosIntegerKeys1798000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. REGLA DE SEGURIDAD: Verificar el estado actual de evaluacion.convocatoria_protocolos
    const existingRows = await queryRunner.query(
      `SELECT id, convocatoria_id, protocolo_id, version_id FROM evaluacion.convocatoria_protocolos;`,
    );

    if (existingRows.length > 1) {
      throw new Error(
        `MIGRATION ABORTED: Se encontraron ${existingRows.length} registros en evaluacion.convocatoria_protocolos. Se esperaba únicamente 0 o 1 registro mock.`,
      );
    }

    if (existingRows.length === 1) {
      const row = existingRows[0];
      const expectedId = 'fb2fc4a6-055a-46cb-be7b-37fbf9fd741d';
      const expectedProtocoloId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const expectedVersionId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      if (
        row.id !== expectedId ||
        row.protocolo_id !== expectedProtocoloId ||
        row.version_id !== expectedVersionId
      ) {
        throw new Error(
          `MIGRATION ABORTED: El registro encontrado en evaluacion.convocatoria_protocolos (id: ${row.id}) no coincide exactamente con el mock esperado de pruebas.`,
        );
      }

      // 2. Eliminar únicamente el registro mock comprobado
      await queryRunner.query(
        `DELETE FROM evaluacion.convocatoria_protocolos WHERE id = $1;`,
        [expectedId],
      );
    }

    // 3. Cambiar protocolo_id de UUID a INTEGER NOT NULL
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      DROP COLUMN IF EXISTS protocolo_id;
    `);
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      ADD COLUMN protocolo_id INTEGER NOT NULL;
    `);

    // 4. Cambiar version_id de UUID a INTEGER NOT NULL
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      DROP COLUMN IF EXISTS version_id;
    `);
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      ADD COLUMN version_id INTEGER NOT NULL;
    `);

    // 5. Crear Foreign Keys con comportamiento RESTRICT
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_convocatoria_protocolos_protocolo'
        ) THEN
          ALTER TABLE evaluacion.convocatoria_protocolos
          ADD CONSTRAINT "FK_convocatoria_protocolos_protocolo"
          FOREIGN KEY ("protocolo_id") REFERENCES public.protocolos("id")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_convocatoria_protocolos_version'
        ) THEN
          ALTER TABLE evaluacion.convocatoria_protocolos
          ADD CONSTRAINT "FK_convocatoria_protocolos_version"
          FOREIGN KEY ("version_id") REFERENCES public.versiones_protocolo("id")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar Foreign Keys agregadas
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
      DROP CONSTRAINT IF EXISTS "FK_convocatoria_protocolos_version";
    `);

    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos
      DROP CONSTRAINT IF EXISTS "FK_convocatoria_protocolos_protocolo";
    `);

    // 2. Revertir columnas a UUID
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      DROP COLUMN IF EXISTS version_id;
    `);
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      ADD COLUMN version_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      DROP COLUMN IF EXISTS protocolo_id;
    `);
    await queryRunner.query(`
      ALTER TABLE evaluacion.convocatoria_protocolos 
      ADD COLUMN protocolo_id UUID;
    `);

    // NOTA: El registro mock de test 'fb2fc4a6-055a-46cb-be7b-37fbf9fd741d' no se recrea
    // artificialmente al revertir para no contaminar la base de datos con datos sintéticos.
  }
}
