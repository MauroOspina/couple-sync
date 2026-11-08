import { TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { fonts, radius, spacing, textSizes } from '@/constants/theme';
import { makeStyles, useAppTheme } from '@/hooks/use-app-theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  icon?: IconName;
  /** Muestra una ✕ para vaciar el campo cuando tiene texto. */
  onClear?: () => void;
}

export function TextField({ label, hint, icon, onClear, style, multiline, value, ...rest }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      ) : null}
      <View style={[styles.field, multiline && styles.fieldMultiline]}>
        {icon ? <Icon name={icon} size={20} color={colors.textSubtle} /> : null}
        <TextInput
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          accessibilityLabel={label ?? rest.placeholder}
          multiline={multiline}
          value={value}
          maxFontSizeMultiplier={1.3}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
        {onClear && value ? (
          <IconButton icon="close" variant="plain" size={32} accessibilityLabel="Borrar texto" onPress={onClear} />
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" tone="subtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  inputMultiline: { minHeight: 110, paddingTop: spacing.xs },
}));
