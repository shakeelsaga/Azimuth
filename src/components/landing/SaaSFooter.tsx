'use client';

import Link from 'next/link';
import { ArrowUp, Github, ExternalLink } from 'lucide-react';
import { AzimuthLogo, AzimuthWordmark } from '@/components/brand/AzimuthLogo';

export function SaaSFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-paper)',
        padding: 'clamp(64px, 10vh, 96px) clamp(20px, 4vw, 56px) 40px clamp(20px, 4vw, 56px)',
        borderTop: '1px solid #222',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(48px, 8vh, 72px)',
        }}
      >
        {/* Top Tier: Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'clamp(32px, 5vw, 64px)',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Column with Square Logo Container */}
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AzimuthLogo size={36} />
              <AzimuthWordmark size="20px" style={{ color: 'var(--color-paper)' }} />
            </div>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.7)',
                margin: '0 0 24px 0',
              }}
            >
              Thoughtful day-by-day travel planning. Built to help you wander calmly at your own pace without the rush.
            </p>

            {/* GitHub Repository Badge */}
            <a
              href="https://github.com/shakeelsaga/Azimuth"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-buttons)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--color-paper)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background var(--transition-fast), border-color var(--transition-fast)',
              }}
              className="github-badge-link"
            >
              <Github size={16} />
              <span>shakeelsaga / Azimuth</span>
              <ExternalLink size={12} style={{ opacity: 0.6 }} />
            </a>
          </div>

          {/* Links Column 1: Navigation */}
          <div>
            <h4
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#F01916',
                margin: '0 0 16px 0',
              }}
            >
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('planner-intake')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 0, fontSize: '14px', fontFamily: 'inherit' }}
                  className="footer-nav-link"
                >
                  Plan a Trip
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('features-section')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 0, fontSize: '14px', fontFamily: 'inherit' }}
                  className="footer-nav-link"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('story-section')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 0, fontSize: '14px', fontFamily: 'inherit' }}
                  className="footer-nav-link"
                >
                  The Arctic Tern Story
                </button>
              </li>
              <li>
                <Link
                  href="/login"
                  style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px' }}
                  className="footer-nav-link"
                >
                  Account & Saved Trips
                </Link>
              </li>
            </ul>
          </div>

          {/* Back to top & Licensing */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
              type="button"
              onClick={scrollToTop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-buttons)',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'transform var(--transition-fast), background var(--transition-fast)',
              }}
              className="back-to-top-btn"
            >
              <span>Back to Top</span>
              <ArrowUp size={14} />
            </button>

            <div style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Open source under the MIT License. No trackers, no bloat.
            </div>
          </div>
        </div>

        {/* Monumental Watermark Name Closing */}
        <div
          style={{
            userSelect: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: 'clamp(36px, 8vw, 84px)', fontWeight: 700, letterSpacing: '-0.06em', lineHeight: 1, color: 'rgba(255, 255, 255, 0.12)' }}>
            AZ<span style={{ color: '#F01916', opacity: 0.8 }}>i</span>MUTH
          </div>

          <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2026 <AzimuthWordmark size="13px" style={{ color: '#fff' }} />. Inspired by the Arctic Tern.
          </div>
        </div>
      </div>

      <style>{`
        .github-badge-link:hover {
          background: rgba(255, 255, 255, 0.18) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
        .footer-nav-link {
          transition: color var(--transition-fast);
        }
        .footer-nav-link:hover {
          color: #fff !important;
        }
        .back-to-top-btn:hover {
          background: #e6e6e2 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </footer>
  );
}
