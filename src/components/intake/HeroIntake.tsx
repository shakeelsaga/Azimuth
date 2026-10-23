'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { BlurText } from '@/components/animations/BlurText';
import { useTripStore } from '@/store/useTripStore';
import type { CityResult, StructuralParams } from '@/lib/schemas';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserProfileMenu } from '@/components/auth/UserProfileMenu';

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const COMPANIONS: { value: StructuralParams['travelCompanions']; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family_with_kids', label: 'Family with kids' },
  { value: 'group_of_friends', label: 'Group of friends' },
];

const PURPOSES: { value: StructuralParams['tripPurpose']; label: string }[] = [
  { value: 'leisure', label: 'Leisure & relaxation' },
  { value: 'cultural', label: 'Cultural exploration' },
  { value: 'adventure', label: 'Adventure & outdoors' },
  { value: 'food_and_nightlife', label: 'Food & nightlife' },
];

const BUDGETS: { value: StructuralParams['budgetPreference']; label: string }[] = [
  { value: 'budget', label: 'Budget-friendly' },
  { value: 'mid_range', label: 'Mid-range' },
  { value: 'spare_no_expense', label: 'Spare no expense' },
];

export function HeroIntake() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const setDestination = useTripStore((s) => s.setDestination);
  const setStructuralParams = useTripStore((s) => s.setStructuralParams);
  const setFollowUpQuestions = useTripStore((s) => s.setFollowUpQuestions);
  const setStep = useTripStore((s) => s.setStep);
  const loadDemoTrip = useTripStore((s) => s.loadDemoTrip);

  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [daysCount, setDaysCount] = useState<number | null>(null);
  const [companions, setCompanions] = useState<StructuralParams['travelCompanions'] | null>(null);
  const [purpose, setPurpose] = useState<StructuralParams['tripPurpose'] | null>(null);
  const [budget, setBudget] = useState<StructuralParams['budgetPreference'] | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isReady = selectedCity && daysCount && companions && purpose && budget;

  // Debounced city search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedCity(null);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setCities([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value.trim())}&count=5&language=en&format=json`,
          { signal: AbortSignal.timeout(3500) },
        );
        const data = await response.json();
        const results: CityResult[] = (data.results ?? []).slice(0, 5).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => ({
            name: r.name,
            country: r.country,
            countryCode: r.country_code,
            lat: r.latitude,
            lng: r.longitude,
            timezone: r.timezone,
          }),
        );
        setCities(results);
        setNoResults(results.length === 0);
        setShowDropdown(true);
      } catch {
        setCities([]);
        setNoResults(true);
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleCitySelect = useCallback((city: CityResult) => {
    setSelectedCity(city);
    setSearchQuery(`${city.name}, ${city.country}`);
    setShowDropdown(false);
    setCities([]);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleStartPlanning = useCallback(() => {
    if (!selectedCity || !daysCount || !companions || !purpose || !budget) return;

    setDestination({
      name: selectedCity.name,
      country: selectedCity.country,
      lat: selectedCity.lat,
      lng: selectedCity.lng,
      daysCount,
    });
    setStructuralParams({
      travelCompanions: companions,
      tripPurpose: purpose,
      budgetPreference: budget,
    });
    // Reset previous questions so questions screen always loads fresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFollowUpQuestions(null as any);
    setStep('questions');
  }, [selectedCity, daysCount, companions, purpose, budget, setDestination, setStructuralParams, setFollowUpQuestions, setStep]);

  const pillStyle = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '13px 26px',
    minHeight: '48px',
    borderRadius: 'var(--radius-buttons)',
    background: active ? 'var(--color-ink)' : 'var(--color-faint-ash)',
    color: active ? 'var(--color-paper)' : 'var(--color-ink)',
    border: active ? '1px solid var(--color-ink)' : '1px solid transparent',
    fontSize: '16px',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1,
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflowX: 'clip',
    }}>
      {/* Peeking Corner Logo Card - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: -30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ x: 8, y: 8 }}
        style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '210px',
          height: '210px',
          borderRadius: 'var(--radius-cards)',
          border: '1px solid var(--color-ink)',
          background: 'transparent',
          zIndex: 40,
          cursor: 'pointer',
          boxShadow: 'none',
          overflow: 'hidden',
        }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Azimuth"
      >
        <Image
          src="/assets/Azimuth_Logo.png"
          alt="Azimuth logo"
          fill
          sizes="210px"
          style={{ objectFit: 'cover' }}
          priority
        />
      </motion.div>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(24px, 4vw, 56px)',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
      }}>

      {/* Top Right User Profile / Auth Nav */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(16px, 2.5vw, 28px)',
          right: 'clamp(24px, 4vw, 56px)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <UserProfileMenu />
      </div>

      {/* Monumental Wordmark */}
      <div style={{ marginTop: 'clamp(48px, 12vh, 120px)' }}>
        <BlurText
          text="AZIMUTH™"
          className=""
          as="h1"
          delay={0.1}
        />
        <style>{`
          h1 {
            font-size: clamp(72px, 14vw, 211px) !important;
            font-weight: 700 !important;
            letter-spacing: -0.057em !important;
            line-height: 1 !important;
            color: var(--color-ink) !important;
            margin: 0 !important;
          }
        `}</style>
      </div>

      {/* Floating Showcase Card - Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 'clamp(60px, 10vh, 130px)',
          right: 'clamp(24px, 4vw, 56px)',
          borderRadius: 'var(--radius-cards)',
          padding: '24px',
          background: 'var(--color-showcase)',
          cursor: 'pointer',
          maxWidth: '240px',
        }}
        className="showcase-card"
        onClick={() => loadDemoTrip('kyoto')}
      >
        <div style={{
          fontSize: 'clamp(28px, 3.5vw, 43px)',
          fontWeight: 700,
          letterSpacing: '-0.010em',
          lineHeight: 1.21,
          color: 'var(--color-ink)',
        }}>
          Kyoto 72h
        </div>
        <div style={{
          fontSize: 'var(--text-body-sm)',
          fontWeight: 400,
          color: 'var(--color-ink)',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>Click to preview instant itinerary</span>
          <span
            className="showcase-arrow"
            style={{
              display: 'inline-block',
              transition: 'transform var(--transition-fast)',
            }}
          >
            →
          </span>
        </div>
      </motion.div>

      {/* Intake Controls */}
      <div style={{
        marginTop: 'var(--section-gap)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}>
        {/* Row 1: Destination Search */}
        <div>
          <label style={{
            fontSize: 'var(--text-subheading)',
            fontWeight: 400,
            display: 'block',
            marginBottom: '12px',
          }}>
            Where are you heading?
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => cities.length > 0 && setShowDropdown(true)}
              placeholder="Search a city..."
              style={{
                width: '100%',
                height: '54px',
                padding: '0 20px',
                borderRadius: 'var(--radius-cards)',
                border: '1px solid var(--color-ink)',
                fontSize: '16px',
                fontFamily: 'inherit',
                outline: 'none',
                background: 'var(--color-paper)',
              }}
            />
            {isSearching && (
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                gap: '3px',
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-steel)',
                      animation: `loader-dots 1.4s ${i * 0.16}s ease-in-out infinite both`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: '58px',
                  left: 0,
                  right: 0,
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-ink)',
                  borderRadius: 'var(--radius-cards)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {noResults ? (
                  <div style={{
                    padding: '16px',
                    fontSize: 'var(--text-caption)',
                    color: 'var(--color-steel)',
                  }}>
                    No cities found for &lsquo;{searchQuery}&rsquo;. Try a different spelling?
                  </div>
                ) : (
                  cities.map((city, i) => (
                    <button
                      key={`${city.name}-${city.lat}-${i}`}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="city-dropdown-item"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 20px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        borderBottom: i < cities.length - 1 ? '1px solid var(--color-faint-ash)' : 'none',
                      }}
                    >
                      {city.name}, {city.country}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Day Count */}
        <div>
          <label style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-ink)',
            display: 'block',
            marginBottom: '10px',
          }}>
            How many days?
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysCount(d)}
                className={`day-tile ${daysCount === d ? 'active' : ''}`}
                style={{
                  ...pillStyle(daysCount === d),
                  width: '52px',
                  height: '52px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  fontWeight: 600,
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Structural Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Companions */}
          <div>
            <label style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              display: 'block',
              marginBottom: '10px',
            }}>
              Who&apos;s going?
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {COMPANIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCompanions(c.value)}
                  className={`intake-pill ${companions === c.value ? 'active' : ''}`}
                  style={pillStyle(companions === c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              display: 'block',
              marginBottom: '10px',
            }}>
              What kind of trip?
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {PURPOSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPurpose(p.value)}
                  className={`intake-pill ${purpose === p.value ? 'active' : ''}`}
                  style={pillStyle(purpose === p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--color-ink)',
              display: 'block',
              marginBottom: '10px',
            }}>
              Budget range
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {BUDGETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBudget(b.value)}
                  className={`intake-pill ${budget === b.value ? 'active' : ''}`}
                  style={pillStyle(budget === b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: CTA */}
        <div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={handleStartPlanning}
              disabled={!isReady}
              className="start-planning-btn"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 0 12px 0',
                fontSize: 'clamp(22px, 2.8vw, 28px)',
                fontWeight: 600,
                color: isReady ? 'var(--color-ink)' : 'var(--color-steel)',
                cursor: isReady ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'color var(--transition-medium)',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Start planning</span>
              <span
                className="cta-arrow"
                style={{
                  display: 'inline-block',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                →
              </span>

              {/* Animated underline sweeps from left to right when isReady becomes true */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isReady ? 1 : 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: 0,
                  right: 0,
                  height: '2.5px',
                  background: 'var(--color-ink)',
                  transformOrigin: 'left',
                  pointerEvents: 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Sample Trip Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--color-steel)',
          }}>
            Or try a sample trip:
          </span>
          <button
            type="button"
            onClick={() => loadDemoTrip('kyoto')}
            className="sample-trip-btn"
            style={pillStyle(false)}
          >
            Kyoto • 3 Days
          </button>
          <button
            type="button"
            onClick={() => loadDemoTrip('eastjava')}
            className="sample-trip-btn"
            style={pillStyle(false)}
          >
            East Java & Bali • 4 Days
          </button>
        </div>

        {/* Bottom Login / Signup Callout Section - hidden when logged in */}
        {!isAuthenticated && status !== 'loading' && (
          <div
            style={{
              marginTop: 'clamp(48px, 8vh, 80px)',
              marginBottom: '40px',
              padding: 'clamp(24px, 3.5vw, 36px)',
              borderRadius: 'var(--radius-cards)',
              background: 'var(--color-faint-ash)',
              border: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ maxWidth: '520px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-steel)',
                    marginBottom: '8px',
                  }}
                >
                  Account & Cloud Sync
                </div>
                <h3
                  style={{
                    fontSize: 'clamp(20px, 2.5vw, 24px)',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Keep your bespoke journeys alive.
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.55,
                    color: 'var(--color-charcoal)',
                    margin: 0,
                  }}
                >
                  Log in or create a free account to save itineraries, sync across devices, and configure emergency SOS contacts for calm, protected travels.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  href="/login?mode=signup"
                  style={{
                    padding: '11px 20px',
                    borderRadius: 'var(--radius-buttons)',
                    background: 'var(--color-ink)',
                    color: 'var(--color-paper)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background var(--transition-fast), transform var(--transition-fast)',
                  }}
                  className="bottom-signup-btn"
                >
                  <span>Create Account</span>
                  <span className="arrow-glyph">→</span>
                </Link>
                <Link
                  href="/login?mode=signin"
                  style={{
                    padding: '11px 18px',
                    borderRadius: 'var(--radius-buttons)',
                    background: 'var(--color-paper)',
                    border: '1px solid #d4d4d4',
                    color: 'var(--color-ink)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                  }}
                  className="bottom-signin-btn"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close inner centered content container */}
      </div>

      {/* Global & Component Styles */}
      <style>{`
        .showcase-card {
          display: block;
        }
        .showcase-card:hover .showcase-arrow {
          transform: translateX(6px);
        }
        @media (max-width: 768px) {
          .showcase-card {
            display: none !important;
          }
        }

        /* Hover effects on interactive buttons */
        .intake-pill {
          transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast) !important;
        }
        .intake-pill:not(.active):hover {
          background: #e2e2e2 !important;
          border-color: #bbbbbb !important;
          transform: translateY(-2px);
        }
        .intake-pill.active:hover {
          background: #222222 !important;
          transform: translateY(-2px);
        }

        .day-tile {
          transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast) !important;
        }
        .day-tile:not(.active):hover {
          background: #e2e2e2 !important;
          border-color: #bbbbbb !important;
          transform: translateY(-2px);
        }
        .day-tile.active:hover {
          background: #222222 !important;
          transform: translateY(-2px);
        }

        .sample-trip-btn {
          transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast) !important;
        }
        .sample-trip-btn:hover {
          background: #e2e2e2 !important;
          border-color: var(--color-ink) !important;
          transform: translateY(-2px);
        }

        .city-dropdown-item {
          transition: background var(--transition-fast), padding-left var(--transition-fast) !important;
        }
        .city-dropdown-item:hover {
          background: var(--color-faint-ash) !important;
          padding-left: 24px !important;
        }

        .start-planning-btn {
          transition: color var(--transition-fast);
        }
        .start-planning-btn:not(:disabled):hover .cta-arrow {
          transform: translateX(6px);
        }

        .bottom-signup-btn:hover {
          background: #222222 !important;
          transform: translateY(-1px);
        }
        .bottom-signup-btn:hover .arrow-glyph {
          transform: translateX(4px);
        }
        .bottom-signin-btn:hover {
          border-color: var(--color-ink) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
