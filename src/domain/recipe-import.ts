import { parseIngredientLines, RECIPE_EMOJIS, type Recipe } from '@/domain/recipes';
import { normalizeText } from '@/domain/text';

/** Receta leída de un texto, lista para revisar en el editor y guardar. */
export type RecipeContent = Omit<Recipe, 'id' | 'updatedAt'>;

const MAX_SERVINGS = 50;
const MAX_MINUTES = 1440;
const MAX_TITLE_LENGTH = 120;

type Section = 'none' | 'ingredients' | 'steps';

interface Draft {
  title: string;
  emoji: string;
  servings: number | null;
  prepMinutes: number | null;
  ingredients: string[];
  steps: string[];
}

const INGREDIENTS_HEADER = /^ingredientes\b/;
const STEPS_HEADER = /^(pasos|preparacion|instrucciones|elaboracion|modo de preparacion|como se hace)\b/;
const TIME_LABEL = /(?:^|[|·•,]\s*)(?:tiempo(?: de preparacion| total| de coccion)?|duracion)\s*:\s*([^|·•]+)/;
const SERVINGS_LABEL = /(?:^|[|·•,]\s*)(?:porciones|raciones|rinde|para)\s*:?\s*(\d+)/;
/** Cierres y consejos de la IA: terminan la receta, no son pasos. */
const OUTRO = /^(?:[¡¿]\s*)?(consejos?|tips?|notas?|variantes?|disfruta|buen provecho|espero|si quieres|quieres|te gustaria)\b/;

/** Quita negritas, cursivas y encabezados de Markdown. */
function stripMarkdown(line: string): string {
  const text = line
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/\*\*|__/g, '')
    .trim();
  // Cursiva de toda la línea: *texto*. (Una viñeta "* texto" lleva espacio y no entra aquí.)
  return /^\*\S(.*\S)?\*$/.test(text) ? text.slice(1, -1).trim() : text;
}

/** "1. ", "- ", "• ", "Paso 2:" al inicio de una línea. */
function stripListMarker(line: string): string {
  return line
    .replace(/^\s*(?:[-•*·–]|\d+\s*[.)-]|paso\s*\d+\s*[:.-]?)\s*/i, '')
    .trim();
}

/** Minutos de un texto como "20 min", "1 hora", "1 h 30 min" o "45". */
export function parseMinutes(text: string): number | null {
  const value = normalizeText(text);
  const hours = value.match(/(\d+(?:[.,]\d+)?)\s*(?:h\b|hr|hora)/);
  const minutes = value.match(/(\d+)\s*(?:m\b|min)/);
  let total = 0;
  if (hours) total += Math.round(Number.parseFloat(hours[1].replace(',', '.')) * 60);
  if (minutes) total += Number.parseInt(minutes[1], 10);
  if (!hours && !minutes) {
    const plain = value.match(/\d+/);
    total = plain ? Number.parseInt(plain[0], 10) : 0;
  }
  return total > 0 ? Math.min(total, MAX_MINUTES) : null;
}

// Los emojis de comida y objetos están desde U+1F300; ☕ y similares desde U+2600.
const isEmoji = (char: string | undefined) => (char?.codePointAt(0) ?? 0) >= 0x2600;
const isJoiner = (char: string | undefined) => char === '️' || char === '‍';

/** Separa un emoji al inicio o al final del título ("🍓 Fresas con crema", "Fresas con crema 🍓"). */
function splitEmoji(title: string): { emoji: string | null; title: string } {
  const chars = Array.from(title);
  if (isEmoji(chars[0])) {
    let end = 1;
    while (isJoiner(chars[end])) end += chars[end] === '‍' ? 2 : 1;
    return { emoji: chars.slice(0, end).join(''), title: chars.slice(end).join('').trim() };
  }
  let start = chars.length - 1;
  while (start > 0 && isJoiner(chars[start])) start--;
  if (start > 0 && isEmoji(chars[start])) {
    while (start > 1 && chars[start - 1] === '‍') start -= 2;
    return { emoji: chars.slice(start).join(''), title: chars.slice(0, start).join('').trim() };
  }
  return { emoji: null, title };
}

