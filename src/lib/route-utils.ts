import type { z } from 'zod';

import { createApiError } from '@/lib/env';

type ParsedRequest<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Reads JSON once and prevents Zod details or parser errors from reaching the client. */
export async function parseRequestBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<ParsedRequest<z.infer<TSchema>>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: createApiError('validation_failed', 'Please check the trip details and try again.', 400),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      response: createApiError('validation_failed', 'Please check the trip details and try again.', 400),
    };
  }

  return { success: true, data: parsed.data };
}

function getErrorStatus(error: unknown): number | null {
  if (!isRecord(error)) {
    return null;
  }

  for (const key of ['status', 'statusCode']) {
    const value = error[key];
    if (typeof value === 'number') {
      return value;
    }
  }

  return null;
}

/** Converts provider failures into the small, human-friendly API error vocabulary. */
export function createGenerationError(
  error: unknown,
  code: string,
  message: string,
): Response {
  console.error(`[trip-api:${code}]`, error);
  const status = getErrorStatus(error);
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

  if (status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return createApiError('rate_limited', 'Too many requests. Try again in a moment.', 429);
  }

  if (errorMessage.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return createApiError('generation_timeout', 'That took too long. Please try again.', 504);
  }

  return createApiError(code, message, 500);
}
