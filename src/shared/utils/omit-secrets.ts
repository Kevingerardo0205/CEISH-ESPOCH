/**
 * Claves secretas que nunca se guardan en la auditoría (spec-001 RF-AUD.1 a), ya normalizadas:
 * en minúsculas y sin "_" ni "-". `code` no está: es genérica (códigos de requisito o de riesgo).
 */
const SECRET_KEYS: readonly string[] = [
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

/** `refresh_token`, `Refresh-Token` y `refreshToken` → `refreshtoken`. */
function normalizeSecretKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}

/**
 * Copia profunda de `value` sin las claves secretas en ningún nivel (objetos y arreglos),
 * sea cual sea su valor (texto plano o hash). No modifica el valor original.
 */
export function omitSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => omitSecrets(item)) as T;
  }
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (!SECRET_KEYS.includes(normalizeSecretKey(key))) {
        copy[key] = omitSecrets(item);
      }
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
