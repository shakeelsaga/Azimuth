'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import type { TripPlan } from '@/lib/schemas';
import { useTripStore } from '@/store/useTripStore';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

interface SosEmergencyModalProps {
  isOpen: boolean;
  trip: TripPlan;
  onClose: () => void;
}

export function SosEmergencyModal({ isOpen, trip, onClose }: SosEmergencyModalProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSendingSos, setIsSendingSos] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const showToast = useTripStore((s) => s.showToast);

  useEffect(() => {
    if (isOpen) {
      setContactsError(null);
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setIsGettingLocation(false);
          },
          () => {
            // Fallback to trip center coordinates
            setCoords(trip.centerCoordinates);
            setIsGettingLocation(false);
          },
          { timeout: 5000 },
        );
      } else {
        setCoords(trip.centerCoordinates);
      }
    }
  }, [isOpen, trip]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentLat = coords?.lat ?? trip.centerCoordinates.lat;
  const currentLng = coords?.lng ?? trip.centerCoordinates.lng;

  const handleCopyLocation = async () => {
    const text = `EMERGENCY: I am currently in ${trip.destination}, ${trip.country}. Coordinates: https://maps.google.com/?q=${currentLat},${currentLng}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        showToast('Emergency location message copied to clipboard!', 'info');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (success) {
          showToast('Emergency location message copied to clipboard!', 'info');
          return;
        }
      } catch {
        // Fallback failure
      }
      showToast(`Emergency coordinates: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`, 'info');
    }
  };

  const handleSendSosBroadcast = async () => {
    setIsSendingSos(true);
    setContactsError(null);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: currentLat,
          longitude: currentLng,
          recentActivity: `Emergency alert from Azimuth travel planner in ${trip.destination}.`,
        }),
      });

      if (res.ok) {
        showToast('Emergency alert dispatched to your contacts.', 'info');
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.error === 'contacts_required') {
          setContactsError('No emergency contacts found. Please add trusted contacts in your Profile & Security page before sending SOS broadcasts.');
          showToast('No emergency contacts configured.', 'error');
        } else if (res.status === 401) {
          setContactsError('Please sign in to dispatch automated server emergency broadcasts to your contacts.');
          showToast('Sign in required for SOS broadcast.', 'error');
        } else {
          showToast(data.message || 'Dispatch failed. You can copy your emergency GPS link below.', 'error');
        }
      }
    } catch {
      showToast('Network issue. You can copy your emergency GPS link below.', 'error');
    } finally {
      setIsSendingSos(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Emergency SOS"
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            background: 'var(--color-paper)',
            borderRadius: 'var(--radius-cards)',
            border: '2px solid var(--color-ink)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--color-ink)', color: 'var(--color-paper)', borderRadius: 'var(--radius-buttons)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Emergency Assistance
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--color-ink)' }}>
                {trip.destination} Safety & SOS
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-steel)' }}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.45 }}>
            In an urgent emergency, broadcast your real-time coordinates or copy a verified GPS location link to send to trusted contacts.
          </p>

          {/* Coordinates box */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--color-faint-ash)',
              borderRadius: 'var(--radius-small)',
              fontSize: 'var(--text-caption)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-steel)' }}>Active GPS: </span>
              <strong>{isGettingLocation ? 'Acquiring...' : `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}</strong>
            </div>
            <button
              type="button"
              onClick={handleCopyLocation}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-ink)',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
              }}
            >
              Copy Link
            </button>
          </div>

          {/* Error Banner when contacts or auth are missing */}
          {contactsError && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-small)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>
                <AlertTriangle size={16} />
                <span>Contacts Configuration Needed</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: 1.45 }}>
                {contactsError}
              </p>
              <Link
                href="/profile"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#b91c1c',
                  textDecoration: 'underline',
                  marginTop: '4px',
                }}
              >
                <span>Open Profile & SOS Settings</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSendSosBroadcast}
              disabled={isSendingSos}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                border: '1px solid var(--color-ink)',
                fontSize: 'var(--text-subheading)',
                fontWeight: 700,
                cursor: isSendingSos ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span>{isSendingSos ? 'Dispatching...' : 'Dispatch SOS Broadcast'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLocation}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-ink)',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Copy Emergency GPS Link
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
