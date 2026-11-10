/**
 * Copia profunda de `value` sin las claves de `keys` en ningún nivel (objetos y arreglos).
 * No modifica el valor original. Pensada para dejar datos personales fuera de la auditoría
 * (spec-001 RF-02.6 b; la reutiliza PROTOCOL_UPDATED en RF-02.8 g).
 */
export function omitPersonalData<T>(value: T, keys: readonly string[]): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => omitPersonalData(item, keys)) as T;
  }
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (!keys.includes(key)) copy[key] = omitPersonalData(item, keys);
    }
    return copy as T;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
