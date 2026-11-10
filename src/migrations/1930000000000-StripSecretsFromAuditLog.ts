import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * TSK-001.15 (spec-001 v3.7.3, RF-AUD.1 b): quita los secretos que quedaron guardados en
 * sistema.audit_log antes de RF-AUD.1 a (p. ej. la contraseña del cuerpo de POST /auth/users).
 *
 * - Quita, en cualquier nivel (objetos y arreglos) de `datos_nuevos` y `datos_anteriores`, toda clave
 *   cuyo nombre en minúsculas y sin "_" ni "-" esté en SECRET_KEYS, sea texto plano o hash. Es la
 *   misma lista que `omitSecrets` (src/shared/utils/omit-secrets.ts), copiada aquí a propósito: una
 *   migración no cambia aunque cambie el código de la aplicación.
 * - Solo actualiza las filas que tienen alguna de esas claves. No hay tabla de respaldo ni copia de
 *   los valores en ningún lado. La función SQL es temporal (pg_temp): no queda en el esquema.
 * - Guard de la base: el de src/config/typeorm-cli.config.ts:13-27 (MIGRATION_CONFIRM_DB = DB_NAME).
 *   El agente solo la corre en ceish_test_db; en ceish_db la aplica la usuaria.
 */
const SECRET_KEYS = [
  'password',
  'contrasena',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'otp',
];

const STRIP_FN = 'pg_temp.tsk_001_15_strip_secrets';

export class StripSecretsFromAuditLog1930000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const keys = SECRET_KEYS.map((k) => `'${k}'`).join(', ');
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION ${STRIP_FN}(j jsonb) RETURNS jsonb
      LANGUAGE plpgsql IMMUTABLE AS $fn$
      BEGIN
        IF j IS NULL THEN
          RETURN NULL;
        END IF;
        IF jsonb_typeof(j) = 'object' THEN
          RETURN COALESCE((
            SELECT jsonb_object_agg(e.key, ${STRIP_FN}(e.value))
              FROM jsonb_each(j) AS e
             WHERE lower(regexp_replace(e.key, '[_-]', '', 'g')) <> ALL (ARRAY[${keys}]::text[])
          ), '{}'::jsonb);
        END IF;
        IF jsonb_typeof(j) = 'array' THEN
          RETURN COALESCE((
            SELECT jsonb_agg(${STRIP_FN}(x.value) ORDER BY x.ord)
              FROM jsonb_array_elements(j) WITH ORDINALITY AS x(value, ord)
          ), '[]'::jsonb);
        END IF;
        RETURN j;
      END
      $fn$
    `);

    const [, affected] = (await queryRunner.query(`
      UPDATE sistema.audit_log
         SET datos_nuevos = ${STRIP_FN}(datos_nuevos),
             datos_anteriores = ${STRIP_FN}(datos_anteriores)
       WHERE datos_nuevos IS DISTINCT FROM ${STRIP_FN}(datos_nuevos)
          OR datos_anteriores IS DISTINCT FROM ${STRIP_FN}(datos_anteriores)
    `)) as [unknown, number];

    await queryRunner.query(`DROP FUNCTION ${STRIP_FN}(jsonb)`);

    // Solo el conteo: nunca se imprimen valores.
    console.log(
      `[TSK-001.15] sistema.audit_log: ${affected} filas depuradas de secretos.`,
    );
  }

  /**
   * Sin reversión, a propósito: los secretos no deben volver a la base. Excepción a la Regla 14 de
   * docs/doc_base/constitution_v2.md (:103-108, «migraciones incrementales y reversibles») aprobada
   * por la usuaria el 10/11/2026 por motivo de seguridad (RF-AUD.1 b, TSK-001.15).
   */
  public down(): Promise<void> {
    return Promise.resolve();
  }
}
