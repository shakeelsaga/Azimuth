'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTripStore } from '@/store/useTripStore';

export function Toast() {
  const toastMessage = useTripStore((s) => s.toastMessage);
  const clearToast = useTripStore((s) => s.clearToast);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={clearToast}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 'var(--z-toast)' as unknown as number,
            padding: '12px 24px',
            borderRadius: 'var(--radius-cards)',
            background: toastMessage.type === 'error' ? '#1a1a1a' : 'var(--color-ink)',
            color: 'var(--color-paper)',
            fontSize: 'var(--text-caption)',
            fontWeight: 400,
            maxWidth: '90vw',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {toastMessage.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
