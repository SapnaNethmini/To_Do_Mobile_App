import { api } from './client';
import type { Todo, TodoId } from '@/types/todo';

export type TodoStatus = 'all' | 'active' | 'completed';

// Backend returns snake_case numeric fields; normalize to mobile types.
type BackendTodo = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

function normalize(t: BackendTodo): Todo {
  return {
    id: String(t.id) as TodoId,
    userId: String(t.user_id),
    title: t.title,
    description: t.description,
    completed: t.completed,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

export const todosApi = {
  list: () =>
    api
      .get<{ data: BackendTodo[] }>('/todos')
      .then((r) => r.data.data.map(normalize)),

  get: (id: string) =>
    api
      .get<{ data: BackendTodo }>(`/todos/${id}`)
      .then((r) => normalize(r.data.data)),

  create: (input: { title: string; description?: string | undefined }) =>
    api
      .post<{ data: BackendTodo }>('/todos', input)
      .then((r) => normalize(r.data.data)),

  update: (id: string, patch: { title?: string | undefined; description?: string | undefined; completed?: boolean | undefined }) =>
    api
      .put<{ data: BackendTodo }>(`/todos/${id}`, patch)
      .then((r) => normalize(r.data.data)),

  remove: (id: string) => api.delete(`/todos/${id}`).then(() => undefined),
};
