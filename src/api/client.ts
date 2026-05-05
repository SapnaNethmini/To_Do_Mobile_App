import axios from 'axios';
import type { AxiosError } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/token.storage';
import { normalizeApiError } from './errors';

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await tokenStorage.clear();
    }
    return Promise.reject(normalizeApiError(err));
  },
);
