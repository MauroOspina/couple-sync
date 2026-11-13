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

  it('arma la despensa para la IA: solo comida, sin agotados ni repetidos', () => {
    const products = [
      { name: 'Huevos', status: 'ok' as const, category: 'Lácteos y Huevos' },
      { name: 'Leche', status: 'out' as const, category: 'Lácteos y Huevos' },
      { name: 'Arroz', status: 'low' as const, category: 'Despensa y Salsas' },
      { name: 'huevos ', status: 'ok' as const, category: 'Lácteos y Huevos' },
      { name: '  ', status: 'ok' as const, category: 'Frutas' },
      { name: 'Advil', status: 'ok' as const, category: 'Farmacia' },
      { name: 'Shampoo', status: 'ok' as const, category: 'Aseo Personal' },
      { name: 'Detergente', status: 'ok' as const, category: 'Aseo Hogar' },
      { name: 'Concentrado', status: 'ok' as const, category: 'Mascotas' },
      { name: 'Trampa Raid', status: 'ok' as const, category: 'Otros' },
      { name: 'Sin categoría', status: 'ok' as const, category: '' },
    ];
    expect(pantryForIdeas(products)).toEqual(['Huevos', 'Arroz']);
  });

  it('pone el antojo primero y como condición', () => {
    const prompt = buildRecipePrompt(['Fresas', 'Banano'], '  algo dulce ');
    expect(prompt.startsWith('Tengo antojo de: algo dulce.')).toBe(true);
    expect(prompt).toContain('que cumplan ese antojo');
    expect(prompt.indexOf('antojo')).toBeLessThan(prompt.indexOf('Tengo: Fresas, Banano.'));
  });

  it('arma la pregunta sin antojo y sin despensa', () => {
    expect(buildRecipePrompt(['Huevos'], '')).not.toContain('antojo');
    expect(buildRecipePrompt([], '')).not.toContain('Tengo:');
  });

  it('corta la lista de ingredientes para que el link no sea muy largo', () => {
    const many = Array.from({ length: 300 }, (_, i) => `Producto número ${i}`);
    const prompt = buildRecipePrompt(many, 'x'.repeat(500), 1200);
    expect(prompt.length).toBeLessThanOrEqual(1200);
    expect(prompt).toContain('Producto número 0');
    expect(prompt).toContain(' y más.');
    expect(prompt).toContain(`Tengo antojo de: ${'x'.repeat(200)}.`);
  });
});
