import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

import type { ActiveProvider } from '@/lib/env';

const LLM_TIMEOUT_MS = 30_000;

export function getLanguageModel(provider: ActiveProvider): LanguageModel {
  return provider === 'google'
    ? google('gemini-3.8-flash')
    : groq('openai/gpt-oss-120b');
}

/** Keeps provider calls bounded so route requests cannot hang indefinitely. */
export function getLlmAbortSignal(): AbortSignal {
  return AbortSignal.timeout(LLM_TIMEOUT_MS);
}
