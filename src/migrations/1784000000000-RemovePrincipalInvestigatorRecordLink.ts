import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePrincipalInvestigatorRecordLink1784000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar la restricción de clave foránea
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP CONSTRAINT IF EXISTS "FK_be4479657b5156e8d8412f7b21d" CASCADE;
    `);

    // 2. Eliminar la columna de la tabla public.protocolos
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      DROP COLUMN IF EXISTS investigador_principal_inv_id CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar de vuelta la columna
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD COLUMN investigador_principal_inv_id INT;
    `);

    // 2. Agregar de vuelta el constraint de FK
    await queryRunner.query(`
      ALTER TABLE public.protocolos 
      ADD CONSTRAINT "FK_be4479657b5156e8d8412f7b21d" 
      FOREIGN KEY (investigador_principal_inv_id) 
      REFERENCES public.protocolo_investigadores(id) 
      ON DELETE SET NULL;
    `);

    // 3. Repopular los datos buscando el registro de IP en la tabla intermedia
    await queryRunner.query(`
      UPDATE public.protocolos p
      SET investigador_principal_inv_id = pi.id
      FROM public.protocolo_investigadores pi
      WHERE pi.protocolo_id = p.id 
        AND pi.usuario_id = p.investigador_principal_id 
        AND pi.rol = 'PRINCIPAL';
    `);
  }
}
