import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { useThemeMode, type ThemeMode } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { spacing, typography, fonts } from '@/theme';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const t = useTheme();
  const { mode, colorScheme, setMode } = useThemeMode();
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.textMuted, fontFamily: fonts.medium }]}>
            Theme
          </Text>
          <View style={styles.themePicker}>
            {THEME_OPTIONS.map((opt) => (
              <Badge
                key={opt.value}
                label={opt.label}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
              />
            ))}
          </View>
          {mode === 'system' ? (
            <Text style={[styles.hint, { color: t.textMuted, fontFamily: fonts.regular }]}>
              System is currently {colorScheme}
            </Text>
          ) : null}
        </View>

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
  section: { gap: spacing[2] },
  sectionTitle: { fontSize: typography.sm.fontSize, textTransform: 'uppercase', letterSpacing: 0.5 },
  themePicker: { flexDirection: 'row', gap: spacing[2] },
  hint: { fontSize: typography.xs.fontSize },
});
