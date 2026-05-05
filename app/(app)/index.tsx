import { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';
import { useAuth } from '@/context/AuthContext';
import { spacing, typography, fonts } from '@/theme';
import { FilterTabs } from '@/components/todos/FilterTabs';
import { TodoItem } from '@/components/todos/TodoItem';
import { TodoForm } from '@/components/todos/TodoForm';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { useTodoList, useCreateTodo, useUpdateTodo, useDeleteTodo } from '@/hooks/useTodos';
import type { TodoStatus } from '@/api/todos.api';
import type { CreateTodoInput } from '@/schemas/todos.schema';
import type { Todo } from '@/types/todo';

export default function DashboardScreen() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<TodoStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const insets = useSafeAreaInsets();

  const { data: todos, isPending, isRefetching, refetch } = useTodoList(status);
  const createMutation = useCreateTodo(status);
  const updateMutation = useUpdateTodo(status);
  const deleteMutation = useDeleteTodo(status);

  const handleCreate = useCallback(async (data: CreateTodoInput) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
  }, [createMutation]);

  const handleToggle = useCallback((id: string, completed: boolean) => {
    updateMutation.mutate({ id, patch: { completed } });
  }, [updateMutation]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete todo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }, [deleteMutation]);

  const renderItem = useCallback(({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onToggle={handleToggle}
      onDelete={handleDelete}
      onPress={(id) => router.push(`/todos/${id}`)}
    />
  ), [handleToggle, handleDelete, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text, fontFamily: fonts.bold }]}>
          {user?.username ?? 'My Todos'}
        </Text>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" hitSlop={8}>
          <Feather name="settings" size={20} color={t.textMuted} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <FilterTabs value={status} onChange={setStatus} />
      </View>

      {showForm ? (
        <Card style={styles.formCard}>
          <TodoForm
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />
          <Pressable onPress={() => setShowForm(false)} style={styles.cancelBtn}>
            <Text style={{ color: t.textMuted, fontFamily: fonts.regular }}>Cancel</Text>
          </Pressable>
        </Card>
      ) : null}

      {isPending ? (
        <View style={styles.list}>
          {[1, 2, 3].map((k) => <SkeletonCard key={k} />)}
        </View>
      ) : (
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition}
          data={todos ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={t.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              heading="No todos yet"
              body="Tap + to create your first todo"
              ctaLabel="Create todo"
              onCta={() => setShowForm(true)}
            />
          }
        />
      )}


      {!showForm ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create todo"
          onPress={() => setShowForm(true)}
          style={[styles.fab, { backgroundColor: t.primary, bottom: spacing[6] + insets.bottom }]}
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  title: { fontSize: typography.lg.fontSize },
  tabs: { paddingHorizontal: spacing[4], paddingBottom: spacing[2] },
  formCard: { marginHorizontal: spacing[4], marginBottom: spacing[3] },
  list: { paddingHorizontal: spacing[4], paddingBottom: 80 },
  cancelBtn: { alignItems: 'center', paddingTop: spacing[2] },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
