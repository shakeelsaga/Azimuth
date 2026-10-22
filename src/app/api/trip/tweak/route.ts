import { generateObject } from 'ai';

import { getLanguageModel, getLlmAbortSignal } from '@/lib/ai';
import { createApiError, getActiveProvider } from '@/lib/env';
import { createGenerationError, parseRequestBody } from '@/lib/route-utils';
import { TweakRequestSchema, TweakResponseSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const provider = getActiveProvider();
  if (!provider) {
    return createApiError('api_key_missing', 'Running in demo mode — AI features need an API key.', 503);
  }

  const parsedRequest = await parseRequestBody(request, TweakRequestSchema);
  if (!parsedRequest.success) {
    return parsedRequest.response;
  }

  const input = parsedRequest.data;

  try {
    const result = await generateObject({
      model: getLanguageModel(provider),
      schema: TweakResponseSchema,
      schemaName: 'tweak_response',
      system: [
        'You are a practical local travel planner handling a requested change to an existing itinerary.',
        'If the request clearly points to a stop, return type swap with affectedDayNumber, affectedStopId, and a complete swapResponse.',
        'If the request is genuinely ambiguous, return type clarification with one short, friendly clarificationMessage.',
        'Choose only real places in the destination, keep the day realistic, and do not change unrelated stops.',
        'Speak like a thoughtful local friend. Never use jargon, technical terms, marketing speak, or robotic language.',
      ].join(' '),
      prompt: [
        `The user has a ${input.tripContext.daysCount}-day trip to ${input.tripContext.destination}, ${input.tripContext.country}.`,
        `Their request: ${JSON.stringify(input.userMessage)}.`,
        `Current itinerary: ${JSON.stringify(input.tripContext.days)}.`,
      ].join('\n'),
      temperature: 0.3,
      maxRetries: 1,
      abortSignal: getLlmAbortSignal(),
    });

    const response = result.object;
    if (
      (response.type === 'swap' && (!response.affectedDayNumber || !response.affectedStopId || !response.swapResponse)) ||
      (response.type === 'clarification' && !response.clarificationMessage)
    ) {
      throw new Error('The generated tweak response was incomplete.');
    }

    return Response.json(response, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return createGenerationError(error, 'tweak_failed', "Couldn't make that change right now. Please try again.");
  }
}
