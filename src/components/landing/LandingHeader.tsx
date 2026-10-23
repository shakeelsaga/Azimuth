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
      className="top-nav-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-faint-ash)',
        height: '64px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 clamp(16px, 3vw, 40px)',
      }}
    >
      {/* Brand Wordmark with Square Logo Container (Left) */}
      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', gap: '10px' }}>
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
          <AzimuthLogo size={28} />
          <AzimuthWordmark size="14px" />
        </Link>
      </div>

      {/* Center Nav Links - Truly centered relative to entire page */}
      <nav
        className="header-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(16px, 2.5vw, 28px)',
          justifySelf: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => scrollTo('planner-intake')}
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
          Plan a Trip
        </button>
        <button
          type="button"
          onClick={() => scrollTo('features-section')}
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
          Features
        </button>
        <button
          type="button"
          onClick={() => scrollTo('story-section')}
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
          The Story
        </button>
      </nav>

      {/* Right Action: Demo Trigger & Auth (Right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'end', gap: '12px' }}>
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
              <ArrowRight
                size={13}
                className="btn-arrow"
                style={{
                  display: 'inline-block',
                  transition: 'transform var(--transition-fast)',
                }}
              />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .nav-text-btn {
          transition: color var(--transition-fast);
        }
        .nav-text-btn:hover {
          text-decoration: underline;
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
        .header-signup-btn:hover .btn-arrow {
          transform: translateX(6px);
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
