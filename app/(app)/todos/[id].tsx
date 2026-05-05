import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { useTodoDetail, useUpdateTodo, useDeleteTodo } from '@/hooks/useTodos';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { updateTodoSchema, type UpdateTodoInput } from '@/schemas/todos.schema';
import { spacing, typography, fonts } from '@/theme';
import { showError } from '@/components/ui/Toast';

export default function TodoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();

  const { data: todo, isPending } = useTodoDetail(id ?? '');
  const updateMutation = useUpdateTodo('all');
  const deleteMutation = useDeleteTodo('all');

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<UpdateTodoInput>({
      resolver: zodResolver(updateTodoSchema),
      defaultValues: { title: '', description: undefined, completed: false },
      ...(todo && {
        values: { title: todo.title, description: todo.description ?? undefined, completed: todo.completed },
      }),
    });

  async function onSave(data: UpdateTodoInput) {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, patch: data });
      router.back();
    } catch {
      showError('Failed to save changes');
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert('Delete todo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(id);
          router.back();
        },
      },
    ]);
  }

  if (isPending) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.content}>
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (!todo) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.content}>
          <Text style={{ color: t.textMuted, fontFamily: fonts.regular }}>Todo not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: t.text, fontFamily: fonts.bold }]}>
            Edit Todo
          </Text>
          <View style={styles.form}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Title"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.title?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description"
                  multiline
                  numberOfLines={4}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.description?.message}
                />
              )}
            />
            <Button loading={isSubmitting} onPress={handleSubmit(onSave)}>
              Save changes
            </Button>
            <Button variant="danger" onPress={confirmDelete}>
              Delete todo
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing[5] },
  heading: { fontSize: typography.lg.fontSize, marginBottom: spacing[4] },
  form: { gap: spacing[4] },
});
