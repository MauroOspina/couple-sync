import { parseMinutes, parseRecipeText } from '@/domain/recipe-import';
import { RECIPE_EMOJIS } from '@/domain/recipes';

describe('recipe-import', () => {
  it('lee la respuesta típica de Gemini con varias recetas en Markdown', () => {
    const text = `¡Claro! Aquí tienes 3 recetas dulces con lo que tienes:

### 1. Fresas con crema y banano 🍓
**Tiempo:** 10 minutos
**Porciones:** 2

**Ingredientes:**
* 1 taza de Fresas
* 1 Banano
* 2 cucharadas de Stevia

**Preparación:**
1. Lava y corta las fresas.
2. **Mezcla:** combina todo en un bol.

---

### 2. Arepas dulces
**Tiempo:** 1 hora y 15 minutos | **Porciones:** 4

**Ingredientes:**
- 2 Arepas
- Para el relleno:
- Mango picado

**Pasos:**
1. Asa las arepas.
2. Rellénalas con mango.

**Consejo:** puedes agregar canela.

¡Disfruta tus postres!`;

    expect(parseRecipeText(text)).toEqual([
      {
        title: 'Fresas con crema y banano',
        emoji: '🍓',
        servings: 2,
        prepMinutes: 10,
        ingredients: ['1 taza de Fresas', '1 Banano', '2 cucharadas de Stevia'],
        steps: 'Lava y corta las fresas.\nMezcla: combina todo en un bol.',
      },
      {
        title: 'Arepas dulces',
        emoji: RECIPE_EMOJIS[0],
        servings: 4,
        prepMinutes: 75,
        ingredients: ['2 Arepas', 'Mango picado'],
        steps: 'Asa las arepas.\nRellénalas con mango.',
      },
    ]);
  });

  it('lee títulos en negrita numerados (Modo IA de Google)', () => {
    const text = `**1. Batido de papaya**
Tiempo de preparación: 5 min. Para 2 personas.
Ingredientes
• 1 taza de Papaya
• 1 Banano
Instrucciones
• Licúa todo.`;
    const [recipe] = parseRecipeText(text);
    expect(recipe).toMatchObject({
      title: 'Batido de papaya',
      prepMinutes: 5,
      ingredients: ['1 taza de Papaya', '1 Banano'],
      steps: 'Licúa todo.',
    });
  });

  it('lee una sola receta copiada sin formato', () => {
    const text = `Mango con limón
Tiempo: 5 min
Porciones: 1
Ingredientes:
- 1 Mango
- Jugo de Limón
Pasos:
- Pela el mango
- Agrega el limón`;
    expect(parseRecipeText(text)).toEqual([
      {
        title: 'Mango con limón',
        emoji: RECIPE_EMOJIS[0],
        servings: 1,
        prepMinutes: 5,
        ingredients: ['1 Mango', 'Jugo de Limón'],
        steps: 'Pela el mango\nAgrega el limón',
      },
    ]);
  });

  it('descarta textos sin ingredientes', () => {
    expect(parseRecipeText('Hola, ¿en qué te ayudo?')).toEqual([]);
    expect(parseRecipeText('')).toEqual([]);
    expect(parseRecipeText('### Receta sin nada\nPasos:\n1. Nada')).toEqual([]);
  });

  it('entiende tiempos en distintas formas', () => {
    expect(parseMinutes('20 minutos')).toBe(20);
    expect(parseMinutes('1 hora')).toBe(60);
    expect(parseMinutes('1 h 30 min')).toBe(90);
    expect(parseMinutes('1,5 horas')).toBe(90);
    expect(parseMinutes('45')).toBe(45);
    expect(parseMinutes('rápido')).toBeNull();
  });
});
