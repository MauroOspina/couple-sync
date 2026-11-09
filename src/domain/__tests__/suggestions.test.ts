import { characterCount, prepareSuggestion, SUGGESTION_MAX_LENGTH } from '@/domain/suggestions';

describe('suggestions', () => {
  it('limpia espacios y líneas en blanco repetidas', () => {
    expect(prepareSuggestion('  Modo oscuro   \n\n\n\nporfa  ')).toBe('Modo oscuro\n\nporfa');
  });

  it('rechaza mensajes demasiado cortos', () => {
    expect(prepareSuggestion('   ')).toBeNull();
    expect(prepareSuggestion('hola')).toBeNull();
    expect(prepareSuggestion('hola!')).toBe('hola!');
  });

  it('cuenta los emojis como un carácter, igual que Postgres', () => {
    expect(characterCount('😀😀😀')).toBe(3);
    expect(prepareSuggestion('😀😀😀😀')).toBeNull();
  });

  it('recorta al máximo sin partir emojis', () => {
    const long = '😀'.repeat(SUGGESTION_MAX_LENGTH + 10);
    const result = prepareSuggestion(long);
    expect(result && characterCount(result)).toBe(SUGGESTION_MAX_LENGTH);
  });
});
