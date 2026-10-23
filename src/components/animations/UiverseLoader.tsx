'use client';

import { useEffect, useState } from 'react';

interface UiverseLoaderProps {
  variant: 'full' | 'inline';
  messages?: string[];
}

const defaultMessages = [
  'Putting your days together...',
  'Checking local weather...',
  'Mapping out walking times...',
  'Picking local food spots...',
  'Almost ready...',
];

export function UiverseLoader({ variant, messages }: UiverseLoaderProps) {
  const copy = messages ?? defaultMessages;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (variant !== 'full') return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % copy.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [copy.length, variant]);

  if (variant === 'inline') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '32px',
        padding: '0 16px',
      }}>
        <div style={{
          display: 'flex',
          gap: '3px',
          alignItems: 'center',
          height: '20px',
        }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: '20px',
                background: 'var(--color-ink)',
                animation: `uiverse-bars 1.2s ${i * 0.1}s ease-in-out infinite`,
                borderRadius: '1px',
              }}
            />
          ))}
        </div>
        {messages?.[0] && (
          <span style={{
            fontSize: 'var(--text-caption)',
            color: 'var(--color-steel)',
          }}>
            {messages[0]}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '32px',
    }}>
      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              background: 'var(--color-ink)',
              animation: `uiverse-fold 2.4s ${i * 0.3}s infinite ease-in-out both`,
            }}
          />
        ))}
      </div>
      <p style={{
        fontSize: 'var(--text-body-sm)',
        color: 'var(--color-steel)',
        fontWeight: 400,
        margin: 0,
        minHeight: '26px',
        transition: 'opacity 0.3s ease',
      }}>
        {copy[messageIndex]}
      </p>
    </div>
  );
}
