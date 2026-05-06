import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { useThemeMode } from '@/context/ThemeContext';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showError } from '@/components/ui/Toast';
import { spacing, typography, fonts } from '@/theme';
import type { ApiError } from '@/types/api';

const BG_IMAGE = require('../../assets/background.png');

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'status' in e;
}

const CYCLE = { system: 'light', light: 'dark', dark: 'system' } as const;
const ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const;

export default function LoginScreen() {
  const { login } = useAuth();
  const t = useTheme();
  const { mode, setMode } = useThemeMode();
  const router = useRouter();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    try {
      await login(data.email, data.password);
      router.replace('/(app)');
    } catch (err: unknown) {
      if (isApiError(err)) {
        showError(err.message);
      } else {
        showError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover">
      <LinearGradient
        colors={['transparent', 'transparent', t.bg, t.bg]}
        locations={[0, 0.10, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe}>
        <Pressable
          onPress={() => setMode(CYCLE[mode])}
          style={styles.themeBtn}
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          hitSlop={8}
        >
          <Feather name={ICON[mode]} size={20} color="#4b5563" />
        </Pressable>
        <KeyboardAvoidingView
          style={styles.avoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: t.text, fontFamily: fonts.bold }]}>
              Welcome back
            </Text>
            <Text style={[styles.sub, { color: t.textMuted, fontFamily: fonts.regular }]}>
              Sign in to your account
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />
              <Button
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              >
                Sign in
              </Button>
            </View>

            <Link href="/register" style={[styles.link, { color: t.primary, fontFamily: fonts.regular }]}>
              Don&apos;t have an account? Register
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  safe: { flex: 1 },
  themeBtn: { position: 'absolute', top: 48, right: spacing[4], zIndex: 10, padding: spacing[2] },
  avoid: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing[5] },
  title: { fontSize: typography.lg.fontSize, marginBottom: spacing[1] },
  sub: { fontSize: typography.base.fontSize, marginBottom: spacing[6] },
  form: { gap: spacing[4], marginBottom: spacing[6] },
  link: { textAlign: 'center', fontSize: typography.sm.fontSize },
});
