/**
 * Reads a required environment variable and throws at startup if absent or empty.
 * Never log or expose the value; only the variable NAME appears in the error message.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[startup] La variable de entorno "${name}" es obligatoria pero no está definida. ` +
        `Defínela en tu archivo .env antes de arrancar la aplicación.`,
    );
  }
  return value;
}
