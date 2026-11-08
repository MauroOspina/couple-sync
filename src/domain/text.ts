/** Minúsculas, sin tildes y sin espacios repetidos: "  Jamón  Serrano " → "jamon serrano". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Primera letra en mayúscula, resto intacto: "leche entera" → "Leche entera". */
export function capitalize(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase('es') + trimmed.slice(1) : trimmed;
}

/** Singular aproximado en español, palabra por palabra: "limones" → "limon", "tomates" → "tomate". */
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ces')) return `${word.slice(0, -3)}z`;
  if (word.endsWith('es') && /[lnrdjy]$/.test(word.slice(0, -2))) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

const QUANTITY_PATTERN =
  /^((\d+([.,/]\d+)?|un|una|unos|unas|medio|media|1\/2)\s+)?((g|gr|grs|gramos?|kg|kilos?|ml|l|lt|litros?|lb|libras?|oz|tazas?|cdas?|cdtas?|cucharadas?|cucharaditas?|unidades?|und|paquetes?|latas?|dientes?|pizcas?|tiras?|rodajas?|porciones?)\s+)?(de\s+)?/;

/** Quita cantidades y unidades del inicio: "200 g de queso campesino" → "queso campesino". */
export function stripQuantity(normalized: string): string {
  return normalized.replace(QUANTITY_PATTERN, '').trim();
}

/** Versión legible sin cantidades, conservando tildes: "200 g de queso costeño" → "Queso costeño". */
export function cleanIngredientName(value: string): string {
  return capitalize(value.trim().replace(new RegExp(QUANTITY_PATTERN.source, 'i'), ''));
}

/** Clave comparable para buscar productos por nombre. */
export function matchKey(value: string): string {
  return stripQuantity(normalizeText(value))
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .join(' ');
}
