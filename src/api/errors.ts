import { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';

export function normalizeApiError(err: unknown): ApiError {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: Partial<ApiError> } | undefined;
    const apiError: ApiError = {
      code: data?.error?.code ?? 'NETWORK_ERROR',
      message: data?.error?.message ?? err.message,
      status: err.response?.status ?? 0,
    };
    const fields = data?.error?.fields;
    if (fields !== undefined) apiError.fields = fields;
    return apiError;
  }
  return { code: 'UNKNOWN', message: 'Unexpected error', status: 0 };
}
