import type { CityResult, WeatherDay } from '@/lib/schemas';

const EXTERNAL_FETCH_TIMEOUT_MS = 3_500;
const FORECAST_CACHE_TTL_MS = 60 * 60 * 1_000;

type ForecastCacheEntry = {
  expiresAt: number;
  value: WeatherDay[];
};

const forecastCache = new Map<string, ForecastCacheEntry>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

async function fetchJson(url: URL): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);

  // Weather is supplementary; an unavailable upstream should not block trip planning.
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function getWeatherFromCode(code: number): { label: string; icon: string } {
  if (code === 0) {
    return { label: 'Clear sky', icon: '☀️' };
  }
  if ([1, 2, 3].includes(code)) {
    return { label: 'Partly cloudy', icon: '⛅' };
  }
  if ([45, 48].includes(code)) {
    return { label: 'Foggy', icon: '🌫️' };
  }
  if ([51, 53, 55].includes(code)) {
    return { label: 'Light drizzle', icon: '🌦️' };
  }
  if ([61, 63, 65].includes(code)) {
    return { label: 'Rain', icon: '🌧️' };
  }
  if ([71, 73, 75].includes(code)) {
    return { label: 'Snow', icon: '🌨️' };
  }
  if ([80, 81, 82].includes(code)) {
    return { label: 'Rain showers', icon: '🌧️' };
  }
  if ([95, 96, 99].includes(code)) {
    return { label: 'Thunderstorm', icon: '⛈️' };
  }

  return { label: 'Changeable weather', icon: '🌤️' };
}

/** Fetches the top five city matches without throwing if Open-Meteo is unavailable. */
export async function searchCities(query: string): Promise<CityResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmedQuery);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const payload = await fetchJson(url);
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    return [];
  }

  const cities: CityResult[] = [];
  for (const result of payload.results) {
    if (!isRecord(result)) {
      continue;
    }

    const { name, country, country_code: countryCode, latitude, longitude, timezone } = result;
    if (
      typeof name !== 'string' ||
      typeof country !== 'string' ||
      typeof countryCode !== 'string' ||
      !isFiniteNumber(latitude) ||
      !isFiniteNumber(longitude) ||
      typeof timezone !== 'string'
    ) {
      continue;
    }

    cities.push({
      name,
      country,
      countryCode,
      lat: latitude,
      lng: longitude,
      timezone,
    });
  }

  return cities.slice(0, 5);
}

function cloneForecast(forecast: WeatherDay[]): WeatherDay[] {
  return forecast.map((day) => ({ ...day }));
}

/**
 * Retrieves and maps Open-Meteo's seven-day daily forecast. A best-effort in-memory
 * one-hour cache prevents repeated itinerary requests for the same city from hitting the API.
 */
export async function getWeatherForecast(lat: number, lng: number): Promise<WeatherDay[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = forecastCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneForecast(cached.value);
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const payload = await fetchJson(url);
  if (!isRecord(payload) || !isRecord(payload.daily)) {
    return [];
  }

  const dates = payload.daily.time;
  const weatherCodes = payload.daily.weathercode;
  const temperatureHighs = payload.daily.temperature_2m_max;
  const temperatureLows = payload.daily.temperature_2m_min;
  if (
    !Array.isArray(dates) ||
    !Array.isArray(weatherCodes) ||
    !Array.isArray(temperatureHighs) ||
    !Array.isArray(temperatureLows)
  ) {
    return [];
  }

  const forecast: WeatherDay[] = [];
  for (let index = 0; index < dates.length; index += 1) {
    const date = dates[index];
    const weatherCode = weatherCodes[index];
    const temperatureHighC = temperatureHighs[index];
    const temperatureLowC = temperatureLows[index];
    if (
      typeof date !== 'string' ||
      !isFiniteNumber(weatherCode) ||
      !isFiniteNumber(temperatureHighC) ||
      !isFiniteNumber(temperatureLowC)
    ) {
      continue;
    }

    const weather = getWeatherFromCode(weatherCode);
    forecast.push({
      date,
      weatherCode,
      weatherLabel: weather.label,
      weatherIcon: weather.icon,
      temperatureHighC,
      temperatureLowC,
    });
  }

  if (forecast.length > 0) {
    forecastCache.set(cacheKey, {
      expiresAt: Date.now() + FORECAST_CACHE_TTL_MS,
      value: cloneForecast(forecast),
    });
  }

  return forecast;
}

/** Creates a compact, plain-English forecast briefing for an itinerary prompt. */
export function generateWeatherSummary(forecast: WeatherDay[], daysCount: number): string {
  const selectedDays = forecast.slice(0, Math.max(0, daysCount));
  if (selectedDays.length === 0) {
    return 'Weather unavailable.';
  }

  const parts: string[] = [];
  let groupStart = 0;

  for (let index = 1; index <= selectedDays.length; index += 1) {
    const sameWeatherAsPrevious =
      index < selectedDays.length &&
      selectedDays[index].weatherLabel === selectedDays[groupStart].weatherLabel;

    if (sameWeatherAsPrevious) {
      continue;
    }

    const group = selectedDays.slice(groupStart, index);
    const low = Math.round(Math.min(...group.map((day) => day.temperatureLowC)));
    const high = Math.round(Math.max(...group.map((day) => day.temperatureHighC)));
    const dayRange = groupStart === index - 1
      ? `Day ${groupStart + 1}`
      : `Days ${groupStart + 1}-${index}`;
    parts.push(`${dayRange}: ${group[0].weatherLabel.toLowerCase()} (${low}-${high}°C)`);
    groupStart = index;
  }

  return parts.join('. ') + '.';
}
