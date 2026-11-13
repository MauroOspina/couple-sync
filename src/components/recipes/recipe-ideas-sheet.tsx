import { useMemo, useState } from 'react';
import { Alert, Linking, Share } from 'react-native';

import { AppText, Banner, Button, Sheet, TextField } from '@/components/ui';
import { buildRecipePrompt, MAX_CRAVING_LENGTH, pantryForIdeas } from '@/domain/recipes';
import { useInventory } from '@/providers/inventory-provider';

/** Modo IA de Google (`udm=50`). No es una URL documentada: si deja de funcionar, queda "Enviar a otra app". */
const GOOGLE_AI_MODE_URL = 'https://www.google.com/search?udm=50&q=';

interface RecipeIdeasSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Ideas de recetas con la IA de cada persona: arma una pregunta con la despensa y la abre en el
 * Modo IA de Google o la comparte con Gemini, ChatGPT, etc. La app no envía datos a ninguna IA.
 */
export function RecipeIdeasSheet({ visible, onClose }: RecipeIdeasSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Ideas con IA">
      {visible ? <IdeasContent /> : null}
    </Sheet>
  );
}

function IdeasContent() {
  const { products } = useInventory();
  const [craving, setCraving] = useState('');
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

  return (
    <>
      <AppText variant="small" tone="muted">
        Armamos una pregunta con lo que hay en tu despensa ({pantry.length} {pantry.length === 1 ? 'producto' : 'productos'}) y la
        abres en tu propia IA: el Modo IA de Google, la app de Gemini o la que prefieras. Couple Sync no envía tus datos a ninguna
        IA.
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

      <AppText variant="caption" tone="subtle">
        ¿Te gustó una? Guárdala con el botón + de Recetas y la app te dirá qué ingredientes faltan.
      </AppText>
    </>
  );
}
