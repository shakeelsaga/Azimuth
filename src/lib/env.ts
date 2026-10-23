export type ActiveProvider = 'google' | 'groq';

export function getActiveProvider(): ActiveProvider | null {
  const preferred = process.env.AI_PROVIDER?.toLowerCase().trim();
  if (preferred === 'groq' && process.env.GROQ_API_KEY) {
    return 'groq';
  }
  if (preferred === 'google' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return 'google';
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return 'google';
  }

  if (process.env.GROQ_API_KEY) {
    return 'groq';
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
