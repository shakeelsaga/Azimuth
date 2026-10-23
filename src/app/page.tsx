'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import { useTripStore } from '@/store/useTripStore';
import { decodeTripFromURL } from '@/lib/share';
import { HeroIntake } from '@/components/intake/HeroIntake';
import { FollowUpQuestions } from '@/components/intake/FollowUpQuestions';
import { TopNavBar } from '@/components/itinerary/TopNavBar';
import { DaySelector } from '@/components/itinerary/DaySelector';
import { DaySection } from '@/components/itinerary/DaySection';
import { QuickTweakDock } from '@/components/itinerary/QuickTweakDock';
import { ChangeStopModal } from '@/components/itinerary/ChangeStopModal';
import { PackingBudgetSheet } from '@/components/itinerary/PackingBudgetSheet';
import { SavedTripsPanel } from '@/components/itinerary/SavedTripsPanel';
import { SosEmergencyModal } from '@/components/itinerary/SosEmergencyModal';
import { PrintView } from '@/components/print/PrintView';
import { UiverseLoader } from '@/components/animations/UiverseLoader';
import type { ActivityStop } from '@/lib/schemas';

// Dynamic import of Map to prevent SSR errors
const TripMap = dynamic(
  () => import('@/components/map/TripMap').then((mod) => mod.TripMap),
  { ssr: false },
);

export default function HomePage() {
  const step = useTripStore((s) => s.step);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const activeDayNumber = useTripStore((s) => s.activeDayNumber);
  const setActiveDayNumber = useTripStore((s) => s.setActiveDayNumber);
  const weatherData = useTripStore((s) => s.weatherData);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const showToast = useTripStore((s) => s.showToast);

  const [stopToChange, setStopToChange] = useState<ActivityStop | null>(null);
  const [isPackingBudgetOpen, setIsPackingBudgetOpen] = useState(false);
  const [isSavedTripsOpen, setIsSavedTripsOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);

  // Check URL for shared trip parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tripParam = params.get('trip');

    if (tripParam) {
      try {
        const decoded = decodeTripFromURL(tripParam);
        if (decoded) {
          setActiveTrip(decoded);
          showToast(`Loaded shared trip: ${decoded.destination}`, 'info');
        } else {
          showToast('This trip link appears invalid. Starting fresh.', 'error');
        }
      } catch {
        showToast('Could not load shared trip.', 'error');
      }
    }
  }, [setActiveTrip, showToast]);

  const currentDay = useMemo(() => {
    if (!activeTrip) return null;
    return (
      activeTrip.days.find((d) => d.dayNumber === activeDayNumber) ||
      activeTrip.days[0]
    );
  }, [activeTrip, activeDayNumber]);

  const weatherForCurrentDay = useMemo(() => {
    if (!weatherData || !currentDay) return undefined;
    return weatherData[currentDay.dayNumber - 1];
  }, [weatherData, currentDay]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)' }}>
      <AnimatePresence mode="wait">
        {/* Step 1: Hero Intake */}
        {step === 'intake' && (
          <motion.div
            key="intake-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HeroIntake />
          </motion.div>
        )}

        {/* Step 2: Follow-up Questions */}
        {step === 'questions' && (
          <motion.div
            key="questions-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <FollowUpQuestions />
          </motion.div>
        )}

        {/* Step 3: Generating Screen */}
        {step === 'generating' && (
          <motion.div
            key="generating-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
          </motion.div>
        )}

        {/* Step 4: Split-Screen Itinerary Workspace */}
        {step === 'workspace' && activeTrip && currentDay && (
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
          >
            {/* Top Navigation */}
            <TopNavBar
              trip={activeTrip}
              weatherData={weatherData}
              onOpenPackingBudget={() => setIsPackingBudgetOpen(true)}
              onOpenSavedTrips={() => setIsSavedTripsOpen(true)}
              onOpenSos={() => setIsSosOpen(true)}
            />

            {/* Split Screen Workspace Container */}
            <div
              className="workspace-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                flex: 1,
                minHeight: 'calc(100vh - 64px)',
              }}
            >
              {/* Left Column: Planner */}
              <main
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(20px, 4vw, 48px)',
                  gap: 'var(--section-gap)',
                  borderRight: '1px solid var(--color-faint-ash)',
                  maxWidth: '800px',
                  width: '100%',
                  margin: '0 auto',
                }}
              >
                {/* Intro summary banner */}
                {activeTrip.friendlyIntro && (
                  <p
                    style={{
                      fontSize: 'var(--text-subheading)',
                      color: 'var(--color-charcoal)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {activeTrip.friendlyIntro}
                  </p>
                )}

                {/* Tonal Day Selector */}
                <DaySelector
                  days={activeTrip.days}
                  activeDayNumber={activeDayNumber}
                  onSelectDay={setActiveDayNumber}
                  weatherData={weatherData}
                />

                {/* Active Day Section */}
                <DaySection
                  day={currentDay}
                  weather={weatherForCurrentDay}
                  onChangeStop={(stop) => setStopToChange(stop)}
                />

                {/* Natural Language Tweak Dock */}
                <QuickTweakDock trip={activeTrip} />
              </main>

              {/* Right Column: Sticky Vector Map */}
              <aside
                style={{
                  position: 'sticky',
                  top: '64px',
                  height: 'calc(100vh - 64px)',
                  background: 'var(--color-faint-ash)',
                }}
              >
                <TripMap trip={activeTrip} activeDay={currentDay} />
              </aside>
            </div>

            {/* Modals and Slide-Over Panels */}
            <ChangeStopModal
              isOpen={Boolean(stopToChange)}
              stop={stopToChange}
              currentDayNumber={activeDayNumber}
              trip={activeTrip}
              onClose={() => setStopToChange(null)}
            />

            <PackingBudgetSheet
              isOpen={isPackingBudgetOpen}
              trip={activeTrip}
              onClose={() => setIsPackingBudgetOpen(false)}
            />

            <SavedTripsPanel
              isOpen={isSavedTripsOpen}
              onClose={() => setIsSavedTripsOpen(false)}
            />

            <SosEmergencyModal
              isOpen={isSosOpen}
              trip={activeTrip}
              onClose={() => setIsSosOpen(false)}
            />

            {/* Print View (Visible only in print media) */}
            <PrintView trip={activeTrip} />

            <style>{`
              @media (max-width: 1023px) {
                .workspace-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
