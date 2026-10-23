'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTripStore } from '@/store/useTripStore';
import { UiverseLoader } from '@/components/animations/UiverseLoader';
import { FallbackBanner } from '@/components/shared/FallbackBanner';
import { getWeatherForecast, generateWeatherSummary } from '@/lib/weather';
import { sanitizeTripCoordinates } from '@/lib/geo';
import type { FollowUpQuestions as FollowUpQuestionsType, TripPlan } from '@/lib/schemas';

export function FollowUpQuestions() {
  const destinationInput = useTripStore((s) => s.destinationInput);
  const structuralParams = useTripStore((s) => s.structuralParams);
  const weatherData = useTripStore((s) => s.weatherData);
  const weatherSummary = useTripStore((s) => s.weatherSummary);
  const setWeatherData = useTripStore((s) => s.setWeatherData);
  const setWeatherSummary = useTripStore((s) => s.setWeatherSummary);
  const followUpQuestions = useTripStore((s) => s.followUpQuestions);
  const setFollowUpQuestions = useTripStore((s) => s.setFollowUpQuestions);
  const userAnswers = useTripStore((s) => s.userAnswers);
  const setUserAnswer = useTripStore((s) => s.setUserAnswer);
  const customNotes = useTripStore((s) => s.customNotes);
  const setCustomNotes = useTripStore((s) => s.setCustomNotes);
  const setStep = useTripStore((s) => s.setStep);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const resetToIntake = useTripStore((s) => s.resetToIntake);
  const showToast = useTripStore((s) => s.showToast);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(!followUpQuestions);
  const [errorBannerMessage, setErrorBannerMessage] = useState<string | null>(null);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState(false);

  const hasFetchedRef = useRef(false);

  // Fetch weather and questions on mount
  useEffect(() => {
    if (!destinationInput || !structuralParams) {
      resetToIntake();
      return;
    }

    if (followUpQuestions || hasFetchedRef.current) {
      setIsLoadingQuestions(false);
      return;
    }

    hasFetchedRef.current = true;

    async function loadQuestions() {
      setIsLoadingQuestions(true);
      setErrorBannerMessage(null);

      try {
        let currentSummary = weatherSummary;

        // Fetch forecast if not already present
        if (!weatherData) {
          try {
            const forecast = await getWeatherForecast(destinationInput!.lat, destinationInput!.lng);
            if (forecast && forecast.length > 0) {
              setWeatherData(forecast);
              currentSummary = generateWeatherSummary(forecast, destinationInput!.daysCount);
              setWeatherSummary(currentSummary);
            }
          } catch {
            // Weather fetch is best effort; continue without blocking
          }
        }

        const res = await fetch('/api/trip/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: destinationInput!.name,
            country: destinationInput!.country,
            daysCount: destinationInput!.daysCount,
            weatherSummary: currentSummary || undefined,
            structuralParams,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 503 || errData.error === 'api_key_missing') {
            setErrorBannerMessage('Running in demo mode: an API key is required for live AI generation. You can explore our pre-built itineraries below:');
          } else {
            setErrorBannerMessage("Couldn't generate questions right now. Try a sample trip or check your connection.");
          }
          setIsLoadingQuestions(false);
          return;
        }

        const data: FollowUpQuestionsType = await res.json();
        setFollowUpQuestions(data);
      } catch {
        setErrorBannerMessage("Couldn't connect to the server. Try a sample trip instead.");
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, [
    destinationInput,
    structuralParams,
    followUpQuestions,
    weatherData,
    weatherSummary,
    setWeatherData,
    setWeatherSummary,
    setFollowUpQuestions,
    resetToIntake,
  ]);

  const questionsList = followUpQuestions?.questions ?? [];
  const allAnswered =
    questionsList.length === 3 &&
    questionsList.every((q) => Boolean(userAnswers[q.id]));

  const handleBuildTrip = useCallback(async () => {
    if (!destinationInput || !structuralParams || !allAnswered) return;

    setIsGeneratingTrip(true);
    setStep('generating');

    try {
      const res = await fetch('/api/trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destinationInput.name,
          country: destinationInput.country,
          lat: destinationInput.lat,
          lng: destinationInput.lng,
          daysCount: destinationInput.daysCount,
          weatherSummary: weatherSummary || undefined,
          structuralParams,
          userAnswers,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setIsGeneratingTrip(false);
        setStep('questions');
        if (res.status === 503 || errData.error === 'api_key_missing') {
          setErrorBannerMessage('Live trip generation requires an API key. You can explore these complete sample itineraries:');
        } else {
          showToast('Something went wrong generating the trip. Please try again.', 'error');
          setErrorBannerMessage('Something went wrong building your trip. You can try again or load a sample trip:');
        }
        return;
      }

      const tripData: TripPlan = await res.json();
      const sanitized = sanitizeTripCoordinates(tripData);
      setActiveTrip(sanitized);
    } catch {
      setIsGeneratingTrip(false);
      setStep('questions');
      showToast('Connection failed while building trip.', 'error');
      setErrorBannerMessage('Network connection failed. You can load a sample trip offline:');
    }
  }, [
    destinationInput,
    structuralParams,
    allAnswered,
    weatherSummary,
    userAnswers,
    customNotes,
    setStep,
    setActiveTrip,
    showToast,
  ]);

  if (isGeneratingTrip) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <UiverseLoader
          variant="full"
          messages={[
            'Putting your days together...',
            'Checking local weather...',
            'Mapping out walking times...',
            'Picking local food spots...',
            'Almost ready...',
          ]}
        />
      </div>
    );
  }

  // Strictly guard rendering: only show screen when customized questions are ready
  if (isLoadingQuestions || !followUpQuestions || questionsList.length === 0) {
    if (errorBannerMessage) {
      return (
        <div style={{ minHeight: '100vh', padding: 'clamp(24px, 5vw, 64px) clamp(20px, 4vw, 56px)', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <button
            onClick={resetToIntake}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-steel)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              alignSelf: 'flex-start',
            }}
          >
            ← Back to search
          </button>
          <FallbackBanner message={errorBannerMessage} />
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <UiverseLoader
          variant="full"
          messages={[
            `Getting to know ${destinationInput?.name || 'your destination'}...`,
            'Checking local vibes...',
            'Preparing your choices...',
          ]}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        minHeight: '100vh',
        padding: 'clamp(24px, 5vw, 64px) clamp(20px, 4vw, 56px)',
        maxWidth: '820px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
      }}
    >
      {/* Top back navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={resetToIntake}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-steel)',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          ← Back to search
        </button>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)' }}>
          {destinationInput?.name}, {destinationInput?.country} • {destinationInput?.daysCount} {destinationInput?.daysCount === 1 ? 'Day' : 'Days'}
        </span>
      </div>

      {/* Fallback error banner if questions call failed */}
      {errorBannerMessage && (
        <FallbackBanner message={errorBannerMessage} />
      )}

      {/* Greeting reaction */}
      {followUpQuestions?.greeting && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 'var(--text-subheading)',
            color: 'var(--color-charcoal)',
            lineHeight: 1.5,
            margin: 0,
            maxWidth: '680px',
          }}
        >
          {followUpQuestions.greeting}
        </motion.p>
      )}

      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {questionsList.map((q, qIndex) => {
          const selectedAnswer = userAnswers[q.id];

          return (
            <motion.div
              key={q.id || `question-${qIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + qIndex * 0.1, duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h2
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: 'var(--tracking-heading)',
                  lineHeight: 'var(--leading-heading)',
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                {q.question}
              </h2>

              {/* Options pill buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {q.options.map((option, optIndex) => {
                  const isSelected = selectedAnswer === option.label;

                  return (
                    <button
                      key={`opt-${q.id || qIndex}-${optIndex}-${option.label || 'opt'}`}
                      type="button"
                      onClick={() => setUserAnswer(q.id, option.label)}
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        textAlign: 'left',
                        padding: '12px 24px',
                        minHeight: '48px',
                        borderRadius: 'var(--radius-buttons)',
                        border: isSelected ? '1px solid var(--color-ink)' : '1px solid #d5d5d5',
                        background: isSelected ? 'var(--color-ink)' : 'var(--color-faint-ash)',
                        color: isSelected ? 'var(--color-paper)' : 'var(--color-ink)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: '15px', fontWeight: isSelected ? 600 : 500, lineHeight: 1.25, textAlign: 'left' }}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: isSelected ? '#d8d8d8' : 'var(--color-steel)',
                            marginTop: '4px',
                            lineHeight: 1.2,
                            textAlign: 'left',
                          }}
                        >
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom notes textarea */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}
      >
        <label
          htmlFor="custom-notes"
          style={{ fontSize: 'var(--text-subheading)', fontWeight: 500, color: 'var(--color-ink)' }}
        >
          Anything else we should know?
        </label>
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)', margin: '0 0 6px 0' }}>
          Dietary requirements, mobility notes, special occasions, or places you already know you want to see.
        </p>
        <textarea
          id="custom-notes"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          rows={3}
          placeholder="e.g., We're vegetarian, traveling with a toddler, celebrating our anniversary..."
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 'var(--radius-cards)',
            border: '1px solid var(--color-ink)',
            fontSize: 'var(--text-body-sm)',
            fontFamily: 'inherit',
            outline: 'none',
            background: 'var(--color-paper)',
            resize: 'vertical',
          }}
        />
      </motion.div>

      {/* CTA Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px', paddingBottom: '40px' }}>
        <button
          type="button"
          onClick={handleBuildTrip}
          disabled={!allAnswered}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 36px',
            minHeight: '52px',
            borderRadius: 'var(--radius-buttons)',
            background: allAnswered ? 'var(--color-ink)' : 'var(--color-faint-ash)',
            color: allAnswered ? 'var(--color-paper)' : 'var(--color-steel)',
            border: allAnswered ? '1px solid var(--color-ink)' : '1px solid transparent',
            fontSize: 'var(--text-subheading)',
            fontWeight: 600,
            lineHeight: 1,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            transition: 'background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            gap: '8px',
          }}
          className="build-trip-btn"
        >
          <span>Build my trip</span>
          <span
            className="build-trip-arrow"
            style={{
              display: 'inline-block',
              transition: 'transform var(--transition-fast)',
            }}
          >
            →
          </span>
        </button>
      </div>

      <style>{`
        .build-trip-btn:not(:disabled):hover {
          background: #222222 !important;
          transform: translateY(-1px);
        }
        .build-trip-btn:not(:disabled):hover .build-trip-arrow {
          transform: translateX(6px);
        }
      `}</style>
    </motion.div>
  );
}
