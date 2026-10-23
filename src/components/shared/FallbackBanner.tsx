'use client';

import { useTripStore } from '@/store/useTripStore';

interface FallbackBannerProps {
  message?: string;
}

export function FallbackBanner({ message }: FallbackBannerProps) {
  const loadDemoTrip = useTripStore((s) => s.loadDemoTrip);

  return (
    <div style={{
      background: 'var(--color-faint-ash)',
      padding: '16px 24px',
      borderRadius: 'var(--radius-cards)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 'var(--text-body-sm)',
        margin: 0,
        color: 'var(--color-ink)',
      }}>
        {message ?? 'Running in demo mode — AI features need an API key.'}
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => loadDemoTrip('kyoto')}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-buttons)',
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            border: 'none',
            fontSize: 'var(--text-caption)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Kyoto • 3 Days
        </button>
        <button
          onClick={() => loadDemoTrip('eastjava')}
          style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-buttons)',
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-ink)',
            fontSize: 'var(--text-caption)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          East Java & Bali • 4 Days
        </button>
      </div>
    </div>
  );
}
