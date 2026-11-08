import { STARTER_CATALOG } from '@/constants/catalog';
import {
  createStarterProducts,
  findProduct,
  finishShopping,
  guessCategory,
  summarizeCategories,
  type Product,
} from '@/domain/inventory';

const product = (id: string, name: string, status: Product['status'] = 'ok', extra: Partial<Product> = {}): Product => ({
  id,
  name,
  category: 'Otros',
  status,
  inCart: false,
  ...extra,
});

describe('inventory', () => {
  const products = [
    product('1', 'Huevos'),
    product('2', 'Queso campesino'),
    product('3', 'Queso crema', 'out'),
    product('4', 'Limón Tahití', 'low'),
  ];

  it('encuentra productos con cantidades, plurales y nombres parciales', () => {
    expect(findProduct(products, '2 huevos')?.id).toBe('1');
    expect(findProduct(products, 'queso')?.id).toBe('2');
    expect(findProduct(products, 'limones')?.id).toBe('4');
    expect(findProduct(products, 'Sal marina')).toBeUndefined();
    expect(findProduct(products, 'xy')).toBeUndefined();
  });

  it('adivina categorías por palabras clave', () => {
    expect(guessCategory('Huevos')).toBe('Lácteos y Huevos');
    expect(guessCategory('Yogur griego')).toBe('Lácteos y Huevos');
    expect(guessCategory('Pechuga de pollo')).toBe('Carnes y Embutidos');
    expect(guessCategory('Panela en bloque')).toBe('Dulces y Desayuno');
    expect(guessCategory('Cosa rara')).toBe('Otros');
  });

  it('al terminar el mercado solo cambia lo del carrito', () => {
    const list = [product('a', 'Leche', 'out', { inCart: true }), product('b', 'Pan', 'low')];
    expect(finishShopping(list)).toEqual([{ ...list[0], status: 'ok', inCart: false }]);
  });

  it('resume categorías con productos', () => {
    const list = [
      product('a', 'Leche', 'out', { category: 'Lácteos y Huevos' }),
      product('b', 'Queso', 'ok', { category: 'Lácteos y Huevos' }),
      product('c', 'Pan', 'low', { category: 'Panadería y Arepas' }),
    ];
    expect(summarizeCategories(list)).toEqual([
      { category: 'Lácteos y Huevos', emoji: '🧀', total: 2, needed: 1 },
      { category: 'Panadería y Arepas', emoji: '🍞', total: 1, needed: 1 },
    ]);
  });

  it('crea el catálogo inicial con ids únicos', () => {
    const starter = createStarterProducts();
    const expected = STARTER_CATALOG.reduce((sum, group) => sum + group.items.length, 0);
    expect(starter).toHaveLength(expected);
    expect(new Set(starter.map(item => item.id)).size).toBe(expected);
    expect(starter[0].id).toBe('1');
  });
});
