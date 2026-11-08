import type { Product } from '@/domain/inventory';
import { checkIngredients, parseIngredientLines, parsePositiveInt, summarizeAvailability } from '@/domain/recipes';

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
});
