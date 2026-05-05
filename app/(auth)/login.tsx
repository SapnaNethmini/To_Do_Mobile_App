import { Alert, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { spacing, radii, typography, fonts, recipes } from '@/theme';
import { authApi } from '@/api/auth.api';
import type { ApiError } from '@/types/api';

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'status' in e;
}

export default function LoginScreen() {
  const { fakeLogin } = useAuth();
  const t = useTheme();

  async function pingMe(): Promise<void> {
    try {
      await authApi.me();
    } catch (err: unknown) {
      if (isApiError(err)) {
        Alert.alert(err.code, err.message);
      } else {
        Alert.alert('ERROR', 'Unexpected error');
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing[4], gap: spacing[4] }}>
        <Text
          style={{
            color: t.text,
            fontSize: typography.lg.fontSize,
            fontFamily: fonts.bold,
            textAlign: 'center',
          }}
        >
          Login
        </Text>
        <Text style={{ color: t.textMuted, fontFamily: fonts.regular, textAlign: 'center' }}>
          Sprint 1 placeholder. Real form lands in Sprint 3.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={fakeLogin}
          style={{
            ...recipes.btnShellStyle(),
            backgroundColor: t.primary,
            borderRadius: radii.lg,
          }}
        >
          <Text style={{ color: '#ffffff', fontFamily: fonts.semibold }}>Fake login</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void pingMe();
          }}
          style={{
            ...recipes.btnShellStyle(),
            backgroundColor: t.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <Text style={{ color: t.text, fontFamily: fonts.semibold }}>Ping /auth/me</Text>
        </Pressable>
        <Link href="/register" style={{ color: t.primary, textAlign: 'center' }}>
          Go to Register
        </Link>
      </View>
    </SafeAreaView>
  );
}
