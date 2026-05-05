import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Button } from '@/components/ui/Button';
import { spacing, typography, fonts } from '@/theme';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const t = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.container, { borderColor: t.border }]}>
        <Text style={[styles.heading, { color: t.text, fontFamily: fonts.bold }]}>
          Settings
        </Text>

        {user ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.label, { color: t.textMuted, fontFamily: fonts.medium }]}>
              Username
            </Text>
            <Text style={[styles.value, { color: t.text, fontFamily: fonts.regular }]}>
              {user.username}
            </Text>
            <Text style={[styles.label, { color: t.textMuted, fontFamily: fonts.medium }]}>
              Email
            </Text>
            <Text style={[styles.value, { color: t.text, fontFamily: fonts.regular }]}>
              {user.email}
            </Text>
          </View>
        ) : null}

        <Button variant="danger" onPress={() => { void handleLogout(); }}>
          Log out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing[5], gap: spacing[4] },
  heading: { fontSize: typography.lg.fontSize },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing[4],
    gap: spacing[2],
  },
  label: { fontSize: typography.xs.fontSize, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: typography.base.fontSize },
});
