import lzString from 'lz-string';
import { TripPlanSchema, type TripPlan } from './schemas';

export function encodeTripToURL(trip: TripPlan, baseUrl?: string): string {
  const json = JSON.stringify(trip);
  const compressed = lzString.compressToEncodedURIComponent(json);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000');
  const url = new URL(base);
  url.searchParams.set('trip', compressed);
  url.hash = '';
  return url.toString();
}

export function decodeTripFromURL(urlOrParam: string): TripPlan | null {
  try {
    if (!urlOrParam) return null;

    let compressed: string | null = null;
    if (urlOrParam.includes('trip=')) {
      const parsedUrl = new URL(urlOrParam, 'http://localhost');
      compressed = parsedUrl.searchParams.get('trip');
    } else {
      try {
        const parsedUrl = new URL(urlOrParam, 'http://localhost');
        compressed = parsedUrl.searchParams.get('trip') || urlOrParam;
      } catch {
        compressed = urlOrParam;
      }
    }

    if (!compressed) return null;
    const json = lzString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const parsed = JSON.parse(json);
    return TripPlanSchema.parse(parsed);
  } catch {
    return null;
  }
}
