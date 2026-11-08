import { capitalize, cleanIngredientName, matchKey, normalizeText, singularize, stripQuantity } from '@/domain/text';

describe('text', () => {
  it('normaliza tildes, mayúsculas y espacios', () => {
    expect(normalizeText('  Jamón  Serrano ')).toBe('jamon serrano');
  });

  it('capitaliza sin tocar el resto', () => {
    expect(capitalize('  leche entera')).toBe('Leche entera');
    expect(capitalize('')).toBe('');
  });

  it('convierte plurales comunes a singular', () => {
    expect(singularize('limones')).toBe('limon');
    expect(singularize('tomates')).toBe('tomate');
    expect(singularize('huevos')).toBe('huevo');
    expect(singularize('nueces')).toBe('nuez');
    expect(singularize('panes')).toBe('pan');
    expect(singularize('pan')).toBe('pan');
  });

  it('quita cantidades y unidades del inicio', () => {
    expect(stripQuantity('200 g de queso campesino')).toBe('queso campesino');
    expect(stripQuantity('una taza de arroz')).toBe('arroz');
    expect(stripQuantity('lata de atun')).toBe('atun');
    expect(stripQuantity('gelatina')).toBe('gelatina');
  });

  it('limpia ingredientes conservando tildes', () => {
    expect(cleanIngredientName('200 g de queso costeño')).toBe('Queso costeño');
    expect(cleanIngredientName('2 Arepas')).toBe('Arepas');
  });

  it('genera claves comparables', () => {
    expect(matchKey('2 Huevos')).toBe(matchKey('huevo'));
    expect(matchKey('Champiñones tajados')).toBe('champinon tajado');
  });
});
