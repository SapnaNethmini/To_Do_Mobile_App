import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showError } from '@/components/ui/Toast';
import { spacing, typography, fonts } from '@/theme';
import type { ApiError } from '@/types/api';

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'status' in e;
}

const STRENGTH_RULES = [
  { label: 'uppercase letter', re: /[A-Z]/ },
  { label: 'lowercase letter', re: /[a-z]/ },
  { label: 'digit', re: /[0-9]/ },
  { label: 'symbol', re: /[^A-Za-z0-9]/ },
];

export default function RegisterScreen() {
  const { register: authRegister } = useAuth();
  const t = useTheme();

  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } =
    useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const password = useWatch({ control, name: 'password', defaultValue: '' });
  const passedCount = STRENGTH_RULES.filter((r) => r.re.test(password)).length;

  async function onSubmit(data: RegisterInput) {
    try {
      await authRegister(data);
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === 'CONFLICT') {
          setError('email', { message: err.message });
        } else {
          showError(err.message);
        }
      } else {
        showError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={styles.avoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: t.text, fontFamily: fonts.bold }]}>
            Create account
          </Text>
          <Text style={[styles.sub, { color: t.textMuted, fontFamily: fonts.regular }]}>
            Start managing your todos
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Username"
                  placeholder="alice_99"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.username?.message}
                />
              )}
            />
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
                  helperText={
                    password.length > 0
                      ? `Strength: ${passedCount}/4 requirements met`
                      : undefined
                  }
                />
              )}
            />
            <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
              Create account
            </Button>
          </View>

          <Link href="/login" style={[styles.link, { color: t.primary, fontFamily: fonts.regular }]}>
            Already have an account? Sign in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  avoid: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing[5] },
  title: { fontSize: typography.lg.fontSize, marginBottom: spacing[1] },
  sub: { fontSize: typography.base.fontSize, marginBottom: spacing[6] },
  form: { gap: spacing[4], marginBottom: spacing[6] },
  link: { textAlign: 'center', fontSize: typography.sm.fontSize },
});
