import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts, recipes } from '@/theme';

export default function DashboardScreen() {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: spacing[4], gap: spacing[4] }}>
        <Text
          style={{ color: t.text, fontSize: typography.lg.fontSize, fontFamily: fonts.bold }}
        >
          Dashboard
        </Text>
        <View style={recipes.cardStyle(t)}>
          <Text style={{ color: t.text, fontFamily: fonts.semibold }}>Sprint 1 placeholder</Text>
          <Text style={{ color: t.textMuted, fontFamily: fonts.regular, marginTop: spacing[1] }}>
            Real list + CRUD lands in Sprint 4.
          </Text>
        </View>
        <Link href="/settings" style={{ color: t.primary }}>
          Open Settings
        </Link>
      </View>
    </SafeAreaView>
  );
}
