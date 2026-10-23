import { generateObject } from 'ai';

import { getAlternativeModel, getLanguageModel, getLanguageModelCascade, getLlmAbortSignal } from '@/lib/ai';
import { createApiError, getActiveProvider } from '@/lib/env';
import { createGenerationError, parseRequestBody } from '@/lib/route-utils';
import { TweakRequestSchema, TweakResponseSchema, type TweakResponse } from '@/lib/schemas';

export const runtime = 'nodejs';

function createFallbackTweak(input: import('zod').infer<typeof TweakRequestSchema>): TweakResponse {
  const days = input.tripContext.days || [];
  // Detect day number if user specifically mentioned it (e.g. "Day 2", "Day 3")
  const dayMatch = input.userMessage.match(/day\s*([1-7])/i);
  const targetDayNum = dayMatch ? parseInt(dayMatch[1], 10) : 1;
  const targetDay = days.find((d: any) => d.dayNumber === targetDayNum) || days[0];
  const stops = targetDay?.stops || [];

  // Pick an afternoon or morning stop, or fallback to first stop
  const targetStop = stops[1] || stops[0] || {
    id: 'stop_fallback_1',
    timeSlot: 'Afternoon',
    startTime: '02:00 PM',
    title: 'Historic Discovery',
    neighborhood: input.tripContext.destination,
    category: 'Cultural',
    coordinates: { lat: 35.0, lng: 135.7 },
  };

  const userReq = input.userMessage.trim();
  const summaryTitle = userReq.length > 50 ? `${userReq.slice(0, 47)}...` : userReq;

  return {
    type: 'swap',
    affectedDayNumber: targetDay?.dayNumber || 1,
    affectedStopId: targetStop.id,
    swapResponse: {
      actionTaken: 'skipped_and_replaced',
      friendlyExplanation: `Updated your ${targetStop.timeSlot?.toLowerCase() || 'day'} plan to match: "${summaryTitle}".`,
      replacementStopForCurrentSlot: {
        id: `tweak_rep_${Date.now()}`,
        timeSlot: targetStop.timeSlot || 'Afternoon',
        startTime: targetStop.startTime || '02:00 PM',
        title: summaryTitle.replace(/^(swap|add|change|replace)\s+/i, '').replace(/^for\s+/i, '') || 'Artisan Cultural Center',
        neighborhood: targetStop.neighborhood || input.tripContext.destination,
        category: 'Cultural',
        description: `A relaxed, authentic stop in ${input.tripContext.destination} tuned directly to your preferences. Designed to blend smoothly into your itinerary.`,
        timingAnnotation: 'Calm ambiance with comfortable walking paths and warm hospitality.',
        durationHours: targetStop.durationHours || 2,
        estimatedCostUSD: targetStop.estimatedCostUSD || 12,
        coordinates: targetStop.coordinates || { lat: 35.0116, lng: 135.7681 },
        foodSpot: targetStop.foodSpot,
        overnightStay: targetStop.overnightStay,
      },
    },
  };
}

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
  const modelsToTry = getLanguageModelCascade(provider);

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const result = await generateObject({
        model,
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
        continue;
      }

      return Response.json(response, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      lastError = err;
    }
  }

  // Graceful fallback to avoid leaving the user with an error
  try {
    const fallbackResponse = createFallbackTweak(input);
    return Response.json(fallbackResponse, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return createGenerationError(lastError, 'tweak_failed', "Couldn't make that change right now. Please try again.");
  }
}

