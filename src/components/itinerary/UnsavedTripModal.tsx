'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, ShieldAlert, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type UnsavedModalTrigger = 'save' | 'sos' | 'home';

interface UnsavedTripModalProps {
  isOpen: boolean;
  trigger: UnsavedModalTrigger;
  destination: string;
  onClose: () => void;
  onDiscardAndHome?: () => void;
}

export function UnsavedTripModal({
  isOpen,
  trigger,
  destination,
  onClose,
  onDiscardAndHome,
}: UnsavedTripModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleProceedToLogin = () => {
    onClose();
    router.push(`/login?callbackUrl=/&action=${trigger}`);
  };

  const getModalConfig = () => {
    switch (trigger) {
      case 'save':
        return {
          icon: <Bookmark size={24} style={{ color: 'var(--color-ink)' }} />,
          title: 'Save to your account',
          description: `Log in or create a free account to save your ${destination} itinerary to your personal library so you never lose your plans.`,
          primaryLabel: 'Log In / Sign Up to Save',
          showDiscard: false,
        };
      case 'sos':
        return {
          icon: <ShieldAlert size={24} style={{ color: '#b91c1c' }} />,
          title: 'Emergency SOS requires an account',
          description: `SOS dispatch transmits verified GPS coordinates and emergency alerts to your designated trusted contacts. Log in or create an account to enable travel protection.`,
          primaryLabel: 'Log In to Activate SOS',
          showDiscard: false,
        };
      case 'home':
      default:
        return {
          icon: <AlertTriangle size={24} style={{ color: '#d97706' }} />,
          title: 'Leave without saving?',
          description: `Your ${destination} trip has not been saved. If you return to the home screen without saving to an account, this generated itinerary will be lost.`,
          primaryLabel: 'Save Trip & Log In',
          showDiscard: true,
        };
    }
  };

  const config = getModalConfig();

  return (
    <AnimatePresence>
      <div
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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            background: 'var(--color-paper)',
            borderRadius: 'var(--radius-cards)',
            boxShadow: 'var(--shadow-overlay)',
            padding: 'clamp(24px, 4vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 1,
          }}
        >
          {/* Top header with close icon */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--color-faint-ash)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {config.icon}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-steel)',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-ink)',
                margin: '0 0 8px 0',
                letterSpacing: '-0.01em',
              }}
            >
              {config.title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'var(--color-charcoal)',
                margin: 0,
              }}
            >
              {config.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleProceedToLogin}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 'var(--radius-buttons)',
                border: 'none',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background var(--transition-fast), transform var(--transition-fast)',
              }}
              className="unsaved-modal-primary"
            >
              <span>{config.primaryLabel}</span>
              <ArrowRight size={15} />
            </button>

            {config.showDiscard && onDiscardAndHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDiscardAndHome();
                }}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: 'var(--radius-buttons)',
                  border: '1px solid #d4d4d4',
                  background: 'transparent',
                  color: '#b91c1c',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                className="unsaved-modal-discard"
              >
                Discard & Return Home
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px 20px',
                borderRadius: 'var(--radius-buttons)',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-steel)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Keep Planning
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        .unsaved-modal-primary:hover {
          background: #222222 !important;
          transform: translateY(-1px);
        }
        .unsaved-modal-discard:hover {
          background: #fef2f2 !important;
          border-color: #fca5a5 !important;
        }
      `}</style>
    </AnimatePresence>
  );
}
