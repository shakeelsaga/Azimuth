import { describe, expect, it } from 'vitest';

import {
  calculateDistanceKm,
  findNextAvailableSlot,
  getTransitBridgeInfo,
  sanitizeTripCoordinates,
} from '@/lib/geo';
import type { ActivityStop, TripPlan } from '@/lib/schemas';

function makeStop(overrides: Partial<ActivityStop> = {}): ActivityStop {
  return {
    id: 'stop-1',
    timeSlot: 'Morning',
    startTime: '09:00 AM',
    title: 'Test stop',
    neighborhood: 'Test area',
    category: 'Cultural',
    description: 'A small test activity.',
    timingAnnotation: 'Arrive early.',
    durationHours: 1,
    estimatedCostUSD: 0,
    coordinates: { lat: 35.0116, lng: 135.7681 },
    ...overrides,
  };
}

describe('geo utilities', () => {
  it('applies the required 1.25 street-routing multiplier', () => {
    const distance = calculateDistanceKm(
      { lat: 35.0116, lng: 135.7681 },
      { lat: 35.0394, lng: 135.7292 },
    );

    expect(distance).toBeCloseTo(5.8766, 3);
  });

  it('creates a walk bridge with a helpful buffer note', () => {
    const bridge = getTransitBridgeInfo(
      makeStop(),
      makeStop({ id: 'stop-2', coordinates: { lat: 35.018, lng: 135.7681 } }),
    );

    expect(bridge.mode).toBe('Walk');
    expect(bridge.durationDisplay).toMatch(/min walk$/);
    expect(bridge.bufferNote).toBe('Quick hop between stops');
  });

  it('only returns an unused later slot for a single-day move', () => {
    expect(findNextAvailableSlot('Morning', [makeStop({ timeSlot: 'Morning' })])).toBe('Afternoon');
    expect(findNextAvailableSlot('Evening', [makeStop({ timeSlot: 'Evening' })])).toBeNull();
  });

  it('clamps an outlying stop rather than changing the trusted destination center', () => {
    const trip: TripPlan = {
      destination: 'Kyoto',
      country: 'Japan',
      daysCount: 1,
      centerCoordinates: { lat: 35.0116, lng: 135.7681 },
      friendlyIntro: 'A short test trip.',
      suggestedTweakPrompts: ['One', 'Two', 'Three'],
      budgetSummary: {
        currencyNote: 'Test',
        dailyAverageUSD: 1,
        accommodationPerNightUSD: 1,
        foodPerDayUSD: 1,
        transitAndTicketsPerDayUSD: 1,
        moneySavingTrick: 'Walk.',
      },
      packingItems: Array.from({ length: 5 }, (_, index) => ({ item: `Item ${index}`, reason: 'Test' })),
      beforeYouGoTips: ['One', 'Two', 'Three'],
      days: [{
        dayNumber: 1,
        title: 'Test day',
        neighborhoodFocus: 'Kyoto',
        stops: [
          makeStop({ coordinates: { lat: 40.7128, lng: -74.006 } }),
          makeStop({ id: 'stop-2', timeSlot: 'Afternoon' }),
          makeStop({ id: 'stop-3', timeSlot: 'Evening' }),
        ],
      }],
    };

    const sanitized = sanitizeTripCoordinates(trip);
    expect(sanitized.centerCoordinates).toEqual(trip.centerCoordinates);
    expect(calculateDistanceKm(sanitized.centerCoordinates, sanitized.days[0].stops[0].coordinates)).toBeLessThan(115);
  });
});
