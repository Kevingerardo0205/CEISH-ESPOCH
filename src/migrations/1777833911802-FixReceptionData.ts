import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixReceptionData1777833911802 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar duplicados (deja solo 1 por protocolo_id)
    await queryRunner.query(`
            DELETE FROM recepcion.recepciones r
            USING recepcion.recepciones r2
            WHERE r.protocolo_id = r2.protocolo_id
            AND r.ctid < r2.ctid;
        `);

    // 2. Asegurar que protocolo_id no sea NULL
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            ALTER COLUMN protocolo_id SET NOT NULL;
        `);

    // 3. Agregar UNIQUE para evitar duplicados futuros
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            ADD CONSTRAINT unique_protocolo_id UNIQUE (protocolo_id);
        `);

    // 4. (Opcional pero recomendado) FK hacia protocolos
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            ADD CONSTRAINT fk_recepcion_protocolo
            FOREIGN KEY (protocolo_id)
            REFERENCES public.protocolos(id)
            ON DELETE CASCADE;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir FK
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            DROP CONSTRAINT IF EXISTS fk_recepcion_protocolo;
        `);

    // Revertir UNIQUE
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            DROP CONSTRAINT IF EXISTS unique_protocolo_id;
        `);

    // Permitir NULL otra vez (opcional)
    await queryRunner.query(`
            ALTER TABLE recepcion.recepciones
            ALTER COLUMN protocolo_id DROP NOT NULL;
        `);
  }
}
