'use client';

import { useEffect } from 'react';
import { useTripStore } from '@/store/useTripStore';

export function useKeyboardShortcuts() {
  const undoLastChange = useTripStore((s) => s.undoLastChange);
  const step = useTripStore((s) => s.step);
  const activeDayNumber = useTripStore((s) => s.activeDayNumber);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const setActiveDayNumber = useTripStore((s) => s.setActiveDayNumber);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (meta && e.key === 'z') {
        e.preventDefault();
        undoLastChange();
        return;
      }

      if (meta && e.key === 'p') {
        e.preventDefault();
        window.print();
        return;
      }

      if (step === 'workspace' && activeTrip && !isInput) {
        const maxDay = activeTrip.daysCount;
        if (e.key === 'ArrowLeft' && activeDayNumber > 1) {
          e.preventDefault();
          setActiveDayNumber(activeDayNumber - 1);
        } else if (e.key === 'ArrowRight' && activeDayNumber < maxDay) {
          e.preventDefault();
          setActiveDayNumber(activeDayNumber + 1);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastChange, step, activeDayNumber, activeTrip, setActiveDayNumber]);
}
