import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { typography, fonts, spacing, radii } from '@/theme';

type Props = TextInputProps & {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  leftIcon?: React.ReactNode | undefined;
};

export function Input({ label, error, helperText, leftIcon, style, ...rest }: Props) {
  const t = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.row,
          {
            borderColor: error ? t.danger : t.border,
            backgroundColor: t.surface,
            borderRadius: radii.lg,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          style={[
            styles.input,
            { color: t.text, fontFamily: fonts.regular },
            style,
          ]}
          placeholderTextColor={t.textMuted}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
          autoCorrect={rest.autoCorrect ?? false}
        />
      </View>
      {error ? (
        <Text style={[styles.helper, { color: t.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: t.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },
  label: {
    fontSize: typography.sm.fontSize,
    fontFamily: fonts.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing[3],
  },
  icon: { marginRight: spacing[2] },
  input: {
    flex: 1,
    fontSize: typography.base.fontSize,
    paddingVertical: spacing[2],
  },
  helper: { fontSize: typography.sm.fontSize },
});
