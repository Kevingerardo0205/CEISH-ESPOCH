/** Carácter de escape usado con `ILIKE ... ESCAPE '\'`. */
export const LIKE_ESCAPE_CHAR = '\\';

/**
 * Escapa `\`, `%` y `_` para que el término se busque literalmente en un LIKE/ILIKE
 * (usar con `ESCAPE '\'`). TSK-001.4, spec-001 RF-EST.3.
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (ch) => `${LIKE_ESCAPE_CHAR}${ch}`);
}
