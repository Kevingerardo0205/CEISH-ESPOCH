import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOptimisticLockingToProtocols1797000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS version;
    `);
  }
}
