import { describe, it, expect } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import type { Todo } from '@/types/todo';

const makeTodo = (id: string, title: string, completed = false): Todo => ({
  id: id as Todo['id'],
  userId: '1',
  title,
  description: null,
  completed,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const LIST_KEY = ['todos', 'list', 'all'];

describe('optimistic delete rollback', () => {
  it('removes the todo optimistically then restores it on error', () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
    });

    const initial = [makeTodo('1', 'Buy milk'), makeTodo('2', 'Walk dog')];
    qc.setQueryData<Todo[]>(LIST_KEY, initial);

    // onMutate: optimistic removal
    const snapshot = qc.getQueryData<Todo[]>(LIST_KEY);
    qc.setQueryData<Todo[]>(LIST_KEY, (old) => (old ?? []).filter((t) => t.id !== '1'));
    expect(qc.getQueryData<Todo[]>(LIST_KEY)).toHaveLength(1);

    // onError: rollback from snapshot
    qc.setQueryData(LIST_KEY, snapshot);
    expect(qc.getQueryData<Todo[]>(LIST_KEY)).toHaveLength(2);
    expect(qc.getQueryData<Todo[]>(LIST_KEY)?.[0]?.title).toBe('Buy milk');
  });
});

describe('optimistic update rollback', () => {
  it('applies patch optimistically then restores previous state on error', () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
    });

    const initial = [makeTodo('1', 'Buy milk', false)];
    qc.setQueryData<Todo[]>(LIST_KEY, initial);

    // onMutate: optimistic toggle
    const snapshot = qc.getQueryData<Todo[]>(LIST_KEY);
    qc.setQueryData<Todo[]>(LIST_KEY, (old) =>
      (old ?? []).map((t) => (t.id === '1' ? { ...t, completed: true } : t)),
    );
    expect(qc.getQueryData<Todo[]>(LIST_KEY)?.[0]?.completed).toBe(true);

    // onError: rollback
    qc.setQueryData(LIST_KEY, snapshot);
    expect(qc.getQueryData<Todo[]>(LIST_KEY)?.[0]?.completed).toBe(false);
  });
});

describe('optimistic create rollback', () => {
  it('prepends todo optimistically then restores list on error', () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
    });

    const initial = [makeTodo('1', 'Existing todo')];
    qc.setQueryData<Todo[]>(LIST_KEY, initial);

    // onMutate: optimistic prepend
    const snapshot = qc.getQueryData<Todo[]>(LIST_KEY);
    const optimistic = makeTodo('tmp-1', 'New todo');
    qc.setQueryData<Todo[]>(LIST_KEY, (old) => [optimistic, ...(old ?? [])]);
    expect(qc.getQueryData<Todo[]>(LIST_KEY)).toHaveLength(2);

    // onError: rollback
    qc.setQueryData(LIST_KEY, snapshot);
    expect(qc.getQueryData<Todo[]>(LIST_KEY)).toHaveLength(1);
  });
});
