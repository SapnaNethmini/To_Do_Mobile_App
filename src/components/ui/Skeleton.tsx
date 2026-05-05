import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { radii } from '@/theme';

type Props = { width?: number | string; height?: number; borderRadius?: number };

export function Skeleton({ width = '100%', height = 20, borderRadius = radii.md }: Props) {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: width as number, height, borderRadius, backgroundColor: t.border, opacity },
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} width="90%" />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {},
  card: { padding: 16, gap: 8, borderRadius: 12, backgroundColor: 'transparent' },
});
