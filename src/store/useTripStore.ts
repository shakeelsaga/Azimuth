'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StructuralParams,
  FollowUpQuestions,
  TripPlan,
  SwapStopResponse,
  WeatherDay,
} from '@/lib/schemas';
import { demoTrips, type DemoTripId } from '@/lib/demo-trips';

export type AppStep = 'intake' | 'questions' | 'generating' | 'workspace';

export type SavedTripMeta = {
  id: string;
  trip: TripPlan;
  savedAt: string;
};

type ToastMessage = {
  text: string;
  type: 'info' | 'error';
};

type PendingDiff = {
  dayNumber: number;
  stopId: string;
  diffResponse: SwapStopResponse;
};

type DestinationInput = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  daysCount: number;
};

const MAX_UNDO_DEPTH = 10;

interface TripStore {
  step: AppStep;
  destinationInput: DestinationInput | null;
  structuralParams: StructuralParams | null;
  weatherData: WeatherDay[] | null;
  weatherSummary: string | null;
  followUpQuestions: FollowUpQuestions | null;
  userAnswers: Record<string, string>;
  customNotes: string;
  activeTrip: TripPlan | null;
  activeDayNumber: number;
  selectedStopId: string | null;
  hoveredStopId: string | null;
  pendingDiff: PendingDiff | null;
  undoStack: TripPlan[];
  savedTrips: SavedTripMeta[];
  isOnline: boolean;
  toastMessage: ToastMessage | null;
  loadingSwapStopId: string | null;

  setStep: (step: AppStep) => void;
  setDestination: (dest: DestinationInput) => void;
  setStructuralParams: (params: StructuralParams) => void;
  setWeatherData: (data: WeatherDay[]) => void;
  setWeatherSummary: (summary: string) => void;
  setFollowUpQuestions: (q: FollowUpQuestions) => void;
  setUserAnswer: (questionId: string, answer: string) => void;
  setCustomNotes: (notes: string) => void;
  setActiveTrip: (trip: TripPlan) => void;
  loadDemoTrip: (tripId: DemoTripId) => void;
  setActiveDayNumber: (n: number) => void;
  setSelectedStopId: (id: string | null) => void;
  setHoveredStopId: (id: string | null) => void;
  setPendingDiff: (diff: PendingDiff) => void;
  applyPendingDiff: () => void;
  discardPendingDiff: () => void;
  undoLastChange: () => void;
  saveCurrentTrip: () => void;
  deleteSavedTrip: (id: string) => void;
  loadSavedTrip: (id: string) => void;
  resetToIntake: () => void;
  showToast: (text: string, type: 'info' | 'error') => void;
  clearToast: () => void;
  setOnlineStatus: (online: boolean) => void;
  setLoadingSwapStopId: (id: string | null) => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      step: 'intake',
      destinationInput: null,
      structuralParams: null,
      weatherData: null,
      weatherSummary: null,
      followUpQuestions: null,
      userAnswers: {},
      customNotes: '',
      activeTrip: null,
      activeDayNumber: 1,
      selectedStopId: null,
      hoveredStopId: null,
      pendingDiff: null,
      undoStack: [],
      savedTrips: [],
      isOnline: true,
      toastMessage: null,
      loadingSwapStopId: null,

      setStep: (step) => set({ step }),

      setDestination: (dest) => set({ destinationInput: dest }),

      setStructuralParams: (params) => set({ structuralParams: params }),

      setWeatherData: (data) => set({ weatherData: data }),

      setWeatherSummary: (summary) => set({ weatherSummary: summary }),

      setFollowUpQuestions: (q) => set({ followUpQuestions: q }),

      setUserAnswer: (questionId, answer) =>
        set((state) => ({
          userAnswers: { ...state.userAnswers, [questionId]: answer },
        })),

      setCustomNotes: (notes) => set({ customNotes: notes }),

      setActiveTrip: (trip) =>
        set({
          activeTrip: trip,
          activeDayNumber: 1,
          step: 'workspace',
          pendingDiff: null,
          selectedStopId: null,
          hoveredStopId: null,
        }),

