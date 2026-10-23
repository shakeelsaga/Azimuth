'use client';

import { motion } from 'motion/react';
import { AzimuthWordmark } from '@/components/brand/AzimuthLogo';

export function BrandStory() {
  return (
    <section
      id="story-section"
      style={{
        background: 'var(--color-faint-ash)',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        padding: 'clamp(64px, 10vh, 100px) clamp(20px, 4vw, 56px)',
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#F01916',
            }}
          >
            The Story Behind the Name
          </span>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Why <AzimuthWordmark /> and why the Arctic Tern?
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'var(--color-charcoal)',
            }}
          >
            <p style={{ margin: 0 }}>
              In navigation, an <strong>azimuth</strong> is your compass bearing from where you stand to where you want to go. It is a true direction, not an overwhelming bucket list. We built Azimuth to give travelers that same clarity, turning scattered ideas into realistic, day-by-day plans you can actually enjoy.
            </p>

            <p style={{ margin: 0 }}>
              Our symbol is the <strong>Arctic Tern</strong>. Every year, this small sea bird completes the longest journey of any animal on Earth, flying pole-to-pole from the Arctic to Antarctica and back. It crosses thousands of miles of open ocean guided by pure instinct, always finding its way with calm, quiet confidence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
