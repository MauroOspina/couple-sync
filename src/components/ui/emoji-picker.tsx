import { Pressable, ScrollView } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { radius, spacing } from '@/constants/theme';
import { makeStyles } from '@/hooks/use-app-theme';

interface EmojiPickerProps {
  options: string[];
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ options, value, onChange }: EmojiPickerProps) {
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map(emoji => {
        const selected = emoji === value;
        return (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`Ícono ${emoji}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(emoji)}
            style={[styles.option, selected && styles.selected]}>
            <AppText style={styles.emoji}>{emoji}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles(theme => ({
  row: { gap: spacing.sm },
  option: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  emoji: { fontSize: 24, lineHeight: 30 },
}));
