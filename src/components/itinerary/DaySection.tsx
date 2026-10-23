'use client';

import type { DayPlan, ActivityStop, WeatherDay } from '@/lib/schemas';
import { AnimatedList } from '@/components/animations/AnimatedList';
import { StopCard } from '@/components/itinerary/StopCard';
import { TransitBridge } from '@/components/itinerary/TransitBridge';
import { WeatherIcon } from '@/components/shared/WeatherIcon';

interface DaySectionProps {
  day: DayPlan;
  weather?: WeatherDay;
  onChangeStop: (stop: ActivityStop) => void;
}

export function DaySection({ day, weather, onChangeStop }: DaySectionProps) {
  // Build paired elements: [StopCard, TransitBridge, StopCard, TransitBridge, StopCard...]
  const elements = day.stops.flatMap((stop, index) => {
    const card = (
      <StopCard
        key={`stop-${stop.id}`}
        stop={stop}
        dayNumber={day.dayNumber}
        stopIndex={index}
        onChangeStop={onChangeStop}
      />
    );

    if (index < day.stops.length - 1) {
      const nextStop = day.stops[index + 1];
      const bridge = (
        <TransitBridge
          key={`bridge-${stop.id}-${nextStop.id}`}
          fromStop={stop}
          toStop={nextStop}
        />
      );
      return [card, bridge];
    }

    return [card];
  });

  return (
    <section className="day-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Day header banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-heading)',
              lineHeight: 1.2,
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            {day.title}
          </h2>

          {/* Weather badge */}
          {weather ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-faint-ash)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-ink)',
                fontWeight: 500,
              }}
            >
              <WeatherIcon code={weather.weatherCode} size={15} />
              <span>
                {weather.weatherLabel} • {Math.round(weather.temperatureHighC)}° / {Math.round(weather.temperatureLowC)}°C
              </span>
            </div>
          ) : day.weatherSummary ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-faint-ash)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-steel)',
              }}
            >
              <WeatherIcon code={1} size={15} />
              <span>{day.weatherSummary}</span>
            </div>
          ) : (
            <div
              style={{
                fontSize: 'var(--text-caption)',
                color: 'var(--color-steel)',
                padding: '6px 12px',
              }}
            >
              Forecast not available
            </div>
          )}
        </div>

        {day.neighborhoodFocus && (
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)' }}>
            Exploring: <strong style={{ color: 'var(--color-charcoal)' }}>{day.neighborhoodFocus}</strong>
          </div>
        )}
      </div>

      {/* Staggered animated stop cards & transit bridges */}
      <AnimatedList listKey={String(day.dayNumber)}>
        {elements}
      </AnimatedList>
    </section>
  );
}