      loadDemoTrip: (tripId) => {
        const trip = demoTrips[tripId];
        if (trip) {
          set({
            activeTrip: trip,
            activeDayNumber: 1,
            step: 'workspace',
            pendingDiff: null,
            undoStack: [],
            selectedStopId: null,
            hoveredStopId: null,
          });
        }
      },

      setActiveDayNumber: (n) =>
        set({ activeDayNumber: n, selectedStopId: null, hoveredStopId: null }),

      setSelectedStopId: (id) => set({ selectedStopId: id }),

      setHoveredStopId: (id) => set({ hoveredStopId: id }),

      setPendingDiff: (diff) => set({ pendingDiff: diff }),

      applyPendingDiff: () => {
        const { activeTrip, pendingDiff, undoStack } = get();
        if (!activeTrip || !pendingDiff) return;

        const newUndoStack = [...undoStack, activeTrip].slice(-MAX_UNDO_DEPTH);
        const { dayNumber, stopId, diffResponse } = pendingDiff;

        const updatedDays = activeTrip.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              stops: day.stops.map((stop) =>
                stop.id === stopId ? diffResponse.replacementStopForCurrentSlot : stop,
              ),
            };
          }

          if (
            diffResponse.relocatedStopUpdate &&
            day.dayNumber === diffResponse.relocatedStopUpdate.targetDayNumber
          ) {
            return {
              ...day,
              title: diffResponse.relocatedStopUpdate.updatedDayTitle,
              stops: diffResponse.relocatedStopUpdate.updatedStopsForTargetDay,
            };
          }

          return day;
        });

        set({
          activeTrip: { ...activeTrip, days: updatedDays },
          pendingDiff: null,
          undoStack: newUndoStack,
        });
      },

      discardPendingDiff: () => set({ pendingDiff: null }),

      undoLastChange: () => {
        const { undoStack } = get();
        if (undoStack.length === 0) return;

        const previousTrip = undoStack[undoStack.length - 1];
        set({
          activeTrip: previousTrip,
          undoStack: undoStack.slice(0, -1),
          pendingDiff: null,
        });
      },

      saveCurrentTrip: () => {
        const { activeTrip, savedTrips } = get();
        if (!activeTrip) return;

        const id = `trip-${Date.now()}`;
        const meta: SavedTripMeta = {
          id,
          trip: activeTrip,
          savedAt: new Date().toISOString(),
        };
        set({ savedTrips: [meta, ...savedTrips] });
      },

      deleteSavedTrip: (id) =>
        set((state) => ({
          savedTrips: state.savedTrips.filter((t) => t.id !== id),
        })),

      loadSavedTrip: (id) => {
        const { savedTrips } = get();
        const meta = savedTrips.find((t) => t.id === id);
        if (meta) {
          set({
            activeTrip: meta.trip,
            activeDayNumber: 1,
            step: 'workspace',
            pendingDiff: null,
            undoStack: [],
            selectedStopId: null,
            hoveredStopId: null,
          });
        }
      },

      resetToIntake: () =>
        set({
          step: 'intake',
          destinationInput: null,
          structuralParams: null,
          weatherData: null,
          weatherSummary: null,
          followUpQuestions: null,
          userAnswers: {},
          customNotes: '',
          activeTrip: null,
          activeDayNumber: 1,
          selectedStopId: null,
          hoveredStopId: null,
          pendingDiff: null,
          undoStack: [],
          loadingSwapStopId: null,
        }),

      showToast: (text, type) => set({ toastMessage: { text, type } }),

      clearToast: () => set({ toastMessage: null }),

      setOnlineStatus: (online) => set({ isOnline: online }),

      setLoadingSwapStopId: (id) => set({ loadingSwapStopId: id }),
    }),
    {
      name: 'azimuth-trips-v1',
      partialize: (state) => ({
        savedTrips: state.savedTrips,
      }),
    },
  ),
);
