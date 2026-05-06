import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { todosApi, type TodoStatus } from '@/api/todos.api';
import type { Todo } from '@/types/todo';
import { showError, showSuccess } from '@/components/ui/Toast';
import { hapticSuccess, hapticError } from '@/utils/haptics';

const qk = {
  list: (status: TodoStatus) => ['todos', 'list', status] as QueryKey,
  detail: (id: string) => ['todos', 'detail', id] as QueryKey,
};

function filterByStatus(todos: Todo[], status: TodoStatus): Todo[] {
  if (status === 'active') return todos.filter((t) => !t.completed);
  if (status === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

export function useTodoList(status: TodoStatus) {
  return useQuery({
    queryKey: qk.list(status),
    queryFn: async () => {
      const all = await todosApi.list();
      return filterByStatus(all, status);
    },
  });
}

export function useTodoDetail(id: string) {
  return useQuery({
    queryKey: qk.detail(id),
    queryFn: () => todosApi.get(id),
  });
}

export function useCreateTodo(status: TodoStatus) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string | undefined }) =>
      todosApi.create(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: qk.list(status) });
      const prev = qc.getQueryData<Todo[]>(qk.list(status));
      const optimistic: Todo = {
        id: `tmp-${Date.now()}` as Todo['id'],
        userId: '',
        title: input.title,
        description: input.description ?? null,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (status !== 'completed') {
        qc.setQueryData<Todo[]>(qk.list(status), (old) => [optimistic, ...(old ?? [])]);
      }
      return { prev };
    },
    onSuccess: () => {
      hapticSuccess();
      showSuccess('Todo created');
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(qk.list(status), ctx.prev);
      hapticError();
      showError('Failed to create todo');
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['todos', 'list'] });
    },
  });
}

export function useUpdateTodo(status: TodoStatus) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { title?: string | undefined; description?: string | undefined; completed?: boolean | undefined } }) =>
      todosApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.list(status) });
      const prev = qc.getQueryData<Todo[]>(qk.list(status));
      qc.setQueryData<Todo[]>(qk.list(status), (old) =>
        (old ?? []).map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...(patch.title !== undefined && { title: patch.title }),
            ...(patch.description !== undefined && { description: patch.description }),
            ...(patch.completed !== undefined && { completed: patch.completed }),
          };
        }),
      );
      return { prev };
    },
    onSuccess: (_data, { patch }) => {
      // toggle is silent; explicit save shows a toast
      if (patch.title !== undefined || patch.description !== undefined) {
        hapticSuccess();
        showSuccess('Todo saved');
      } else {
        hapticSuccess(); // toggle: light haptic, no toast
      }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(qk.list(status), ctx.prev);
      hapticError();
      showError('Failed to update todo');
    },
    onSettled: (_data, _error, { id }) => {
      void qc.invalidateQueries({ queryKey: ['todos', 'list'] });
      void qc.invalidateQueries({ queryKey: qk.detail(id) });
    },
  });
}

export function useDeleteTodo(status: TodoStatus) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.list(status) });
      const prev = qc.getQueryData<Todo[]>(qk.list(status));
      qc.setQueryData<Todo[]>(qk.list(status), (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { prev };
    },
    onSuccess: () => {
      hapticSuccess();
      showSuccess('Todo deleted');
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(qk.list(status), ctx.prev);
      hapticError();
      showError('Failed to delete todo');
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['todos', 'list'] });
    },
  });
}
