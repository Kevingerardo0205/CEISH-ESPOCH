import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.2 (spec-001 RF-EST.1 v3.5.5): etapa y orden del protocolo en catalogos.estados.
 * La siembra es por id: los códigos APROBADO y RECHAZADO están duplicados por categoría.
 * Los estados de DOCUMENTO, de asignaciones y de CONVOCATORIA quedan con etapa y orden NULL.
 * APROBADO (17) lleva RESOLUCION; resolveProtocolStage lo sube a SEGUIMIENTO si hay resolución emitida.
 */
export class AddEtapaOrdenToEstados1890000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE catalogos.estados
        ADD COLUMN etapa VARCHAR(20) NULL,
        ADD COLUMN orden SMALLINT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE catalogos.estados
        ADD CONSTRAINT chk_estados_etapa CHECK (
          etapa IS NULL OR etapa IN (
            'RECEPCION', 'ASIGNACION', 'EVALUACION',
            'RESOLUCION', 'SEGUIMIENTO', 'RENOVACION'
          )
        ),
        ADD CONSTRAINT chk_estados_orden CHECK (orden IS NULL OR orden BETWEEN 1 AND 6),
        ADD CONSTRAINT chk_estados_etapa_orden CHECK ((etapa IS NULL) = (orden IS NULL))
    `);

    await queryRunner.query(`
      UPDATE catalogos.estados SET etapa = 'RECEPCION', orden = 1
      WHERE id IN (9, 11, 12, 15, 20, 21)
    `);
    await queryRunner.query(`
      UPDATE catalogos.estados SET etapa = 'ASIGNACION', orden = 2
      WHERE id IN (10)
    `);
    await queryRunner.query(`
      UPDATE catalogos.estados SET etapa = 'EVALUACION', orden = 3
      WHERE id IN (13, 16)
    `);
    await queryRunner.query(`
      UPDATE catalogos.estados SET etapa = 'RESOLUCION', orden = 4
      WHERE id IN (14, 17, 18, 19, 25)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE catalogos.estados
        DROP CONSTRAINT IF EXISTS chk_estados_etapa_orden,
        DROP CONSTRAINT IF EXISTS chk_estados_orden,
        DROP CONSTRAINT IF EXISTS chk_estados_etapa
    `);
    await queryRunner.query(`
      ALTER TABLE catalogos.estados
        DROP COLUMN IF EXISTS orden,
        DROP COLUMN IF EXISTS etapa
    `);
  }
}
