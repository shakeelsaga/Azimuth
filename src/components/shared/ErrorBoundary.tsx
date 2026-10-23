'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useTripStore } from '@/store/useTripStore';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function ErrorFallback() {
  const loadDemoTrip = useTripStore((s) => s.loadDemoTrip);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '24px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontSize: 'var(--text-subheading)',
        fontWeight: 500,
        margin: 0,
      }}>
        Something unexpected happened.
      </h2>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-buttons)',
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            border: 'none',
            fontSize: 'var(--text-caption)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Refresh the page
        </button>
        <button
          onClick={() => loadDemoTrip('kyoto')}
          style={{
            padding: '10px 24px',
            borderRadius: 'var(--radius-buttons)',
            background: 'var(--color-paper)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-ink)',
            fontSize: 'var(--text-caption)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Load a sample trip
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
