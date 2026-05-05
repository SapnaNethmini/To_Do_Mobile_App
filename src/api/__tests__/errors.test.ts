import { describe, it, expect } from '@jest/globals';
import { AxiosError } from 'axios';
import { normalizeApiError } from '../errors';

describe('normalizeApiError', () => {
  it('extracts code and message from AxiosError with response', () => {
    const err = new AxiosError('Request failed');
    // @ts-expect-error — mocking partial AxiosResponse shape in tests
    err.response = {
      status: 401,
      data: { error: { code: 'UNAUTHORIZED', message: 'Missing token' } },
    };
    const result = normalizeApiError(err);
    expect(result.code).toBe('UNAUTHORIZED');
    expect(result.message).toBe('Missing token');
    expect(result.status).toBe(401);
    expect(result.fields).toBeUndefined();
  });

  it('returns NETWORK_ERROR for AxiosError without response', () => {
    const err = new AxiosError('Network Error');
    const result = normalizeApiError(err);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toBe('Network Error');
    expect(result.status).toBe(0);
  });

  it('returns UNKNOWN for a plain Error', () => {
    const result = normalizeApiError(new Error('Something broke'));
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBe('Unexpected error');
    expect(result.status).toBe(0);
  });
});
