import { api } from './client';
import type { Todo } from '@/types/todo';

export type TodoStatus = 'all' | 'active' | 'completed';

export const todosApi = {
  list: (params: { status?: TodoStatus; cursor?: string; limit?: number } = {}) =>
    api
      .get<{ data: { items: Todo[]; nextCursor: string | null } }>('/todos', { params })
      .then((r) => r.data.data),

  create: (input: { title: string; description?: string }) =>
    api.post<{ data: Todo }>('/todos', input).then((r) => r.data.data),

  update: (id: string, patch: Partial<Pick<Todo, 'title' | 'description' | 'completed'>>) =>
    api.put<{ data: Todo }>(`/todos/${id}`, patch).then((r) => r.data.data),

  remove: (id: string) => api.delete(`/todos/${id}`).then(() => undefined),
};
