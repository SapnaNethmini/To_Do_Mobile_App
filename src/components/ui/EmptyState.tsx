import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts } from '@/theme';
import { Button } from './Button';

type Props = {
  heading: string;
  body?: string | undefined;
  ctaLabel?: string | undefined;
  onCta?: (() => void) | undefined;
};

export function EmptyState({ heading, body, ctaLabel, onCta }: Props) {
  const t = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: t.text, fontFamily: fonts.semibold }]}>
        {heading}
      </Text>
      {body ? (
        <Text style={[styles.body, { color: t.textMuted, fontFamily: fonts.regular }]}>
          {body}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button variant="secondary" size="sm" onPress={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing[3], paddingVertical: spacing[8] },
  heading: { fontSize: typography.lg.fontSize },
  body: { fontSize: typography.base.fontSize, textAlign: 'center' },
});
