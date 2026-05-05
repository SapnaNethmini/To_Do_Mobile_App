import { api } from './client';
import type { User } from '@/types/user';

export const authApi = {
  register: (input: { username: string; email: string; password: string }) =>
    api.post<{ data: User }>('/auth/register', input).then((r) => r.data.data),

  login: (input: { email: string; password: string }) =>
    api
      .post<{ data: { user: User; token: string } }>('/auth/login', input)
      .then((r) => r.data.data),

  me: () => api.get<{ data: User }>('/auth/me').then((r) => r.data.data),

  logout: () => api.post('/auth/logout').then(() => undefined),
};
