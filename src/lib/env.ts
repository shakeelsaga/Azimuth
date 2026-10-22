export type ActiveProvider = 'google' | 'groq';

/** Prefer Groq when both keys are present because it is the configured fallback provider. */
export function getActiveProvider(): ActiveProvider | null {
  if (process.env.GROQ_API_KEY) {
    return 'groq';
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return 'google';
  }

  return null;
}

export function createApiError(code: string, message: string, status = 500): Response {
  return Response.json(
    { error: code, message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
