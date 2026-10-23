'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AzimuthLogo, AzimuthWordmark } from '@/components/brand/AzimuthLogo';
import { UserProfileMenu } from '@/components/auth/UserProfileMenu';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTripStore } from '@/store/useTripStore';

export function LandingHeader() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const loadDemoTrip = useTripStore((s) => s.loadDemoTrip);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250, 250, 248, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 clamp(16px, 4vw, 48px)',
        transition: 'background var(--transition-fast)',
      }}
    >
      {/* Brand Wordmark with Square Logo Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--color-ink)',
          }}
          aria-label="AZiMUTH Home"
        >
          <AzimuthLogo size={32} />
          <AzimuthWordmark size="16px" />
        </Link>
      </div>

      {/* Center Nav Links - Smooth Scroll */}
      <nav
        className="header-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
        }}
      >
        <button
          type="button"
          onClick={() => scrollTo('planner-intake')}
          className="nav-link-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-charcoal)',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          Plan a Trip
        </button>
        <button
          type="button"
          onClick={() => scrollTo('features-section')}
          className="nav-link-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-charcoal)',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          Features
        </button>
        <button
          type="button"
          onClick={() => scrollTo('story-section')}
          className="nav-link-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-charcoal)',
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          The Story
        </button>
      </nav>

      {/* Right Action: Demo Trigger & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={() => loadDemoTrip('kyoto')}
          className="header-demo-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 'var(--radius-buttons)',
            background: 'var(--color-faint-ash)',
            border: '1px solid transparent',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast), border-color var(--transition-fast)',
          }}
        >
          <Sparkles size={13} style={{ color: '#F01916' }} />
          <span>Demo Trip</span>
        </button>

        {isAuthenticated ? (
          <UserProfileMenu />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/login?mode=signin"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-ink)',
                textDecoration: 'none',
                padding: '7px 12px',
              }}
              className="header-signin-link"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-ink)',
                color: 'var(--color-paper)',
                textDecoration: 'none',
                transition: 'background var(--transition-fast), transform var(--transition-fast)',
              }}
              className="header-signup-btn"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .nav-link-btn {
          transition: color var(--transition-fast);
        }
        .nav-link-btn:hover {
          color: var(--color-ink) !important;
        }
        .header-demo-btn:hover {
          background: #e6e5e0 !important;
          border-color: #d0cfc8 !important;
        }
        .header-signin-link:hover {
          color: #F01916 !important;
        }
        .header-signup-btn:hover {
          background: #242424 !important;
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .header-nav-links {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
