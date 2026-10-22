import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateObject: vi.fn(),
  getLanguageModel: vi.fn(() => ({})),
  getLlmAbortSignal: vi.fn(() => AbortSignal.timeout(1_000)),
  getWeatherForecast: vi.fn(),
  generateWeatherSummary: vi.fn(),
}));

vi.mock('ai', () => ({ generateObject: mocks.generateObject }));
vi.mock('@/lib/ai', () => ({
  getLanguageModel: mocks.getLanguageModel,
  getLlmAbortSignal: mocks.getLlmAbortSignal,
}));
vi.mock('@/lib/weather', () => ({
  getWeatherForecast: mocks.getWeatherForecast,
  generateWeatherSummary: mocks.generateWeatherSummary,
}));

import { POST as generatePost } from '@/app/api/trip/generate/route';
import { POST as questionsPost } from '@/app/api/trip/questions/route';
import { POST as swapStopPost } from '@/app/api/trip/swap-stop/route';
import { POST as tweakPost } from '@/app/api/trip/tweak/route';
import { kyotoTrip } from '@/lib/demo-trips';
import { TripPlanSchema } from '@/lib/schemas';

const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const originalGroqKey = process.env.GROQ_API_KEY;

const structuralParams = {
  travelCompanions: 'couple' as const,
  tripPurpose: 'cultural' as const,
  budgetPreference: 'mid_range' as const,
};

