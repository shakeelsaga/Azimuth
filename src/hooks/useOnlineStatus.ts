'use client';

import { useEffect } from 'react';
import { useTripStore } from '@/store/useTripStore';

export function useOnlineStatus() {
  const setOnlineStatus = useTripStore((s) => s.setOnlineStatus);
  const showToast = useTripStore((s) => s.showToast);

  useEffect(() => {
    function goOnline() {
      setOnlineStatus(true);
    }

    function goOffline() {
      setOnlineStatus(false);
      showToast("You're offline. Saved trips still work.", 'info');
    }

    setOnlineStatus(navigator.onLine);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [setOnlineStatus, showToast]);
}
