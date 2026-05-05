import { describe, it, expect } from '@jest/globals';
import { createTodoSchema, updateTodoSchema } from '../todos.schema';

describe('createTodoSchema', () => {
  it('rejects empty title', () => {
    expect(createTodoSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    expect(createTodoSchema.safeParse({ title: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts valid title', () => {
    expect(createTodoSchema.safeParse({ title: 'Buy milk' }).success).toBe(true);
  });

  it('trims whitespace from title', () => {
    const r = createTodoSchema.safeParse({ title: '  Buy milk  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.title).toBe('Buy milk');
  });

  it('accepts title with optional description', () => {
    const r = createTodoSchema.safeParse({ title: 'Task', description: 'details' });
    expect(r.success).toBe(true);
  });

  it('rejects description longer than 500 chars', () => {
    const r = createTodoSchema.safeParse({ title: 'Task', description: 'x'.repeat(501) });
    expect(r.success).toBe(false);
  });
});

describe('updateTodoSchema', () => {
  it('accepts partial update with just completed', () => {
    expect(updateTodoSchema.safeParse({ completed: true }).success).toBe(true);
  });

  it('rejects empty title when provided', () => {
    expect(updateTodoSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('accepts empty object (all fields optional)', () => {
    expect(updateTodoSchema.safeParse({}).success).toBe(true);
  });
});
