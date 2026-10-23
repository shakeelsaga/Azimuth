'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTripStore } from '@/store/useTripStore';
import { UiverseLoader } from '@/components/animations/UiverseLoader';
import type { ActivityStop } from '@/lib/schemas';
import { Clock, UtensilsCrossed, BedDouble, Sparkles } from 'lucide-react';
import { convertPriceRangeString, formatDualPrice } from '@/lib/currency';

interface StopCardProps {
  stop: ActivityStop;
  dayNumber: number;
  stopIndex: number;
  onChangeStop: (stop: ActivityStop) => void;
}

export function StopCard({ stop, dayNumber, stopIndex, onChangeStop }: StopCardProps) {
  const selectedStopId = useTripStore((s) => s.selectedStopId);
  const hoveredStopId = useTripStore((s) => s.hoveredStopId);
  const setSelectedStopId = useTripStore((s) => s.setSelectedStopId);
  const setHoveredStopId = useTripStore((s) => s.setHoveredStopId);
  const pendingDiff = useTripStore((s) => s.pendingDiff);
  const applyPendingDiff = useTripStore((s) => s.applyPendingDiff);
  const discardPendingDiff = useTripStore((s) => s.discardPendingDiff);
  const loadingSwapStopId = useTripStore((s) => s.loadingSwapStopId);
  const trip = useTripStore((s) => s.activeTrip);
  const tripLocation = trip?.country || trip?.destination || stop.neighborhood;

  const isSelected = selectedStopId === stop.id;
  const isHovered = hoveredStopId === stop.id;
  const isLoading = loadingSwapStopId === stop.id;

  const isDiffTarget =
    pendingDiff?.dayNumber === dayNumber && pendingDiff?.stopId === stop.id;
  const diffResponse = isDiffTarget ? pendingDiff.diffResponse : null;

  return (
    <motion.div
      id={`stop-card-${stop.id}`}
      layout="position"
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHoveredStopId(stop.id)}
      onMouseLeave={() => setHoveredStopId(null)}
      onClick={() => setSelectedStopId(stop.id)}
      className="stop-card"
      style={{
        borderRadius: 'var(--radius-cards)',
        padding: 'clamp(16px, 3vw, 24px)',
        background: 'var(--color-faint-ash)',
        border: isSelected || isHovered || isDiffTarget ? '1px solid var(--color-ink)' : '1px solid transparent',
        transform: isSelected ? 'translateY(-2px)' : 'none',
        transition: 'border-color var(--transition-medium), transform var(--transition-fast)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'default',
      }}
    >
      {/* Loading state during swap */}
      {isLoading ? (
        <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
          <UiverseLoader
            variant="inline"
            messages={['Finding a better fit...', 'Checking nearby options...', 'Almost there...']}
          />
        </div>
      ) : isDiffTarget && diffResponse ? (
        /* Inline Diff Preview */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-buttons)',
              }}
            >
              Proposed Change
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)' }}>
              {stop.timeSlot} Slot
            </span>
          </div>

          {/* Outgoing stop */}
          <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--color-steel)' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-steel)' }}>Replaces</div>
            <div
              style={{
                fontSize: 'var(--text-subheading)',
                color: 'var(--color-steel)',
                textDecoration: 'line-through',
                fontWeight: 600,
              }}
            >
              {stop.title}
            </div>
          </div>

          {/* Incoming replacement stop */}
          <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--color-ink)' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-ink)', fontWeight: 600 }}>New Plan</div>
            <div
              style={{
                fontSize: 'var(--text-subheading)',
                color: 'var(--color-ink)',
                fontWeight: 700,
              }}
            >
              {diffResponse.replacementStopForCurrentSlot.title}
            </div>
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-charcoal)',
                margin: '4px 0 0 0',
                lineHeight: 1.45,
              }}
            >
              {diffResponse.replacementStopForCurrentSlot.description}
            </p>
          </div>

          {/* Explanation badge */}
          {diffResponse.friendlyExplanation && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--color-paper)',
                borderRadius: 'var(--radius-small)',
                fontSize: 'var(--text-caption)',
                color: 'var(--color-charcoal)',
                lineHeight: 1.45,
                border: '1px solid #dddddd',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={14} style={{ flexShrink: 0, color: 'var(--color-ink)' }} />
              <span>{diffResponse.friendlyExplanation}</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                applyPendingDiff();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 20px',
                minHeight: '38px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                border: '1px solid var(--color-ink)',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                lineHeight: 1,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            >
              Apply change
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                discardPendingDiff();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 20px',
                minHeight: '38px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ink)',
                fontSize: 'var(--text-caption)',
                fontWeight: 500,
                lineHeight: 1,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            >
              Discard
            </button>
          </div>
        </div>
      ) : (
        /* Normal Stop Card Content */
        <>
          {/* Header row: time badge & category */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {stopIndex + 1}
              </span>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-buttons)',
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                }}
              >
                {stop.startTime} • {stop.timeSlot}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {stop.estimatedCostUSD !== undefined && (
                stop.estimatedCostUSD > 0 ? (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                      background: 'var(--color-paper)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-buttons)',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    {formatDualPrice(stop.estimatedCostUSD, tripLocation).dual}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--color-steel)',
                    }}
                  >
                    Free entry
                  </span>
                )
              )}
              <span
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-ink)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {stop.category}
              </span>
            </div>
          </div>

          {/* Title and Neighborhood */}
          <div>
            <h3
              style={{
                fontSize: 'var(--text-subheading)',
                fontWeight: 700,
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {stop.title}
            </h3>
            {stop.neighborhood && (
              <div
                style={{
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-steel)',
                  marginTop: '2px',
                }}
              >
                {stop.neighborhood}
              </div>
            )}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              margin: 0,
              maxWidth: '480px',
              lineHeight: 1.5,
            }}
          >
            {stop.description}
          </p>

          {/* Timing Annotation Note */}
          {stop.timingAnnotation && (
            <div
              style={{
                fontSize: 'var(--text-caption)',
                fontStyle: 'italic',
                color: 'var(--color-steel)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={13} style={{ flexShrink: 0, color: 'var(--color-steel)' }} strokeWidth={2} />
              <span>{stop.timingAnnotation}</span>
            </div>
          )}

          {/* Integrated Food Spot */}
          {stop.foodSpot && (
            <div
              style={{
                background: 'var(--color-paper)',
                borderRadius: 'var(--radius-small)',
                padding: '10px 14px',
                border: '1px solid #e2e2e2',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UtensilsCrossed size={13} style={{ flexShrink: 0, color: 'var(--color-ink)' }} />
                <span>{stop.foodSpot.name} — Try the {stop.foodSpot.dishToTry}</span>
              </div>
              {stop.foodSpot.vibe && (
                <div style={{ fontSize: '13px', color: 'var(--color-steel)', paddingLeft: '19px' }}>
                  {stop.foodSpot.vibe}
                </div>
              )}
            </div>
          )}

          {/* Overnight Stay (Evening stops) */}
          {stop.overnightStay && (
            <div
              style={{
                background: 'var(--color-paper)',
                borderRadius: 'var(--radius-small)',
                padding: '10px 14px',
                border: '1px solid #e2e2e2',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <BedDouble size={13} style={{ flexShrink: 0, color: 'var(--color-ink)' }} />
                <span>
                  Stay nearby: {stop.overnightStay.name}{' '}
                  {(() => {
                    const stayPrice = convertPriceRangeString(stop.overnightStay.priceRangeUSD, tripLocation);
                    return (
                      <>
                        <strong style={{ fontWeight: 600 }}>({stayPrice.inr})</strong>
                        {stayPrice.local && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '11px',
                              color: 'var(--color-steel)',
                              background: 'var(--color-faint-ash)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-buttons)',
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            {stayPrice.local}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </span>
              </div>
              {stop.overnightStay.vibe && (
                <div style={{ fontSize: '13px', color: 'var(--color-steel)', paddingLeft: '19px' }}>
                  {stop.overnightStay.vibe}
                </div>
              )}
            </div>
          )}

          {/* Action Link: Change this plan */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStop(stop);
              }}
              className="change-btn"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'inherit',
              }}
            >
              Change this plan →
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
