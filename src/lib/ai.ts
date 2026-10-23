import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

import type { ActiveProvider } from '@/lib/env';

const LLM_TIMEOUT_MS = 90_000;

/**
 * Ordered fallback cascade for Google Gemini models.
 * Prioritizes high-throughput, unexhausted free-tier and preview models.
 */
const GOOGLE_MODEL_FALLBACKS = [
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3.6-flash',
];

const GROQ_MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
];

export function getLanguageModel(provider: ActiveProvider): LanguageModel {
  if (provider === 'google') {
    const custom = process.env.GEMINI_MODEL?.trim() || process.env.AI_MODEL?.trim();
    return google(custom || GOOGLE_MODEL_FALLBACKS[0]);
  }
  const custom = process.env.GROQ_MODEL?.trim() || process.env.AI_MODEL?.trim();
  return groq(custom || GROQ_MODEL_FALLBACKS[0]);
}

export function getAlternativeModel(provider: ActiveProvider): LanguageModel | null {
  if (provider === 'google' && process.env.GROQ_API_KEY) {
    const custom = process.env.GROQ_MODEL?.trim();
    return groq(custom || GROQ_MODEL_FALLBACKS[0]);
  }
  if (provider === 'groq' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const custom = process.env.GEMINI_MODEL?.trim();
    return google(custom || GOOGLE_MODEL_FALLBACKS[0]);
  }
  return null;
}

/**
 * Returns an ordered array of language models to try in sequence.
 * If a model is rate-limited (HTTP 429), quota-exhausted, or temporarily unavailable,
 * the caller seamlessly falls back to the next model in the cascade.
 */
export function getLanguageModelCascade(provider: ActiveProvider): LanguageModel[] {
  const models: LanguageModel[] = [];

  if (provider === 'google') {
    const userOverride = process.env.GEMINI_MODEL?.trim() || process.env.AI_MODEL?.trim();
    const candidateNames = userOverride
      ? [userOverride, ...GOOGLE_MODEL_FALLBACKS.filter((m) => m !== userOverride)]
      : GOOGLE_MODEL_FALLBACKS;

    for (const name of candidateNames) {
      try {
        models.push(google(name));
      } catch {
        // Continue to next candidate
      }
    }

    // Cross-provider failover to Groq if key is present
    if (process.env.GROQ_API_KEY) {
      for (const groqModel of GROQ_MODEL_FALLBACKS) {
        try {
          models.push(groq(groqModel));
        } catch {
          // Continue
        }
      }
    }
  } else {
    // Provider is groq
    const userOverride = process.env.GROQ_MODEL?.trim() || process.env.AI_MODEL?.trim();
    const candidateNames = userOverride
      ? [userOverride, ...GROQ_MODEL_FALLBACKS.filter((m) => m !== userOverride)]
      : GROQ_MODEL_FALLBACKS;

    for (const name of candidateNames) {
      try {
        models.push(groq(name));
      } catch {
        // Continue
      }
    }

    // Cross-provider failover to Google if key is present
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      for (const googleModel of GOOGLE_MODEL_FALLBACKS) {
        try {
          models.push(google(googleModel));
        } catch {
          // Continue
        }
      }
    }
  }

  if (models.length === 0) {
    models.push(getLanguageModel(provider));
  }

  return models;
}

export function getLlmAbortSignal(): AbortSignal {
  return AbortSignal.timeout(LLM_TIMEOUT_MS);
}
