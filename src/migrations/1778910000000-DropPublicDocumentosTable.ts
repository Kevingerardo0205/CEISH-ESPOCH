import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPublicDocumentosTable1778910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la tabla obsoleta y duplicada public.documentos si existe
    await queryRunner.query(`DROP TABLE IF EXISTS public.documentos CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se realiza ninguna acción al revertir ya que la tabla estaba obsoleta, vacía y duplicada
  }
}
