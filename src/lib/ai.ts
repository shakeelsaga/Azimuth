import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

import type { ActiveProvider } from '@/lib/env';

const LLM_TIMEOUT_MS = 90_000;

export function getLanguageModel(provider: ActiveProvider): LanguageModel {
  return provider === 'google'
    ? google('gemini-3.5-flash')
    : groq('openai/gpt-oss-120b');
}

export function getAlternativeModel(provider: ActiveProvider): LanguageModel | null {
  if (provider === 'google' && process.env.GROQ_API_KEY) {
    return groq('openai/gpt-oss-120b');
  }
  if (provider === 'groq' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google('gemini-3.5-flash');
  }
  return null;
}

export function getLlmAbortSignal(): AbortSignal {
  return AbortSignal.timeout(LLM_TIMEOUT_MS);
}
