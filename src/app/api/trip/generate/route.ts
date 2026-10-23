import { generateObject } from 'ai';

import { getLanguageModel, getLanguageModelCascade, getLlmAbortSignal } from '@/lib/ai';
import { createApiError, getActiveProvider } from '@/lib/env';
import { sanitizeTripCoordinates } from '@/lib/geo';
import { createGenerationError, parseRequestBody } from '@/lib/route-utils';
import { GenerateRequestSchema, TripPlanSchema, type TripPlan } from '@/lib/schemas';
import { generateWeatherSummary, getWeatherForecast } from '@/lib/weather';

export const runtime = 'nodejs';

function formatDayWeather(
  weather: Awaited<ReturnType<typeof getWeatherForecast>>[number] | undefined,
): string | undefined {
  if (!weather) {
    return undefined;
  }

  return `${weather.weatherLabel}, ${Math.round(weather.temperatureLowC)}-${Math.round(weather.temperatureHighC)}°C`;
}

function normalizeGeneratedTrip(
  generatedTrip: TripPlan,
  input: { destination: string; country: string; daysCount: number; lat: number; lng: number },
  weather: Awaited<ReturnType<typeof getWeatherForecast>>,
): TripPlan {
  if (generatedTrip.days.length !== input.daysCount) {
    throw new Error('The generated itinerary did not include every requested day.');
  }

  const trip: TripPlan = {
    ...generatedTrip,
    destination: input.destination,
    country: input.country,
    daysCount: input.daysCount,
    centerCoordinates: { lat: input.lat, lng: input.lng },
    days: generatedTrip.days.map((day, index) => ({
      ...day,
      dayNumber: index + 1,
      ...(weather[index] ? { weatherSummary: formatDayWeather(weather[index]) } : { weatherSummary: undefined }),
    })),
  };

  return sanitizeTripCoordinates(trip);
}

export async function POST(request: Request): Promise<Response> {
  const provider = getActiveProvider();
  if (!provider) {
    return createApiError('api_key_missing', 'Running in demo mode — AI features need an API key.', 503);
  }

  const parsedRequest = await parseRequestBody(request, GenerateRequestSchema);
  if (!parsedRequest.success) {
    return parsedRequest.response;
  }

  const input = parsedRequest.data;
  const weather = await getWeatherForecast(input.lat, input.lng);
  const weatherSummary = input.weatherSummary ?? generateWeatherSummary(weather, input.daysCount);

  const modelsToTry = getLanguageModelCascade(provider);
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const result = await generateObject({
        model,
        schema: TripPlanSchema,
        schemaName: 'trip_plan',
        system: [
          'You are an expert travel planner creating a realistic, human-paced day-by-day itinerary.',
          'Maximum three to four stops per day; never more than four. Morning starts no earlier than 09:00 AM and evenings end by 09:00 PM.',
          `Every place must really exist in ${input.destination}; coordinates must be accurate and within 30 km of ${input.lat}, ${input.lng}.`,
          'Keep consecutive stops geographically close, ideally under 5 km apart. Include practical notes about crowds, closures, and timing.',
          'Include a local food spot for at least two stops each day and an overnight suggestion for the final stop each day.',
          'Include 3 to 5 practical packing items, 3 before-you-go tips, and 3 suggested tweak prompts.',
          `Respect the ${input.structuralParams.budgetPreference} budget.`,
          'Speak like a thoughtful local friend. Never use jargon, technical terms, marketing speak, or robotic language.',
        ].join(' '),
        prompt: [
          `Destination: ${input.destination}, ${input.country}.`,
          `Trip length: ${input.daysCount} days.`,
          `Travellers: ${input.structuralParams.travelCompanions}. Purpose: ${input.structuralParams.tripPurpose}. Budget: ${input.structuralParams.budgetPreference}.`,
          `Weather: ${weatherSummary}`,
          `Their answers: ${JSON.stringify(input.userAnswers)}.`,
          `Anything else they shared: ${input.customNotes || 'Nothing else.'}`,
        ].join('\n'),
        temperature: 0.45,
        maxRetries: 1,
        abortSignal: getLlmAbortSignal(),
      });

      const trip = normalizeGeneratedTrip(result.object, input, weather);
      return Response.json(trip, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      lastError = error;
    }
  }

  return createGenerationError(lastError, 'generation_failed', "Couldn't build that trip right now.");
}
