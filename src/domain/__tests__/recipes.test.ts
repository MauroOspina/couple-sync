import type { Product } from '@/domain/inventory';
import {
  buildRecipePrompt,
  checkIngredients,
  pantryForIdeas,
  parseIngredientLines,
  parsePositiveInt,
  summarizeAvailability,
} from '@/domain/recipes';

const product = (id: string, name: string, status: Product['status']): Product => ({
  id,
  name,
  category: 'Otros',
  status,
});

describe('recipes', () => {
  it('limpia la lista de ingredientes del editor', () => {
    expect(parseIngredientLines('- 2 huevos\n• Queso\n\n2 huevos\n1. Sal')).toEqual(['2 huevos', 'Queso', 'Sal']);
  });

  it('cruza ingredientes con la despensa', () => {
    const products = [product('1', 'Huevos', 'ok'), product('2', 'Queso campesino', 'low'), product('3', 'Arepas', 'out')];
    const checks = checkIngredients({ ingredients: ['2 huevos', 'Queso campesino', 'Arepas', 'Sal marina'] }, products);

    expect(checks.map(check => check.state)).toEqual(['have', 'low', 'missing', 'unknown']);
    expect(summarizeAvailability(checks)).toEqual({ have: 1, total: 4, unknown: ['Sal marina'], alreadyNeeded: 2 });
  });

  it('lee números positivos con tope', () => {
    expect(parsePositiveInt('2 porciones', 50)).toBe(2);
    expect(parsePositiveInt('0', 50)).toBeNull();
    expect(parsePositiveInt('999', 50)).toBe(50);
    expect(parsePositiveInt('', 50)).toBeNull();
  });

  it('arma la despensa para la IA sin agotados ni repetidos', () => {
    const products = [
      { name: 'Huevos', status: 'ok' as const },
      { name: 'Leche', status: 'out' as const },
      { name: 'Arroz', status: 'low' as const },
      { name: 'huevos ', status: 'ok' as const },
      { name: '  ', status: 'ok' as const },
    ];
    expect(pantryForIdeas(products)).toEqual(['Huevos', 'Arroz']);
  });

  it('arma la pregunta para la IA con la despensa y el antojo', () => {
    const prompt = buildRecipePrompt(['Huevos', 'Arroz'], '  algo rápido ');
    expect(prompt).toContain('Tengo: Huevos, Arroz.');
    expect(prompt).toContain('Antojo: algo rápido.');
    expect(buildRecipePrompt([], '')).not.toContain('Tengo');
  });

  it('corta la lista de ingredientes para que el link no sea muy largo', () => {
    const many = Array.from({ length: 300 }, (_, i) => `Producto número ${i}`);
    const prompt = buildRecipePrompt(many, 'x'.repeat(500), 1200);
    expect(prompt.length).toBeLessThanOrEqual(1200);
    expect(prompt).toContain('Producto número 0');
    expect(prompt).toContain(' y más.');
    expect(prompt).toContain(`Antojo: ${'x'.repeat(200)}.`);
  });
});
