'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActivityStop, TripPlan } from '@/lib/schemas';
import { findBestTargetDayForRelocation, findNextAvailableSlot } from '@/lib/geo';
import { useTripStore } from '@/store/useTripStore';

interface ChangeStopModalProps {
  isOpen: boolean;
  stop: ActivityStop | null;
  currentDayNumber: number;
  trip: TripPlan;
  onClose: () => void;
}

const PRESET_REASONS = [
  'Too tired, want something chill',
  'Weather looks bad, need an indoor spot',
  'Looking for a cheaper option',
  'Short on time',
];

export function ChangeStopModal({
  isOpen,
  stop,
  currentDayNumber,
  trip,
  onClose,
}: ChangeStopModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const setPendingDiff = useTripStore((s) => s.setPendingDiff);
  const setLoadingSwapStopId = useTripStore((s) => s.setLoadingSwapStopId);
  const showToast = useTripStore((s) => s.showToast);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedReason('');
      setCustomReason('');
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen, step]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute recommendation for relocation
  const relocationPlan = useMemo(() => {
    if (!stop) return null;

    if (trip.daysCount === 1) {
      const currentDay = trip.days.find((d) => d.dayNumber === currentDayNumber);
      if (!currentDay) return null;
      const nextSlot = findNextAvailableSlot(stop.timeSlot, currentDay.stops);
      return {
        isSingleDay: true,
        canMove: nextSlot !== null,
        targetDayNumber: 1,
        targetTimeSlot: nextSlot,
      };
    }

    const targetDay = findBestTargetDayForRelocation(stop, currentDayNumber, trip.days);
    const fallbackDay = currentDayNumber < trip.daysCount ? currentDayNumber + 1 : 1;
    const finalDay = targetDay ?? fallbackDay;

    return {
      isSingleDay: false,
      canMove: true,
      targetDayNumber: finalDay,
      targetTimeSlot: stop.timeSlot,
    };
  }, [stop, currentDayNumber, trip]);

  if (!isOpen || !stop) return null;

  const activeReason = customReason.trim() || selectedReason;

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason);
    setCustomReason('');
    setStep(2);
  };

  const handleCustomReasonSubmit = () => {
    if (!customReason.trim()) return;
    setSelectedReason(customReason.trim());
    setStep(2);
  };

  const handleConfirmDisposition = async (disposition: 'skip' | 'move') => {
    const reasonToSend = activeReason || 'Looking for an alternative';
    onClose();

    setLoadingSwapStopId(stop.id);

    try {
      const res = await fetch('/api/trip/swap-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripContext: {
            destination: trip.destination,
            country: trip.country,
            daysCount: trip.daysCount,
            structuralParams: {
              travelCompanions: 'couple',
              tripPurpose: 'cultural',
              budgetPreference: 'mid_range',
            },
            days: trip.days,
          },
          currentDayNumber,
          stopToChange: {
            id: stop.id,
            title: stop.title,
            timeSlot: stop.timeSlot,
            category: stop.category,
          },
          reason: reasonToSend,
          disposition,
          recommendedTargetDayNumber: relocationPlan?.targetDayNumber,
          recommendedTargetTimeSlot: relocationPlan?.targetTimeSlot || undefined,
        }),
      });

      if (!res.ok) {
        showToast("Couldn't find a replacement stop. Try a different reason.", 'error');
        setLoadingSwapStopId(null);
        return;
      }

      const diffResponse = await res.json();
      setPendingDiff({
        dayNumber: currentDayNumber,
        stopId: stop.id,
        diffResponse,
      });
      showToast('Proposed replacement ready to review.', 'info');
    } catch {
      showToast('Network error finding replacement.', 'error');
    } finally {
      setLoadingSwapStopId(null);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-modal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Backdrop with 4px blur - only permitted blur per spec */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            background: 'var(--color-paper)',
            borderRadius: 'var(--radius-cards)',
            padding: '32px',
            border: '1px solid var(--color-ink)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)', marginBottom: '4px' }}>
                Day {currentDayNumber} • {stop.timeSlot} • {stop.title}
              </div>
              <h2
                id="modal-title"
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--color-ink)',
                  lineHeight: 1.25,
                }}
              >
                {step === 1 ? 'Why change this?' : `What should we do with ${stop.title}?`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                lineHeight: 1,
                cursor: 'pointer',
                color: 'var(--color-steel)',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          {/* Step 1: Reason Selection */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRESET_REASONS.map((reason, index) => (
                  <button
                    key={`preset-reason-${index}`}
                    ref={index === 0 ? firstButtonRef : undefined}
                    type="button"
                    onClick={() => handleSelectReason(reason)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      minHeight: '44px',
                      borderRadius: 'var(--radius-buttons)',
                      background: 'var(--color-faint-ash)',
                      border: '1px solid transparent',
                      color: 'var(--color-ink)',
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: 500,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      lineHeight: 1.25,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background var(--transition-fast)',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e2e2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-faint-ash)';
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {/* Custom reason input */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomReasonSubmit()}
                  placeholder="Or type a custom reason..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-cards)',
                    border: '1px solid var(--color-ink)',
                    fontSize: 'var(--text-caption)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: 'var(--color-paper)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCustomReasonSubmit}
                  disabled={!customReason.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 20px',
                    minHeight: '40px',
                    borderRadius: 'var(--radius-buttons)',
                    background: customReason.trim() ? 'var(--color-ink)' : 'var(--color-faint-ash)',
                    color: customReason.trim() ? 'var(--color-paper)' : 'var(--color-steel)',
                    border: 'none',
                    fontSize: 'var(--text-caption)',
                    fontWeight: 600,
                    lineHeight: 1,
                    cursor: customReason.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>Next</span>{' '}
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Disposition Selection (Skip vs. Move) */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)' }}>
                Reason: &ldquo;{activeReason}&rdquo;
              </div>

              {/* Option A: Skip completely */}
              <button
                ref={firstButtonRef}
                type="button"
                onClick={() => handleConfirmDisposition('skip')}
                style={{
                  width: '100%',
                  padding: '14px 22px',
                  borderRadius: 'var(--radius-buttons)',
                  background: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  boxSizing: 'border-box',
                }}
              >
                <div>Skip it completely</div>
                <div style={{ fontSize: '13px', color: '#cccccc', fontWeight: 400 }}>
                  Remove from this trip and replace with a fresh spot for {stop.timeSlot}
                </div>
              </button>

              {/* Option B: Move to another day (or later today) */}
              {relocationPlan && relocationPlan.canMove && (
                <button
                  type="button"
                  onClick={() => handleConfirmDisposition('move')}
                  style={{
                    width: '100%',
                    padding: '14px 22px',
                    borderRadius: 'var(--radius-buttons)',
                    background: 'var(--color-paper)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-ink)',
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    {relocationPlan.isSingleDay
                      ? `Move it to later today (${relocationPlan.targetTimeSlot})`
                      : `Move it to Day ${relocationPlan.targetDayNumber} (${relocationPlan.targetTimeSlot || 'Afternoon'})`}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-steel)', fontWeight: 400 }}>
                    Keep this sight, relocate it to the lightest matching schedule, and fill {stop.timeSlot} here
                  </div>
                </button>
              )}

              {/* Back to Step 1 */}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-steel)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >
                ← Change reason
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