/** ¿La línea es el título de una receta? Encabezado (#), todo en negrita o "Receta 1: ...". */
function titleFrom(raw: string): string | null {
  const line = raw.trim();
  const heading = /^#{1,6}\s+\S/.test(line);
  const bold = /^(?:\d+\s*[.)-]\s*)?\*\*[^*]+\*\*:?$/.test(line);
  const named = /^receta\s*\d*\s*[:.-]\s*\S/i.test(line);
  if (!heading && !bold && !named) return null;
  const text = stripMarkdown(line)
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^receta\s*\d*\s*[:.-]\s*/i, '')
    .replace(/:$/, '')
    .trim();
  return text || null;
}

const emptyDraft = (title: string): Draft => {
  const split = splitEmoji(title);
  return {
    title: split.title.slice(0, MAX_TITLE_LENGTH),
    emoji: split.emoji ?? RECIPE_EMOJIS[0],
    servings: null,
    prepMinutes: null,
    ingredients: [],
    steps: [],
  };
};

/**
 * Lee una o varias recetas del texto que respondió una IA (Gemini, Modo IA de Google, ChatGPT...).
 * Entiende Markdown, títulos en negrita, secciones "Ingredientes" y "Pasos/Preparación",
 * y líneas "Tiempo: 20 min" o "Porciones: 2". Descarta lo que no tenga ingredientes.
 */
export function parseRecipeText(text: string): RecipeContent[] {
  const drafts: Draft[] = [];
  // `as`: `start()` la cambia dentro de un closure y TypeScript no lo ve si se queda con el tipo `null`.
  let current = null as Draft | null;
  let section = 'none' as Section;

  const start = (title: string) => {
    if (current && current.ingredients.length === 0 && current.steps.length === 0) drafts.pop();
    current = emptyDraft(title);
    drafts.push(current);
    section = 'none';
  };

  for (const raw of text.split(/\r?\n/)) {
    const clean = stripMarkdown(raw);
    if (!clean || /^[-*_=]{3,}$/.test(clean)) continue;
    const key = normalizeText(clean);
    if (current && OUTRO.test(key)) {
      section = 'none';
      continue;
    }

    // Un encabezado de sección también puede traer contenido: "Tiempo: 20 min · Porciones: 2".
    const time = key.match(TIME_LABEL);
    const servings = key.match(SERVINGS_LABEL);
    if ((time || servings) && section === 'none') {
      if (!current) start('Receta');
      if (time) current!.prepMinutes = parseMinutes(time[1]);
      if (servings) current!.servings = Math.min(Number.parseInt(servings[1], 10), MAX_SERVINGS) || null;
      continue;
    }
    if (INGREDIENTS_HEADER.test(key)) {
      if (!current) start('Receta');
      section = 'ingredients';
      continue;
    }
    if (STEPS_HEADER.test(key) && clean.length < 40) {
      if (!current) start('Receta');
      section = 'steps';
      continue;
    }

    const title = titleFrom(raw);
    if (title && !(section === 'steps' && /^\s*\d/.test(raw))) {
      start(title);
      continue;
    }

    const item = stripListMarker(clean);
    if (!item) continue;
    if (section === 'ingredients') {
      // "Para la salsa:" es un subtítulo, no un ingrediente.
      if (!item.endsWith(':')) current!.ingredients.push(item);
    } else if (section === 'steps') {
      current!.steps.push(item);
    } else if (!current || (current.ingredients.length === 0 && current.steps.length === 0)) {
      // Texto suelto antes de los ingredientes: la última línea corta es el nombre ("Arepas dulces").
      if (item.length <= 80) {
        if (current) {
          const split = splitEmoji(item.replace(/:$/, ''));
          current.title = split.title.slice(0, MAX_TITLE_LENGTH);
          if (split.emoji) current.emoji = split.emoji;
        } else start(item.replace(/:$/, ''));
      }
    }
  }

  return drafts
    .map(draft => ({
      title: draft.title,
      emoji: draft.emoji,
      servings: draft.servings,
      prepMinutes: draft.prepMinutes,
      ingredients: parseIngredientLines(draft.ingredients.join('\n')),
      steps: draft.steps.join('\n'),
    }))
    .filter(recipe => recipe.title && recipe.ingredients.length > 0)
    .slice(0, 10);
}
