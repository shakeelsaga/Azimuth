'use client';

import { useRef, useEffect } from 'react';
import type { DayPlan, WeatherDay } from '@/lib/schemas';
import { getDayPacingSummary } from '@/lib/geo';

interface DaySelectorProps {
  days: DayPlan[];
  activeDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  weatherData?: WeatherDay[] | null;
}

export function DaySelector({
  days,
  activeDayNumber,
  onSelectDay,
  weatherData,
}: DaySelectorProps) {
  const activeDay = days.find((d) => d.dayNumber === activeDayNumber) || days[0];
  const activePacing = activeDay ? getDayPacingSummary(activeDay) : null;
  const mobileStripRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active pill into view on mobile
  useEffect(() => {
    if (!mobileStripRef.current) return;
    const activeEl = mobileStripRef.current.querySelector<HTMLElement>(
      `[data-day="${activeDayNumber}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeDayNumber]);

  return (
    <div className="day-selector-container">
      {/* ===== Desktop: Vertical Tonal Stack ===== */}
      <div className="desktop-day-selector" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {days.map((day) => {
            const isActive = day.dayNumber === activeDayNumber;
            const formattedNum = String(day.dayNumber).padStart(2, '0');

            return (
              <div key={day.dayNumber} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => onSelectDay(day.dayNumber)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: 'clamp(36px, 4.5vw, 55px)',
                    fontWeight: 700,
                    letterSpacing: 'var(--tracking-heading-lg)',
                    lineHeight: 'var(--leading-heading-lg)',
                    color: isActive ? 'var(--color-ink)' : 'var(--color-steel)',
                    cursor: 'pointer',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#333333';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--color-steel)';
                  }}
                >
                  DAY {formattedNum}
                </button>

                {/* Below active day: pacing summary block */}
                {isActive && activePacing && (
                  <div
                    style={{
                      margin: '12px 0 16px 0',
                      padding: '8px 14px',
                      background: 'var(--color-ink)',
                      color: 'var(--color-paper)',
                      borderRadius: 'var(--radius-buttons)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      boxSizing: 'border-box',
                      gap: '8px',
                      width: 'fit-content',
                    }}
                  >
                    <span>{activePacing.paceLabel}</span>
                    <span>•</span>
                    <span>{activePacing.stopCount} STOPS</span>
                    <span>•</span>
                    <span>{activePacing.totalTransitMinutes}M TRANSIT</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Mobile: Horizontal Scroll Pill Strip ===== */}
      <div
        className="mobile-day-selector day-selector-mobile"
        ref={mobileStripRef}
        style={{
          overflowX: 'auto',
          display: 'none', // toggled via CSS media queries in layout
          gap: '8px',
          padding: '8px 0',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {days.map((day) => {
          const isActive = day.dayNumber === activeDayNumber;
          const formattedNum = String(day.dayNumber).padStart(2, '0');

          return (
            <button
              key={`m-day-${day.dayNumber}`}
              data-day={day.dayNumber}
              type="button"
              onClick={() => onSelectDay(day.dayNumber)}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 18px',
                lineHeight: 1,
                boxSizing: 'border-box',
                borderRadius: 'var(--radius-buttons)',
                background: isActive ? 'var(--color-ink)' : 'var(--color-faint-ash)',
                color: isActive ? 'var(--color-paper)' : 'var(--color-ink)',
                border: '1px solid transparent',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'background var(--transition-fast), color var(--transition-fast)',
              }}
            >
              DAY {formattedNum}
            </button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .desktop-day-selector {
            display: none !important;
          }
          .mobile-day-selector {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
