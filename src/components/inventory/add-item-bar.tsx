import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { fonts, radius, spacing, textSizes } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface AddItemBarProps {
  placeholder: string;
  onSubmit: (text: string) => void;
}

/** Barra fija abajo para agregar rápido un elemento por nombre. */
export function AddItemBar({ placeholder, onSubmit }: AddItemBarProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const [text, setText] = useState('');

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSubmit(value);
    setText('');
  };

  return (
    <View style={styles.bar}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        returnKeyType="done"
        submitBehavior="submit"
        accessibilityLabel={placeholder}
        maxFontSizeMultiplier={1.3}
        style={styles.input}
      />
      <IconButton icon="add" variant="primary" size={48} accessibilityLabel="Agregar" onPress={submit} disabled={!text.trim()} />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: theme.colors.text,
  },
}));
