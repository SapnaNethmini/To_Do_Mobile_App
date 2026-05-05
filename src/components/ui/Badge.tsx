import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts, radii } from '@/theme';

type Props = {
  label: string;
  selected?: boolean | undefined;
  onPress?: (() => void) | undefined;
};

export function Badge({ label, selected = false, onPress }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.pill,
        {
          backgroundColor: selected ? t.primary : t.surface,
          borderColor: selected ? t.primary : t.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? '#fff' : t.textMuted, fontFamily: fonts.medium },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: 1,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: typography.sm.fontSize },
});
