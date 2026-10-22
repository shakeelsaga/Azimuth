import { generateObject } from 'ai';

import { getLanguageModel, getLlmAbortSignal } from '@/lib/ai';
import { createApiError, getActiveProvider } from '@/lib/env';
import { createGenerationError, parseRequestBody } from '@/lib/route-utils';
import { FollowUpQuestionsSchema, QuestionsRequestSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const provider = getActiveProvider();
  if (!provider) {
    return createApiError('api_key_missing', 'Running in demo mode — AI features need an API key.', 503);
  }

  const parsedRequest = await parseRequestBody(request, QuestionsRequestSchema);
  if (!parsedRequest.success) {
    return parsedRequest.response;
  }

  const { destination, country, daysCount, weatherSummary, structuralParams } = parsedRequest.data;

  try {
    const result = await generateObject({
      model: getLanguageModel(provider),
      schema: FollowUpQuestionsSchema,
      schemaName: 'follow_up_questions',
      system: [
        'You are a warm, knowledgeable local travel advisor.',
        'Ask exactly three short, friendly, destination-specific questions to understand the traveller’s vibe and preferences.',
        'Every question must be under 12 words and have three or four pill options written in everyday words.',
        'Speak like a thoughtful local friend. Never use jargon, technical terms, marketing speak, or robotic language.',
      ].join(' '),
      prompt: [
        `The user is planning a ${daysCount}-day ${structuralParams.tripPurpose} trip to ${destination}, ${country}.`,
        `They are travelling as ${structuralParams.travelCompanions} with a ${structuralParams.budgetPreference} budget.`,
        `Current weather forecast: ${weatherSummary ?? 'Weather unavailable.'}`,
      ].join('\n'),
      temperature: 0.5,
      maxRetries: 1,
      abortSignal: getLlmAbortSignal(),
    });

    return Response.json(result.object, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return createGenerationError(error, 'generation_failed', "Couldn't generate questions right now.");
  }
}
