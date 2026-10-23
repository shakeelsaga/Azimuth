import { z } from 'zod';

const LocationNameSchema = z.string().trim().min(1).max(120);
const ShortTextSchema = z.string().trim().min(1).max(500);
const CoordinatesSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

export const StructuralParamsSchema = z.object({
  travelCompanions: z.enum(['solo', 'couple', 'family_with_kids', 'group_of_friends']),
  tripPurpose: z.enum(['leisure', 'cultural', 'adventure', 'food_and_nightlife']),
  budgetPreference: z.enum(['budget', 'mid_range', 'spare_no_expense']),
});

export const QuestionsRequestSchema = z.object({
  destination: LocationNameSchema,
  country: LocationNameSchema,
  daysCount: z.number().int().min(1).max(7),
  weatherSummary: z.string().trim().max(1_000).optional(),
  structuralParams: StructuralParamsSchema,
});

export const GenerateRequestSchema = z.object({
  destination: LocationNameSchema,
  country: LocationNameSchema,
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  daysCount: z.number().int().min(1).max(7),
  weatherSummary: z.string().trim().max(1_000).optional(),
  structuralParams: StructuralParamsSchema,
  userAnswers: z.record(z.string().trim().min(1).max(80), z.string().trim().max(500)),
  customNotes: z.string().trim().max(1_000).optional(),
});

export const SwapStopRequestSchema = z.object({
  tripContext: z.object({
    destination: LocationNameSchema,
    country: LocationNameSchema,
    daysCount: z.number().int().min(1).max(7),
    structuralParams: StructuralParamsSchema,
    days: z.array(z.any()).min(1).max(7),
  }),
  currentDayNumber: z.number().int().min(1).max(7),
  stopToChange: z.object({
    id: z.string().trim().min(1).max(120),
    title: LocationNameSchema,
    timeSlot: z.enum(['Morning', 'Afternoon', 'Evening']),
    category: z.enum(['Nature', 'Dining', 'Cultural', 'Rest', 'Adventure', 'Shopping']),
  }),
  reason: ShortTextSchema,
  disposition: z.enum(['skip', 'move']),
  recommendedTargetDayNumber: z.number().int().min(1).max(7).optional(),
  recommendedTargetTimeSlot: z.enum(['Morning', 'Afternoon', 'Evening']).optional(),
});

export const TweakRequestSchema = z.object({
  tripContext: z.object({
    destination: LocationNameSchema,
    country: LocationNameSchema,
    daysCount: z.number().int().min(1).max(7),
    structuralParams: StructuralParamsSchema,
    days: z.array(z.any()).min(1).max(7),
  }),
  userMessage: z.string().trim().min(1).max(500),
});

export const FollowUpQuestionsSchema = z.object({
  greeting: z.string().trim().min(1).max(300).describe('A warm, one-sentence human reaction to their destination choice.'),
  questions: z.array(
    z.object({
      id: z.string().trim().min(1).max(80),
      question: z.string().trim().min(1).max(120).describe('Simple, conversational question under 12 words.'),
      options: z.array(
        z.object({
          label: z.string().trim().min(1).max(80).describe('Short 2-5 word everyday answer.'),
          description: z.string().trim().min(1).max(160).describe('Brief 4-8 word example of what this means.'),
        }),
      ).min(3).max(4),
    }),
  ).length(3),
});

export const ActivityStopSchema = z.object({
  id: z.string().trim().min(1).max(120),
  timeSlot: z.enum(['Morning', 'Afternoon', 'Evening']),
  startTime: z.string().trim().min(1).max(30).describe('For example, "09:00 AM".'),
  title: LocationNameSchema.describe('Name of the place or activity.'),
  neighborhood: LocationNameSchema.describe('Area or district name.'),
  category: z.enum(['Nature', 'Dining', 'Cultural', 'Rest', 'Adventure', 'Shopping']),
  description: z.string().trim().min(1).max(700).describe('Two warm, simple sentences on why this place is worth visiting.'),
  timingAnnotation: z.string().trim().min(1).max(300).describe('A practical human note about timing, crowds, or closures.'),
  durationHours: z.number().finite().min(0.5).max(6),
  estimatedCostUSD: z.number().finite().min(0),
  coordinates: CoordinatesSchema,
  foodSpot: z.object({
    name: LocationNameSchema,
    dishToTry: z.string().trim().min(1).max(120),
    vibe: z.string().trim().min(1).max(240),
  }).optional(),
  overnightStay: z.object({
    name: LocationNameSchema.describe('Hotel, hostel, or guesthouse name.'),
    priceRangeUSD: z.string().trim().min(1).max(80).describe('For example, "$40-60/night".'),
    vibe: z.string().trim().min(1).max(300).describe('One sentence describing the feel of the stay.'),
  }).optional().describe('Only include this for the last stop of a day.'),
});

