import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalInvestigatorSourceRefactor1778055894119 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.protocolos 
            ADD COLUMN IF NOT EXISTS investigador_principal_inv_id INTEGER;

            ALTER TABLE public.protocolos 
            ADD CONSTRAINT fk_protocolos_ip_investigador 
            FOREIGN KEY (investigador_principal_inv_id) 
            REFERENCES public.protocolo_investigadores(id) ON DELETE SET NULL;

            COMMENT ON COLUMN public.protocolos.investigador_principal_id IS 'DEPRECATED: Usar investigador_principal_inv_id que apunta a la tabla de investigadores';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE public.protocolos DROP CONSTRAINT IF EXISTS fk_protocolos_ip_investigador;
            ALTER TABLE public.protocolos DROP COLUMN IF EXISTS investigador_principal_inv_id;
        `);
  }
}
