import { describe, it, expect } from '@jest/globals';
import { loginSchema, registerSchema } from '../auth.schema';

describe('loginSchema', () => {
  it('normalizes email: trims and lowercases', () => {
    const r = loginSchema.safeParse({ email: '  Foo@Example.COM  ', password: 'x' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('foo@example.com');
  });

  it('rejects invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects empty password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const good = {
    username: 'alice_99',
    email: '  Alice@Example.COM  ',
    password: 'Hello@123',
  };

  it('normalizes email to lowercase+trimmed', () => {
    const r = registerSchema.safeParse(good);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('alice@example.com');
  });

  it('rejects username shorter than 3', () => {
    const r = registerSchema.safeParse({ ...good, username: 'ab' });
    expect(r.success).toBe(false);
  });

  it('rejects username with invalid characters', () => {
    const r = registerSchema.safeParse({ ...good, username: 'bad name!' });
    expect(r.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const r = registerSchema.safeParse({ ...good, password: 'hello@123' });
    expect(r.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const r = registerSchema.safeParse({ ...good, password: 'HELLO@123' });
    expect(r.success).toBe(false);
  });

  it('rejects password without digit', () => {
    const r = registerSchema.safeParse({ ...good, password: 'Hello@abc' });
    expect(r.success).toBe(false);
  });

  it('rejects password without symbol', () => {
    const r = registerSchema.safeParse({ ...good, password: 'Hello1234' });
    expect(r.success).toBe(false);
  });

  it('accepts a strong valid password', () => {
    const r = registerSchema.safeParse(good);
    expect(r.success).toBe(true);
  });
});
