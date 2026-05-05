import { StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/theme';
import { createTodoSchema, type CreateTodoInput } from '@/schemas/todos.schema';

type Props = {
  onSubmit: (data: CreateTodoInput) => Promise<void>;
  isSubmitting?: boolean | undefined;
};

export function TodoForm({ onSubmit, isSubmitting }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Title"
            placeholder="What needs to be done?"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.title?.message}
            autoFocus
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description (optional)"
            placeholder="Add details..."
            multiline
            numberOfLines={3}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.description?.message}
          />
        )}
      />
      <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        Save
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
});
