'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AzimuthLogo, AzimuthWordmark } from '@/components/brand/AzimuthLogo';
import { useTripStore } from '@/store/useTripStore';
import { encodeTripToURL } from '@/lib/share';
import type { TripPlan, WeatherDay } from '@/lib/schemas';
import { WeatherIcon } from '@/components/shared/WeatherIcon';
import { Share2, Bookmark, Printer, Briefcase, AlertTriangle, ShieldAlert } from 'lucide-react';
import { UserProfileMenu } from '@/components/auth/UserProfileMenu';
import { UnsavedTripModal, type UnsavedModalTrigger } from '@/components/itinerary/UnsavedTripModal';

interface TopNavBarProps {
  trip: TripPlan;
  weatherData?: WeatherDay[] | null;
  onOpenPackingBudget: () => void;
  onOpenSavedTrips: () => void;
  onOpenSos: () => void;
}

export function TopNavBar({
  trip,
  weatherData,
  onOpenPackingBudget,
  onOpenSavedTrips,
  onOpenSos,
}: TopNavBarProps) {
  const { data: session } = useSession();
  const resetToIntake = useTripStore((s) => s.resetToIntake);
  const saveCurrentTrip = useTripStore((s) => s.saveCurrentTrip);
  const savedTrips = useTripStore((s) => s.savedTrips);
  const showToast = useTripStore((s) => s.showToast);

  const [unsavedModalTrigger, setUnsavedModalTrigger] = useState<UnsavedModalTrigger | null>(null);

  const isSaved = useMemo(() => {
    return savedTrips.some(
      (s) =>
        s.trip.destination === trip.destination &&
        s.trip.daysCount === trip.daysCount &&
        s.trip.days.length === trip.days.length,
    );
  }, [savedTrips, trip]);

  const activeWeather = weatherData?.[0];

  const handleShare = () => {
    try {
      const url = encodeTripToURL(trip);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showToast('Link copied! Anyone with this link can view your trip.', 'info');
      }
    } catch {
      showToast('Could not encode share link.', 'error');
    }
  };

  const handleSave = async () => {
    if (!session?.user) {
      setUnsavedModalTrigger('save');
      return;
    }

    saveCurrentTrip();

    // Persist to database for authenticated account
    try {
      await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${trip.destination} (${trip.daysCount} Days)`,
          destination: trip.destination,
          itinerary: trip,
        }),
      });
      showToast('Trip saved to your account library!', 'info');
    } catch {
      showToast('Trip saved locally to library.', 'info');
    }
  };

  const handleSosClick = () => {
    if (!session?.user) {
      setUnsavedModalTrigger('sos');
      return;
    }
    onOpenSos();
  };

  const handleLogoClick = () => {
    if (!isSaved && !session?.user) {
      setUnsavedModalTrigger('home');
      return;
    }
    resetToIntake();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <>
      <header
        className="top-nav-bar"
        style={{
          height: '64px',
          background: 'var(--color-paper)',
          borderBottom: '1px solid var(--color-faint-ash)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 3vw, 40px)',
        }}
      >
        {/* Left: Brand logo & name */}
        <div
          onClick={handleLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <AzimuthLogo size={28} />
          <AzimuthWordmark size="14px" />
        </div>

      {/* Center (Desktop only): Destination status & weather */}
      <div
        className="nav-center-status"
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontWeight: 600 }}>{trip.destination}, {trip.country}</span>
        <span>•</span>
        {activeWeather ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <WeatherIcon code={activeWeather.weatherCode} size={15} />
            <span>{Math.round(activeWeather.temperatureHighC)}°C {activeWeather.weatherLabel}</span>
          </span>
        ) : (
          <span style={{ color: 'var(--color-steel)' }}>
            {trip.daysCount} {trip.daysCount === 1 ? 'Day' : 'Days'} Itinerary
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)' }}>
        {/* Desktop links */}
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onOpenPackingBudget}
            className="nav-text-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Packing & Budget
          </button>

          <button
            type="button"
            onClick={onOpenSavedTrips}
            className="nav-text-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Saved Trips
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="nav-text-btn share-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Share
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="nav-text-btn save-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Save trip
          </button>

          {!isSaved && (
            <span
              aria-label="Unsaved changes"
              title="Unsaved changes"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-ink)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="nav-text-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-ink)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Print
          </button>

          {/* SOS Emergency button */}
          <button
            type="button"
            onClick={handleSosClick}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-buttons)',
              background: 'var(--color-faint-ash)',
              border: '1px solid var(--color-ink)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={14} strokeWidth={2.2} />
            <span>SOS</span>
          </button>
        </div>

        {/* User Profile / Login Menu */}
        <UserProfileMenu onOpenSavedTrips={onOpenSavedTrips} />

        {/* Mobile icons */}
        <div className="nav-mobile-icons" style={{ display: 'none', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onOpenPackingBudget}
            aria-label="Packing and Budget"
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-ink)' }}
          >
            <Briefcase size={20} />
          </button>
          <button
            type="button"
            onClick={onOpenSavedTrips}
            aria-label="Saved Trips"
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-ink)' }}
          >
            <Bookmark size={20} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share Trip"
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-ink)' }}
          >
            <Share2 size={20} />
          </button>
          <button
            type="button"
            onClick={handleSosClick}
            aria-label="Emergency SOS"
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--color-ink)' }}
          >
            <AlertTriangle size={20} />
          </button>
        </div>
      </div>

      <style>{`
        .nav-text-btn:hover {
          text-decoration: underline;
        }
        @media (max-width: 900px) {
          .nav-center-status {
            display: none !important;
          }
          .nav-desktop-links {
            display: none !important;
          }
          .nav-mobile-icons {
            display: flex !important;
          }
        }
      `}</style>
    </header>

    {/* Unsaved Trip Authentication Guard Modal */}
    {unsavedModalTrigger && (
      <UnsavedTripModal
        isOpen={Boolean(unsavedModalTrigger)}
        trigger={unsavedModalTrigger}
        destination={trip.destination}
        onClose={() => setUnsavedModalTrigger(null)}
        onDiscardAndHome={() => {
          setUnsavedModalTrigger(null);
          resetToIntake();
        }}
      />
    )}
    </>
  );
}
