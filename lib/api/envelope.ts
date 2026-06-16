/**
 * Single API response envelope (TDD §6.1).
 * success: { ok: true, data, meta }
 * error:   { ok: false, error: { code, message, details } }
 */
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'INTERNAL';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  INTERNAL: 500,
};

export type Meta = { page?: number; total?: number; [k: string]: unknown };

export type ApiSuccess<T> = { ok: true; data: T; meta?: Meta };
export type ApiError = {
  ok: false;
  error: { code: ErrorCode; message: string; details?: unknown[] };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function success<T>(data: T, meta?: Meta): ApiSuccess<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function failure(
  code: ErrorCode,
  message: string,
  details?: unknown[],
): { body: ApiError; status: number } {
  return {
    body: { ok: false, error: details ? { code, message, details } : { code, message } },
    status: ERROR_STATUS[code],
  };
}
