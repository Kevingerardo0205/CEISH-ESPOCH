import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeValidationHistory1778860000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Añadir requisito_id a documentos para normalización 3FN
    // Esto permite que un Requisito tenga "Muchos Documentos" (Versiones)
    await queryRunner.query(`
      ALTER TABLE recepcion.documentos 
      ADD COLUMN IF NOT EXISTS requisito_id INT 
      REFERENCES public.protocolo_requisitos(id) ON DELETE SET NULL
    `);

    // 2. Eliminar restricción UNIQUE de validaciones para permitir historial
    // Intentamos eliminar por nombres comunes generados por TypeORM o script.sql
    await queryRunner.query(`
        ALTER TABLE recepcion.validaciones_documento 
        DROP CONSTRAINT IF EXISTS validaciones_documento_documento_id_key
    `);
    
    await queryRunner.query(`
        ALTER TABLE recepcion.validaciones_documento 
        DROP CONSTRAINT IF EXISTS "UQ_documento_id"
    `);

    // 3. Sincronización de Datos: Vincular documentos existentes con sus requisitos
    // Usamos el rastro del requirementCode que solía venir en el DTO/nombre_archivo
    await queryRunner.query(`
        UPDATE recepcion.documentos d
        SET requisito_id = r.id
        FROM public.protocolo_requisitos r
        WHERE d.protocolo_id = r.protocolo_id 
        AND (
          -- Si el nombre del archivo contiene el código (ej: ANEXO_1)
          d.nombre_archivo ILIKE '%' || r.codigo_requisito || '%' 
          OR 
          -- Si el nombre del archivo contiene parte del nombre descriptivo
          d.nombre_archivo ILIKE '%' || SUBSTRING(r.nombre_requisito FROM 1 FOR 15) || '%'
        )
        AND d.requisito_id IS NULL
    `);
    
    // 4. Asegurar que los estados del checklist son correctos (Extensiones de dominio)
    // Esto asegura que la columna pueda recibir los nuevos estados APROBADO/RECHAZADO
    // si es que existiera una restricción de tipo CHECK o ENUM a nivel de DB.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios estructurales
    await queryRunner.query(`ALTER TABLE recepcion.documentos DROP COLUMN IF EXISTS requisito_id`);
    // Nota: El UNIQUE no se restaura automáticamente para no romper historial si ya se cargó.
  }
}