export const DayPlanSchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  title: z.string().trim().min(1).max(160).describe('Short theme for the day.'),
  neighborhoodFocus: LocationNameSchema,
  weatherSummary: z.string().trim().min(1).max(300).optional(),
  stops: z.array(ActivityStopSchema).min(3).max(4),
});

export const TripPlanSchema = z.object({
  destination: LocationNameSchema,
  country: LocationNameSchema,
  daysCount: z.number().int().min(1).max(7),
  centerCoordinates: CoordinatesSchema,
  friendlyIntro: z.string().trim().min(1).max(700).describe('Two calm, welcoming sentences that summarize the trip.'),
  suggestedTweakPrompts: z.array(z.string().trim().min(1).max(160)).min(2).max(5),
  budgetSummary: z.object({
    currencyNote: z.string().trim().min(1).max(300),
    dailyAverageUSD: z.number().finite().min(0),
    accommodationPerNightUSD: z.number().finite().min(0),
    foodPerDayUSD: z.number().finite().min(0),
    transitAndTicketsPerDayUSD: z.number().finite().min(0),
    moneySavingTrick: z.string().trim().min(1).max(400),
  }),
  packingItems: z.array(
    z.object({
      item: z.string().trim().min(1).max(120),
      reason: z.string().trim().min(1).max(300),
    }),
  ).min(3).max(6),
  beforeYouGoTips: z.array(z.string().trim().min(1).max(400)).min(2).max(5),
  days: z.array(DayPlanSchema).min(1).max(7),
});

export const SwapStopResponseSchema = z.object({
  actionTaken: z.enum(['skipped_and_replaced', 'moved_and_replaced', 'moved_within_day']),
  friendlyExplanation: z.string().trim().min(1).max(500).describe('A plain one- or two-sentence explanation of the change.'),
  replacementStopForCurrentSlot: ActivityStopSchema,
  relocatedStopUpdate: z.object({
    targetDayNumber: z.number().int().min(1).max(7),
    targetTimeSlot: z.enum(['Morning', 'Afternoon', 'Evening']),
    updatedDayTitle: z.string().trim().min(1).max(160),
    updatedStopsForTargetDay: z.array(ActivityStopSchema).min(3).max(4),
  }).optional(),
});

export const TweakResponseSchema = z.object({
  type: z.enum(['swap', 'clarification']),
  affectedDayNumber: z.number().int().min(1).max(7).optional(),
  affectedStopId: z.string().trim().min(1).max(120).optional(),
  swapResponse: SwapStopResponseSchema.optional(),
  clarificationMessage: z.string().trim().min(1).max(500).optional(),
});

export const TransitBridgeInfoSchema = z.object({
  fromStopId: z.string(),
  toStopId: z.string(),
  distanceKm: z.number().finite().min(0),
  distanceDisplay: z.string(),
  mode: z.enum(['Walk', 'Transit', 'Drive']),
  durationMinutes: z.number().int().min(0),
  durationDisplay: z.string(),
  bufferNote: z.string(),
});

export const WeatherDaySchema = z.object({
  date: z.string(),
  weatherCode: z.number().int(),
  weatherLabel: z.string(),
  weatherIcon: z.string(),
  temperatureHighC: z.number().finite(),
  temperatureLowC: z.number().finite(),
});

export const CityResultSchema = z.object({
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  timezone: z.string(),
});

export type StructuralParams = z.infer<typeof StructuralParamsSchema>;
export type QuestionsRequest = z.infer<typeof QuestionsRequestSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type SwapStopRequest = z.infer<typeof SwapStopRequestSchema>;
export type TweakRequest = z.infer<typeof TweakRequestSchema>;
export type FollowUpQuestions = z.infer<typeof FollowUpQuestionsSchema>;
export type ActivityStop = z.infer<typeof ActivityStopSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
export type TripPlan = z.infer<typeof TripPlanSchema>;
export type SwapStopResponse = z.infer<typeof SwapStopResponseSchema>;
export type TweakResponse = z.infer<typeof TweakResponseSchema>;
export type TransitBridgeInfo = z.infer<typeof TransitBridgeInfoSchema>;
export type WeatherDay = z.infer<typeof WeatherDaySchema>;
export type CityResult = z.infer<typeof CityResultSchema>;
