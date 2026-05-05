import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts } from '@/theme';

export default function NotFoundScreen() {
  const t = useTheme();
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
          404 — Not found
        </Text>
        <Link href="/" style={{ color: t.primary, textAlign: 'center' }}>
          Go home
        </Link>
      </View>
    </SafeAreaView>
  );
}
