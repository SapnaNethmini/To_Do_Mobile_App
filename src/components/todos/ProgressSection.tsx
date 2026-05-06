import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts } from '@/theme';

type Mood = 'sad' | 'neutral' | 'happy' | 'celebrate';

const moodConfig: Record<Mood, { emoji: string; message: string; barColor: string }> = {
  sad: {
    emoji: '😞',
    message: "Hey, don't be lazy! Let's tick some boxes.",
    barColor: '#ef4444',
  },
  neutral: {
    emoji: '🙂',
    message: "You're getting there — keep going!",
    barColor: '#f59e0b',
  },
  happy: {
    emoji: '😄',
    message: "Yay! You're crushing it!",
    barColor: '#10b981',
  },
  celebrate: {
    emoji: '🎉',
    message: 'All done — take a break!',
    barColor: '#10b981',
  },
};

type Props = {
  done: number;
  total: number;
};

export function ProgressSection({ done, total }: Props) {
  const t = useTheme();
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
  const mood: Mood =
    percentage === 100 ? 'celebrate'
    : percentage >= 60 ? 'happy'
    : percentage >= 30 ? 'neutral'
    : 'sad';
  const { emoji, message, barColor } = moodConfig[mood];

  return (
    <View style={[styles.container, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text
            style={[styles.message, { color: t.text, fontFamily: fonts.medium }]}
            numberOfLines={1}
          >
            {message}
          </Text>
          <Text style={[styles.percent, { color: t.text, fontFamily: fonts.semibold }]}>
            {percentage}%
          </Text>
        </View>
        <View
          style={[styles.track, { backgroundColor: t.border }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percentage }}
        >
          <View style={[styles.fill, { width: `${percentage}%` as `${number}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
  },
  emoji: { fontSize: 32, lineHeight: 40 },
  content: { flex: 1, gap: spacing[2] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing[2] },
  message: { flex: 1, fontSize: typography.sm.fontSize },
  percent: { fontSize: typography.sm.fontSize },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
