import { generateObject } from 'ai';

import { getAlternativeModel, getLanguageModel, getLanguageModelCascade, getLlmAbortSignal } from '@/lib/ai';
import { createApiError, getActiveProvider } from '@/lib/env';
import { createGenerationError, parseRequestBody } from '@/lib/route-utils';
import { SwapStopRequestSchema, SwapStopResponseSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

function getMoveTargetDescription(input: {
  daysCount: number;
  recommendedTargetDayNumber?: number;
  recommendedTargetTimeSlot?: 'Morning' | 'Afternoon' | 'Evening';
}): string | null {
  if (input.daysCount === 1) {
    return input.recommendedTargetTimeSlot ? `later today in the ${input.recommendedTargetTimeSlot} slot` : null;
  }

  return input.recommendedTargetDayNumber
    ? `Day ${input.recommendedTargetDayNumber}`
    : null;
}

export async function POST(request: Request): Promise<Response> {
  const provider = getActiveProvider();
  if (!provider) {
    return createApiError('api_key_missing', 'Running in demo mode — AI features need an API key.', 503);
  }

  const parsedRequest = await parseRequestBody(request, SwapStopRequestSchema);
  if (!parsedRequest.success) {
    return parsedRequest.response;
  }

  const input = parsedRequest.data;
  const moveTarget = input.disposition === 'move'
    ? getMoveTargetDescription({
      daysCount: input.tripContext.daysCount,
      recommendedTargetDayNumber: input.recommendedTargetDayNumber,
      recommendedTargetTimeSlot: input.recommendedTargetTimeSlot,
    })
    : null;

  if (input.disposition === 'move' && !moveTarget) {
    return createApiError('validation_failed', 'Please choose where to move this stop before trying again.', 400);
  }

  const actionInstruction = input.disposition === 'skip'
    ? [
      `The user wants to skip ${input.stopToChange.title} because: ${input.reason}.`,
      `Find a real replacement for the ${input.stopToChange.timeSlot} slot on Day ${input.currentDayNumber}.`,
      'It must fit the reason and sit close to the other stops that day.',
      'Set actionTaken to skipped_and_replaced and do not include relocatedStopUpdate.',
    ].join(' ')
    : [
      `The user wants to keep ${input.stopToChange.title}, but move it from Day ${input.currentDayNumber} to ${moveTarget}.`,
      `Find a real replacement for the current ${input.stopToChange.timeSlot} slot that fits: ${input.reason}.`,
      `Return the target day’s complete updated stop list with ${input.stopToChange.title} inserted in geographic order.`,
      `Set actionTaken to ${input.tripContext.daysCount === 1 ? 'moved_within_day' : 'moved_and_replaced'} and include relocatedStopUpdate.`,
    ].join(' ');

  const modelsToTry = getLanguageModelCascade(provider);

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const result = await generateObject({
        model,
        schema: SwapStopResponseSchema,
        schemaName: 'swap_stop_response',
        system: [
          'You are a practical local travel planner revising one stop in an existing itinerary.',
          'Choose only real places in the trip destination and preserve a calm, realistic pace.',
          'Keep the same time-slot label on the replacement stop unless this is a same-day move.',
          'Speak like a thoughtful local friend. Never use jargon, technical terms, marketing speak, or robotic language.',
        ].join(' '),
        prompt: [
          `Trip: ${input.tripContext.destination}, ${input.tripContext.country}; ${input.tripContext.daysCount} days.`,
          actionInstruction,
          `Current itinerary days: ${JSON.stringify(input.tripContext.days)}.`,
        ].join('\n'),
        temperature: 0.35,
        maxRetries: 1,
        abortSignal: getLlmAbortSignal(),
      });

      return Response.json(result.object, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      lastError = err;
    }
  }

  return createGenerationError(lastError, 'swap_failed', "Couldn't find a replacement right now. Try a different reason?");
}
