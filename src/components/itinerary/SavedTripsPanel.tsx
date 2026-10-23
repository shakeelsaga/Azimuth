'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTripStore } from '@/store/useTripStore';

interface SavedTripsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedTripsPanel({ isOpen, onClose }: SavedTripsPanelProps) {
  const savedTrips = useTripStore((s) => s.savedTrips);
  const loadSavedTrip = useTripStore((s) => s.loadSavedTrip);
  const deleteSavedTrip = useTripStore((s) => s.deleteSavedTrip);
  const resetToIntake = useTripStore((s) => s.resetToIntake);
  const showToast = useTripStore((s) => s.showToast);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saved Trips"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-overlay)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        />

        {/* Panel Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            height: '100%',
            background: 'var(--color-paper)',
            borderLeft: '1px solid var(--color-ink)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 'clamp(24px, 4vw, 40px)',
            gap: '28px',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 'var(--text-caption)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--color-steel)' }}>
                Your Library
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--color-ink)' }}>
                Saved Trips
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                lineHeight: 1,
                cursor: 'pointer',
                color: 'var(--color-ink)',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          {/* List or Empty State */}
          {savedTrips.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                height: '50vh',
                gap: '16px',
              }}
            >
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-steel)', margin: 0, maxWidth: '280px', lineHeight: 1.5 }}>
                No saved trips yet. Plan your first adventure and it&apos;ll show up here.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetToIntake();
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-buttons)',
                  background: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Start planning →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {savedTrips.map((item) => {
                const dateStr = new Date(item.savedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--color-faint-ash)',
                      borderRadius: 'var(--radius-cards)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: 'var(--text-subheading)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {item.trip.destination}, {item.trip.country}
                      </h4>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)', marginTop: '2px' }}>
                        {item.trip.daysCount} {item.trip.daysCount === 1 ? 'day' : 'days'} • Saved on {dateStr}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          loadSavedTrip(item.id);
                          onClose();
                          showToast(`Loaded ${item.trip.destination} itinerary.`, 'info');
                        }}
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
                        Open trip →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteSavedTrip(item.id);
                          showToast('Trip deleted.', 'info');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: 'var(--text-caption)',
                          color: 'var(--color-steel)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontFamily: 'inherit',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
