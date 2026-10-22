import type { ActivityStop, DayPlan, TransitBridgeInfo, TripPlan } from '@/lib/schemas';

export type Coordinates = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6_371;
const STREET_ROUTING_MULTIPLIER = 1.25;
const MAX_STOP_DISTANCE_FROM_CENTER_KM = 90;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function calculateDirectDistanceKm(first: Coordinates, second: Coordinates): number {
  const latitudeDelta = toRadians(second.lat - first.lat);
  const longitudeDelta = toRadians(second.lng - first.lng);
  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * centralAngle;
}

/**
 * Estimates a real-world route distance by applying the required 1.25 street-routing multiplier.
 */
export function calculateDistanceKm(first: Coordinates, second: Coordinates): number {
  return calculateDirectDistanceKm(first, second) * STREET_ROUTING_MULTIPLIER;
}

function getTransitDetails(distanceKm: number): Pick<TransitBridgeInfo, 'mode' | 'durationMinutes'> {
  if (distanceKm <= 1.8) {
    return {
      mode: 'Walk',
      durationMinutes: Math.max(5, Math.round((distanceKm / 4.5) * 60)),
    };
  }

  if (distanceKm <= 12) {
    return {
      mode: 'Transit',
      durationMinutes: Math.round(6 + (distanceKm / 22) * 60),
    };
  }

  return {
    mode: 'Drive',
    durationMinutes: Math.round(10 + (distanceKm / 40) * 60),
  };
}

function formatDuration(mode: TransitBridgeInfo['mode'], durationMinutes: number): string {
  if (mode === 'Walk') {
    return `${durationMinutes} min walk`;
  }

  if (mode === 'Transit') {
    return `${durationMinutes} min by transit`;
  }

  return `${durationMinutes} min by car`;
}

/**
 * Builds the human-readable bridge shown between two itinerary stops.
 */
export function getTransitBridgeInfo(first: ActivityStop, second: ActivityStop): TransitBridgeInfo {
  const distanceKm = calculateDistanceKm(first.coordinates, second.coordinates);
  const { mode, durationMinutes } = getTransitDetails(distanceKm);
  const distanceDisplay = distanceKm < 1
    ? `${Math.round(distanceKm * 1_000)} m`
    : `${distanceKm.toFixed(1)} km`;

  let bufferNote = 'Quick hop between stops';
  if (mode === 'Walk' && distanceKm > 1) {
    bufferNote = 'Allow a few extra minutes to enjoy the walk';
  } else if (mode === 'Transit' && distanceKm > 8) {
    bufferNote = 'Consider grabbing a snack for the ride';
  }

  return {
    fromStopId: first.id,
    toStopId: second.id,
    distanceKm,
    distanceDisplay,
    mode,
    durationMinutes,
    durationDisplay: formatDuration(mode, durationMinutes),
    bufferNote,
  };
}

export function getDayPacingSummary(day: DayPlan): {
  stopCount: number;
  totalTransitMinutes: number;
  paceLabel: 'Relaxed pace' | 'Balanced pace' | 'Full day';
} {
  const totalTransitMinutes = day.stops.slice(1).reduce((total, stop, index) => {
    return total + getTransitBridgeInfo(day.stops[index], stop).durationMinutes;
  }, 0);

  const paceLabel = totalTransitMinutes <= 45
    ? 'Relaxed pace'
    : totalTransitMinutes <= 90
      ? 'Balanced pace'
      : 'Full day';

  return {
    stopCount: day.stops.length,
    totalTransitMinutes,
    paceLabel,
  };
}

function getCentroid(stops: ActivityStop[]): Coordinates | null {
  if (stops.length === 0) {
    return null;
  }

  const total = stops.reduce(
    (coordinates, stop) => ({
      lat: coordinates.lat + stop.coordinates.lat,
      lng: coordinates.lng + stop.coordinates.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / stops.length,
    lng: total.lng / stops.length,
  };
}

/**
 * Chooses the geographically closest, lightest other day for a moved stop.
 */
export function findBestTargetDayForRelocation(
  stopToMove: ActivityStop,
  currentDayNumber: number,
  allDays: DayPlan[],
): number | null {
  let bestCandidate: { dayNumber: number; score: number } | null = null;

  for (const day of allDays) {
    if (day.dayNumber === currentDayNumber) {
      continue;
    }

    const centroid = getCentroid(day.stops);
    if (!centroid) {
      continue;
    }

    const totalScheduledHours = day.stops.reduce((total, stop) => total + stop.durationHours, 0);
    const score = calculateDistanceKm(stopToMove.coordinates, centroid) + 2.5 * totalScheduledHours;

    if (!bestCandidate || score < bestCandidate.score) {
      bestCandidate = { dayNumber: day.dayNumber, score };
    }
  }

  return bestCandidate?.dayNumber ?? null;
}

/**
 * Finds an unused later day-part after a stop is removed from a single-day trip.
 */
export function findNextAvailableSlot(
  currentSlot: ActivityStop['timeSlot'],
  dayStops: ActivityStop[],
): ActivityStop['timeSlot'] | null {
  const slots: ActivityStop['timeSlot'][] = ['Morning', 'Afternoon', 'Evening'];
  const currentIndex = slots.indexOf(currentSlot);
  const occupiedSlots = new Set(dayStops.map((stop) => stop.timeSlot));

  for (const candidate of slots.slice(currentIndex + 1)) {
    if (!occupiedSlots.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function clampCoordinateToDistance(center: Coordinates, outlier: Coordinates, distanceKm: number): Coordinates {
  const centerLatitude = toRadians(center.lat);
  const centerLongitude = toRadians(center.lng);
  const outlierLatitude = toRadians(outlier.lat);
  const outlierLongitude = toRadians(outlier.lng);
  const longitudeDelta = outlierLongitude - centerLongitude;

  const bearing = Math.atan2(
    Math.sin(longitudeDelta) * Math.cos(outlierLatitude),
    Math.cos(centerLatitude) * Math.sin(outlierLatitude) -
      Math.sin(centerLatitude) * Math.cos(outlierLatitude) * Math.cos(longitudeDelta),
  );
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const latitude = Math.asin(
    Math.sin(centerLatitude) * Math.cos(angularDistance) +
      Math.cos(centerLatitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const longitude = centerLongitude + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatitude),
    Math.cos(angularDistance) - Math.sin(centerLatitude) * Math.sin(latitude),
  );

  return {
    lat: toDegrees(latitude),
    lng: ((toDegrees(longitude) + 540) % 360) - 180,
  };
}

/**
 * Prevents a hallucinated coordinate from forcing the map to zoom out to an entire country.
 */
export function sanitizeTripCoordinates(trip: TripPlan): TripPlan {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => {
        const directDistanceKm = calculateDirectDistanceKm(trip.centerCoordinates, stop.coordinates);
        if (directDistanceKm <= MAX_STOP_DISTANCE_FROM_CENTER_KM) {
          return stop;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Clamped outlier coordinates for ${stop.title}.`);
        }

        return {
          ...stop,
          coordinates: clampCoordinateToDistance(
            trip.centerCoordinates,
            stop.coordinates,
            MAX_STOP_DISTANCE_FROM_CENTER_KM,
          ),
        };
      }),
    })),
  };
}
