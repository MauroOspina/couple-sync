import { useMemo, useState } from 'react';
import { Alert, Linking, Share, View } from 'react-native';

import { AppText, Banner, Button, Sheet, TextField } from '@/components/ui';
import { APP_CONFIG } from '@/constants/config';
import { spacing } from '@/constants/theme';
import { parseRecipeText, type RecipeContent } from '@/domain/recipe-import';
import { buildRecipePrompt, MAX_CRAVING_LENGTH, pantryForIdeas } from '@/domain/recipes';
import { makeStyles } from '@/hooks/use-app-theme';
import { useInventory } from '@/providers/inventory-provider';

/** Modo IA de Google (`udm=50`). No es una URL documentada: si deja de funcionar, queda "Enviar a otra app". */
const GOOGLE_AI_MODE_URL = 'https://www.google.com/search?udm=50&q=';
const MAX_PASTE_LENGTH = 20000;

interface RecipeIdeasSheetProps {
  visible: boolean;
  onClose: () => void;
  /** La persona pegó una receta y eligió guardarla: se abre el editor ya lleno. */
  onImport: (recipe: RecipeContent) => void;
  /** Texto que llegó compartido desde otra app: se muestra ya pegado y leído. */
  initialPaste?: string | null;
}

/**
 * Ideas de recetas con la IA de cada persona: arma una pregunta con la despensa y la abre en el
 * Modo IA de Google o la comparte con Gemini, ChatGPT, etc. La app no envía datos a ninguna IA.
 * La receta que guste se pega de vuelta y la app la convierte en receta propia.
 */
export function RecipeIdeasSheet({ visible, onClose, onImport, initialPaste }: RecipeIdeasSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Ideas con IA">
      {visible ? <IdeasContent key={initialPaste ?? ''} onImport={onImport} initialPaste={initialPaste} /> : null}
    </Sheet>
  );
}

function IdeasContent({ onImport, initialPaste }: Pick<RecipeIdeasSheetProps, 'onImport' | 'initialPaste'>) {
  const styles = useStyles();
  const { products } = useInventory();
  const [craving, setCraving] = useState('');
  const [pasted, setPasted] = useState(initialPaste ?? '');
  const [found, setFound] = useState<RecipeContent[]>(() => (initialPaste ? parseRecipeText(initialPaste) : []));
  const pantry = useMemo(() => pantryForIdeas(products), [products]);
  const prompt = buildRecipePrompt(pantry, craving);
  const empty = pantry.length === 0;

  const openGoogle = () => {
    Linking.openURL(GOOGLE_AI_MODE_URL + encodeURIComponent(prompt)).catch(() =>
      Alert.alert('No se pudo abrir el navegador', 'Prueba con "Enviar a otra app".'),
    );
  };

  const share = () => {
    Share.share({ message: prompt }).catch(() => undefined);
  };

  const read = () => {
    const recipes = parseRecipeText(pasted);
    if (recipes.length === 0) {
      setFound([]);
      Alert.alert('No encontramos una receta', 'Copia la receta completa: el nombre, los ingredientes y los pasos.');
      return;
    }
    if (recipes.length === 1) {
      onImport(recipes[0]);
      return;
    }
    setFound(recipes);
  };

  const changePasted = (value: string) => {
    setPasted(value);
    setFound([]);
  };

  return (
    <>
      <AppText variant="small" tone="muted">
        Armamos una pregunta con la comida de tu despensa ({pantry.length} {pantry.length === 1 ? 'alimento' : 'alimentos'}, sin
        aseo ni farmacia) y la abres en tu propia IA: el Modo IA de Google, la app de Gemini o la que prefieras. {APP_CONFIG.name} no envía tus
        datos a ninguna IA.
      </AppText>

      <TextField
        label="¿Algún antojo? (opcional)"
        value={craving}
        onChangeText={setCraving}
        placeholder="Ej: algo rápido, sin horno, vegetariano..."
        maxLength={MAX_CRAVING_LENGTH}
        autoCapitalize="sentences"
      />

      {empty ? <Banner icon="info" tone="info" message="Agrega productos a la despensa para recibir mejores ideas." /> : null}

      <Button label="Preguntar en Google (Modo IA)" icon="sparkles" disabled={empty} onPress={openGoogle} />
      <Button label="Enviar a Gemini u otra app" icon="share" variant="secondary" disabled={empty} onPress={share} />

      <View style={styles.paste}>
        <AppText variant="bodyStrong">¿Te gustó una? Pásala a tus recetas</AppText>
        <AppText variant="small" tone="muted">
          Copia la receta en la IA y pégala aquí (mantén presionado el recuadro → Pegar). Si copias varias, eliges cuál guardar.
        </AppText>
        <TextField
          multiline
          value={pasted}
          onChangeText={changePasted}
          onClear={() => changePasted('')}
          placeholder="Pega aquí la receta"
          accessibilityLabel="Receta copiada de la IA"
          maxLength={MAX_PASTE_LENGTH}
          style={styles.pasteInput}
        />
        <Button label="Leer receta" icon="recipes" variant="secondary" disabled={!pasted.trim()} onPress={read} />

        {found.length > 1 ? (
          <View style={styles.choices}>
            <AppText variant="label" tone="muted">
              Encontramos {found.length} recetas. ¿Cuál guardas?
            </AppText>
            {found.map((recipe, index) => (
              <Button
                key={`${index}-${recipe.title}`}
                label={`${recipe.emoji} ${recipe.title}`}
                variant="ghost"
                onPress={() => onImport(recipe)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </>
  );
}

const useStyles = makeStyles(theme => ({
  paste: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pasteInput: { maxHeight: 220 },
  choices: { gap: spacing.xs },
}));
