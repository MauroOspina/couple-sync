import { useState } from 'react';
import { Alert } from 'react-native';

import { AppText, Button, Sheet, TextField } from '@/components/ui';
import { characterCount, prepareSuggestion, SUGGESTION_MAX_LENGTH } from '@/domain/suggestions';
import { makeStyles } from '@/hooks/use-app-theme';
import { useSession } from '@/providers/session-provider';

interface SuggestionSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Buzón de sugerencias. El texto se conserva si se cierra sin enviar. */
export function SuggestionSheet({ visible, onClose }: SuggestionSheetProps) {
  const styles = useStyles();
  const { sendSuggestion } = useSession();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    try {
      setSending(true);
      await sendSuggestion(message);
      setMessage('');
      onClose();
      Alert.alert('¡Gracias!', 'Recibimos tu sugerencia. Leemos todas.');
    } catch (error) {
      Alert.alert('No se pudo enviar', error instanceof Error ? error.message : 'Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Buzón de sugerencias"
      footer={
        <>
          <Button label="Cancelar" variant="secondary" style={styles.footerButton} onPress={onClose} />
          <Button
            label="Enviar"
            icon="send"
            style={styles.footerButton}
            loading={sending}
            disabled={prepareSuggestion(message) === null}
            onPress={() => void submit()}
          />
        </>
      }>
      <AppText variant="small" tone="muted">
        ¿Qué mejorarías, qué te falta o qué falló? Cuéntanos con confianza.
      </AppText>
      <TextField
        multiline
        autoFocus
        value={message}
        onChangeText={setMessage}
        placeholder="Escribe tu idea aquí…"
        accessibilityLabel="Sugerencia"
        maxLength={SUGGESTION_MAX_LENGTH}
        hint={`${characterCount(message)}/${SUGGESTION_MAX_LENGTH}`}
      />
    </Sheet>
  );
}

const useStyles = makeStyles(() => ({
  footerButton: { flex: 1 },
}));
