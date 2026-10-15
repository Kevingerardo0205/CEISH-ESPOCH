/**
 * Normaliza Date|string|null|undefined → Date|null.
 * Cubre el caso en que pg/TypeORM entrega timestamptz como string
 * en vez de Date según la configuración del driver.
 */
export function toSafeDate(v: Date | string | null | undefined): Date | null {
  if (v == null) return null;
  return v instanceof Date ? v : new Date(v);
}
