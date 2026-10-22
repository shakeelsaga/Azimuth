import { describe, expect, it } from 'vitest';

import { generateWeatherSummary, getWeatherFromCode } from '@/lib/weather';

describe('weather utilities', () => {
  it('maps the documented clear-sky WMO code', () => {
    expect(getWeatherFromCode(0)).toEqual({ label: 'Clear sky', icon: '☀️' });
  });

  it('makes a concise grouped summary for an itinerary prompt', () => {
    expect(generateWeatherSummary([
      { date: '2026-10-22', weatherCode: 0, weatherLabel: 'Clear sky', weatherIcon: '☀️', temperatureHighC: 28, temperatureLowC: 20 },
      { date: '2026-10-23', weatherCode: 0, weatherLabel: 'Clear sky', weatherIcon: '☀️', temperatureHighC: 30, temperatureLowC: 21 },
      { date: '2026-10-24', weatherCode: 61, weatherLabel: 'Rain', weatherIcon: '🌧️', temperatureHighC: 24, temperatureLowC: 19 },
    ], 3)).toBe('Days 1-2: clear sky (20-30°C). Day 3: rain (19-24°C).');
  });
});
