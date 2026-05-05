import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts, recipes } from '@/theme';

export default function SettingsScreen() {
  const { fakeLogout } = useAuth();
  const t = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: spacing[4], gap: spacing[4] }}>
        <Text
          style={{ color: t.text, fontSize: typography.lg.fontSize, fontFamily: fonts.bold }}
        >
          Settings
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={fakeLogout}
          style={recipes.btnDangerStyle(t)}
        >
          <Text style={{ color: t.danger, fontFamily: fonts.semibold }}>Fake logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
