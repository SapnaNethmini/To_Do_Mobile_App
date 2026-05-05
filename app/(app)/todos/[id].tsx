import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts } from '@/theme';

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flex: 1, padding: spacing[4], gap: spacing[2] }}>
        <Text
          style={{ color: t.text, fontSize: typography.lg.fontSize, fontFamily: fonts.bold }}
        >
          Todo Detail
        </Text>
        <Text style={{ color: t.textMuted, fontFamily: fonts.regular }}>id: {id}</Text>
        <Text style={{ color: t.textMuted, fontFamily: fonts.regular }}>
          Sprint 1 placeholder. Real edit form lands in Sprint 4.
        </Text>
      </View>
    </SafeAreaView>
  );
}
