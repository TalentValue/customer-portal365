import { describe, it, expect } from 'vitest';
import { success, failure, ERROR_STATUS } from '@/lib/api/envelope';
import { formatCents } from '@/lib/utils';

describe('api envelope', () => {
  it('wraps success data', () => {
    expect(success({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });

  it('includes meta when provided', () => {
    expect(success([], { page: 1, total: 0 })).toEqual({
      ok: true,
      data: [],
      meta: { page: 1, total: 0 },
    });
  });

  it('maps error codes to HTTP status', () => {
    expect(failure('FORBIDDEN', 'nope').status).toBe(403);
    expect(failure('VALIDATION', 'bad').status).toBe(422);
    expect(ERROR_STATUS.RATE_LIMITED).toBe(429);
  });
});

describe('formatCents', () => {
  it('formats integer cents as USD', () => {
    expect(formatCents(123456)).toBe('$1,234.56');
    expect(formatCents(0)).toBe('$0.00');
  });
});
