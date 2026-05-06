import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { spacing, typography, fonts } from '@/theme';
import type { Todo } from '@/types/todo';

type Props = {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
};

export const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete, onPress }: Props) {
  const t = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(150)}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => onPress(todo.id)}
        style={[styles.row, { borderBottomColor: t.border }]}
      >
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: todo.completed }}
          onPress={() => onToggle(todo.id, !todo.completed)}
          style={[
            styles.checkbox,
            {
              borderColor: todo.completed ? t.primary : t.border,
              backgroundColor: todo.completed ? t.primary : 'transparent',
            },
          ]}
          hitSlop={8}
        >
          {todo.completed ? <Feather name="check" size={12} color="#fff" /> : null}
        </Pressable>

        <Text
          style={[
            styles.title,
            {
              color: todo.completed ? t.textMuted : t.text,
              fontFamily: fonts.regular,
              textDecorationLine: todo.completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {todo.title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete todo"
          onPress={() => onDelete(todo.id)}
          hitSlop={8}
          style={styles.deleteBtn}
        >
          <Feather name="trash-2" size={16} color={t.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { flex: 1, fontSize: typography.base.fontSize },
  deleteBtn: { flexShrink: 0, padding: spacing[1] },
});
