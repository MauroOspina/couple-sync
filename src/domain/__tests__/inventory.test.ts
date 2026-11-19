import { STARTER_CATALOG } from '@/constants/catalog';
import {
  createStarterProducts,
  findProduct,
  finishShopping,
  formatShoppingList,
  guessCategory,
  isOnList,
  splitMarket,
  summarizeCategories,
  withStatus,
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
    expect(finishShopping(list)).toEqual([{ ...list[0], status: 'ok', inCart: false, onList: null }]);
  });

  it('solo "Falta" entra sola a la lista; "Queda poco" y lo quitado a mano quedan fuera', () => {
    expect(isOnList(product('a', 'Leche', 'out'))).toBe(true);
    expect(isOnList(product('b', 'Pan', 'low'))).toBe(false);
    expect(isOnList(product('c', 'Sal', 'out', { onList: false }))).toBe(false);
    expect(isOnList(product('d', 'Café', 'low', { onList: true }))).toBe(true);
    expect(isOnList(product('e', 'Arroz', 'ok', { onList: true }))).toBe(false);
  });

  it('al cambiar el estado se olvida la decisión de la lista', () => {
    const removed = product('a', 'Sal', 'out', { onList: false, inCart: true });
    expect(withStatus(removed, 'out')).toBe(removed);
    expect(withStatus(removed, 'low')).toEqual({ ...removed, status: 'low', onList: null, inCart: false });
    expect(withStatus(removed, 'ok')).toEqual({ ...removed, status: 'ok', onList: null, inCart: false });
  });

  it('separa el mercado en la lista y lo que queda fuera', () => {
    const list = [
      product('1', 'Leche', 'out'),
      product('2', 'Pan', 'low'),
      product('3', 'Arroz', 'ok'),
      product('4', 'Azúcar', 'out', { onList: false }),
    ];
    const { listed, offList } = splitMarket(list);
    expect(listed.map(item => item.name)).toEqual(['Leche']);
    expect(offList.map(item => item.name)).toEqual(['Azúcar', 'Pan']);
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

  it('arma la lista del mercado para compartir, por categoría y marcando el carrito', () => {
    const list = [
      product('1', 'Pan', 'low', { category: 'Panadería y Arepas', onList: true }),
      product('6', 'Queso', 'low', { category: 'Lácteos y Huevos' }),
      product('2', 'Leche', 'out', { category: 'Lácteos y Huevos', inCart: true }),
      product('3', 'Huevos', 'out', { category: 'Lácteos y Huevos' }),
      product('4', 'Arroz', 'ok', { category: 'Granos' }),
    ];
    expect(formatShoppingList(list)).toBe(
      '🛒 Lista del mercado\n\n🧀 Lácteos y Huevos\n• Huevos\n✅ Leche\n\n🍞 Panadería y Arepas\n• Pan',
    );
    expect(formatShoppingList([product('5', 'Sal')])).toBe('');
  });
});
