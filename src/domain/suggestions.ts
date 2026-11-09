/** Mismos límites que el `check` de `suggestions.message` en supabase/schema.sql. */
export const SUGGESTION_MIN_LENGTH = 5;
export const SUGGESTION_MAX_LENGTH = 2000;

/** Cuenta caracteres como Postgres (un emoji = 1), no como JS (un emoji = 2). */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

/**
 * Deja la sugerencia lista para enviar: sin espacios al final de las líneas ni más de una
 * línea en blanco seguida, recortada al máximo. `null` si queda demasiado corta.
 */
export function prepareSuggestion(value: string): string | null {
  const text = value
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (characterCount(text) < SUGGESTION_MIN_LENGTH) return null;
  return Array.from(text).slice(0, SUGGESTION_MAX_LENGTH).join('');
}
