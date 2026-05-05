import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/useTheme';
import { radii, typography, fonts, spacing } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
};

const MIN_HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const FONT_SIZE: Record<ButtonSize, number> = {
  sm: typography.sm.fontSize,
  md: typography.base.fontSize,
  lg: typography.lg.fontSize,
};
const H_PAD: Record<ButtonSize, number> = { sm: spacing[3], md: spacing[4], lg: spacing[5] };

export function Button({ variant = 'primary', size = 'md', loading, children, onPress, style, disabled, ...rest }: Props) {
  const t = useTheme();

  const bgColor: Record<ButtonVariant, string> = {
    primary: t.primary,
    secondary: t.surface,
    ghost: 'transparent',
    danger: 'transparent',
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: '#ffffff',
    secondary: t.primary,
    ghost: t.textMuted,
    danger: t.danger,
  };

  const borderColor: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: t.primary,
    ghost: undefined,
    danger: t.danger,
  };

  async function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  const isDisabled = disabled === true || loading === true;

  const baseStyle = [
    styles.base,
    {
      minHeight: MIN_HEIGHT[size],
      paddingHorizontal: H_PAD[size],
      backgroundColor: bgColor[variant],
      borderRadius: radii.lg,
      borderWidth: borderColor[variant] ? 1 : 0,
      borderColor: borderColor[variant],
      opacity: isDisabled ? 0.5 : 1,
    },
  ] as const;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={handlePress}
      style={(state) => [
        ...baseStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { fontSize: FONT_SIZE[size], color: textColor[variant] }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontFamily: fonts.semibold,
  },
});