function request(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function enableProvider(): void {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-only-placeholder';
  delete process.env.GROQ_API_KEY;
}

function disableProviders(): void {
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.GROQ_API_KEY;
}

function restoreEnvironmentVariable(name: 'GOOGLE_GENERATIVE_AI_API_KEY' | 'GROQ_API_KEY', value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

beforeEach(() => {
  mocks.generateObject.mockReset();
  mocks.getWeatherForecast.mockReset();
  mocks.getWeatherForecast.mockResolvedValue([]);
  mocks.generateWeatherSummary.mockReset();
  mocks.generateWeatherSummary.mockReturnValue('Weather unavailable.');
  disableProviders();
});

afterAll(() => {
  restoreEnvironmentVariable('GOOGLE_GENERATIVE_AI_API_KEY', originalGoogleKey);
  restoreEnvironmentVariable('GROQ_API_KEY', originalGroqKey);
});

describe('trip API routes', () => {
  it('returns demo mode consistently when neither provider is configured', async () => {
    const responses = await Promise.all([
      questionsPost(request('/api/trip/questions', {})),
      generatePost(request('/api/trip/generate', {})),
      swapStopPost(request('/api/trip/swap-stop', {})),
      tweakPost(request('/api/trip/tweak', {})),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ error: 'api_key_missing' });
    }
    expect(mocks.generateObject).not.toHaveBeenCalled();
  });

  it('rejects malformed input before invoking an AI provider', async () => {
    enableProvider();

    const response = await generatePost(request('/api/trip/generate', { destination: '' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'validation_failed',
      message: 'Please check the trip details and try again.',
    });
    expect(mocks.generateObject).not.toHaveBeenCalled();
  });

  it('returns schema-shaped follow-up questions', async () => {
    enableProvider();
    const generatedQuestions = {
      greeting: 'Kyoto is a lovely choice for a slower few days.',
      questions: [
        { id: 'pace', question: 'How full should your days feel?', options: [{ label: 'Very relaxed', description: 'Plenty of pauses and cafés' }, { label: 'A good mix', description: 'Highlights with breathing room' }, { label: 'See a lot', description: 'Happy with full days' }] },
        { id: 'food', question: 'What food sounds most exciting?', options: [{ label: 'Market snacks', description: 'Easy things to graze on' }, { label: 'Noodle shops', description: 'Warm local comfort food' }, { label: 'Special dinner', description: 'One memorable reservation' }] },
        { id: 'evenings', question: 'How would you like evenings?', options: [{ label: 'Quiet strolls', description: 'Lanterns and side streets' }, { label: 'Bars and bites', description: 'Casual places to linger' }, { label: 'Early nights', description: 'Rested for tomorrow' }] },
      ],
    };
    mocks.generateObject.mockResolvedValue({ object: generatedQuestions });

    const response = await questionsPost(request('/api/trip/questions', {
      destination: 'Kyoto',
      country: 'Japan',
      daysCount: 3,
      structuralParams,
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(generatedQuestions);
  });

  it('normalizes trusted trip context before returning a generated itinerary', async () => {
    enableProvider();
    mocks.getWeatherForecast.mockResolvedValue([
      {
        date: '2026-10-22',
        weatherCode: 0,
        weatherLabel: 'Clear sky',
        weatherIcon: '☀️',
        temperatureHighC: 28,
        temperatureLowC: 20,
      },
    ]);
    mocks.generateObject.mockResolvedValue({
      object: {
        ...kyotoTrip,
        destination: 'Incorrect city',
        country: 'Incorrect country',
        centerCoordinates: { lat: 40.7128, lng: -74.006 },
      },
    });

    const response = await generatePost(request('/api/trip/generate', {
      destination: 'Kyoto',
      country: 'Japan',
      lat: 35.0116,
      lng: 135.7681,
      daysCount: 3,
      structuralParams,
      userAnswers: { pace: 'A good mix' },
    }));

    expect(response.status).toBe(200);
    const trip = TripPlanSchema.parse(await response.json());
    expect(trip.destination).toBe('Kyoto');
    expect(trip.country).toBe('Japan');
    expect(trip.centerCoordinates).toEqual({ lat: 35.0116, lng: 135.7681 });
    expect(trip.days[0].weatherSummary).toBe('Clear sky, 20-28°C');
  });

  it('returns a schema-shaped stop replacement', async () => {
    enableProvider();
    const replacementStop = kyotoTrip.days[0].stops[1];
    const generatedSwap = {
      actionTaken: 'skipped_and_replaced' as const,
      friendlyExplanation: 'This keeps the afternoon close by and gives you a gentler break.',
      replacementStopForCurrentSlot: replacementStop,
    };
    mocks.generateObject.mockResolvedValue({ object: generatedSwap });

    const response = await swapStopPost(request('/api/trip/swap-stop', {
      tripContext: {
        destination: 'Kyoto',
        country: 'Japan',
        daysCount: 3,
        structuralParams,
        days: kyotoTrip.days,
      },
      currentDayNumber: 1,
      stopToChange: kyotoTrip.days[0].stops[0],
      reason: 'Too tired — want something chill',
      disposition: 'skip',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(generatedSwap);
  });

  it('returns a complete tweak swap when the request is clear', async () => {
    enableProvider();
    const generatedTweak = {
      type: 'swap' as const,
      affectedDayNumber: 1,
      affectedStopId: kyotoTrip.days[0].stops[0].id,
      swapResponse: {
        actionTaken: 'skipped_and_replaced' as const,
        friendlyExplanation: 'A quieter nearby option makes the morning easier.',
        replacementStopForCurrentSlot: kyotoTrip.days[0].stops[1],
      },
    };
    mocks.generateObject.mockResolvedValue({ object: generatedTweak });

    const response = await tweakPost(request('/api/trip/tweak', {
      tripContext: {
        destination: 'Kyoto',
        country: 'Japan',
        daysCount: 3,
        structuralParams,
        days: kyotoTrip.days,
      },
      userMessage: 'Make the first morning more relaxed',
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(generatedTweak);
  });

  it('turns provider rate limits and timeouts into friendly route errors', async () => {
    enableProvider();
    const validRequest = () => request('/api/trip/questions', {
      destination: 'Kyoto',
      country: 'Japan',
      daysCount: 3,
      structuralParams,
    });

    mocks.generateObject.mockRejectedValueOnce(Object.assign(new Error('rate limited'), { statusCode: 429 }));
    const rateLimited = await questionsPost(validRequest());
    expect(rateLimited.status).toBe(429);
    await expect(rateLimited.json()).resolves.toMatchObject({ error: 'rate_limited' });

    mocks.generateObject.mockRejectedValueOnce(new Error('request timed out'));
    const timedOut = await questionsPost(validRequest());
    expect(timedOut.status).toBe(504);
    await expect(timedOut.json()).resolves.toMatchObject({ error: 'generation_timeout' });
  });
});
