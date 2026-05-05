import type { TextStyle, ViewStyle } from 'react-native';
import { spacing } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { fonts, typography } from './typography';
import type { Theme } from './theme';

// Mirrors web recipes in ../To_do_web/client/src/index.css. Each function
// returns a style object built from theme tokens; consumers pass the result
// to `style={...}` directly or compose via array.

export const cardStyle = (t: Theme): ViewStyle => ({
  backgroundColor: t.surface,
  borderColor: t.border,
  borderWidth: 1,
  borderRadius: radii.xl,
  padding: spacing[4],
  ...shadows.sm,
});

export const inputStyle = (t: Theme): ViewStyle & TextStyle => ({
  backgroundColor: t.surface,
  borderColor: t.border,
  borderWidth: 1,
  borderRadius: radii.lg,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[2],
  color: t.text,
  fontSize: typography.sm.fontSize,
  fontFamily: fonts.regular,
});

// .btn-primary is rendered with <LinearGradient colors={t.primaryGradient}>
// wrapping the pressable; this is just the shell.
export const btnShellStyle = (): ViewStyle => ({
  borderRadius: radii.lg,
  paddingHorizontal: spacing[4],
  paddingVertical: spacing[2],
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[2],
  overflow: 'hidden',
});

export const btnSecondaryStyle = (t: Theme): ViewStyle => ({
  ...btnShellStyle(),
  backgroundColor: t.surface,
  borderWidth: 1,
  borderColor: t.border,
});

export const btnDangerStyle = (t: Theme): ViewStyle => ({
  ...btnShellStyle(),
  backgroundColor: t.dangerBg,
  borderWidth: 1,
  borderColor: t.dangerBorder,
});

export const btnGhostStyle = (): ViewStyle => ({
  ...btnShellStyle(),
  backgroundColor: 'transparent',
});

export const badgeOpenStyle = (t: Theme): ViewStyle => ({
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 2,
  borderRadius: radii.full,
  borderWidth: 1,
  borderColor: t.border,
  backgroundColor: t.surfaceMuted,
});

export const badgeDoneStyle = (t: Theme): ViewStyle => ({
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 2,
  borderRadius: radii.full,
  borderWidth: 1,
  borderColor: t.successBorder,
  backgroundColor: t.successBg,
});

export const alertErrorStyle = (t: Theme): ViewStyle => ({
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: t.dangerBorder,
  backgroundColor: t.dangerBg,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[2],
});
