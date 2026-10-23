'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { AzimuthWordmark } from '@/components/brand/AzimuthLogo';

interface FeatureItemProps {
  index: number;
  reverse?: boolean;
  label: string;
  title: string;
  description: string;
  details: string[];
  filename: string;
  imageAlt: string;
}

function ImagePlaceholder({
  src,
  alt,
  filename,
  label,
}: {
  src: string;
  alt: string;
  filename: string;
  label: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        borderRadius: 'var(--radius-cards)',
        border: '1px solid var(--color-ink)',
        background: 'var(--color-faint-ash)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
      }}
    >
      {!error && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: 'cover' }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {(!loaded || error) && (
        <div
          style={{
            padding: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '6px',
              border: '1px dashed #999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-steel)',
            }}
          >
            <ImageIcon size={20} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-steel)' }}>
            public/assets/{filename}
          </span>
        </div>
      )}
    </div>
  );
}

function FeatureRow({
  reverse = false,
  label,
  title,
  description,
  details,
  filename,
  imageAlt,
}: FeatureItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`feature-row ${reverse ? 'reverse' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 6vw, 72px)',
        alignItems: 'center',
      }}
    >
      {/* Column A: Image Placeholder or Info */}
      <div className="feature-col-media">
        <ImagePlaceholder
          src={`/assets/${filename}`}
          alt={imageAlt}
          filename={filename}
          label={label}
        />
      </div>

      {/* Column B: Info */}
      <div className="feature-col-text">
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#F01916',
            display: 'inline-block',
            marginBottom: '10px',
          }}
        >
          {label}
        </span>
        <h3
          style={{
            fontSize: 'clamp(24px, 3.2vw, 36px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
            margin: '0 0 16px 0',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.65,
            color: 'var(--color-charcoal)',
            margin: '0 0 20px 0',
          }}
        >
          {description}
        </p>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {details.map((item, idx) => (
            <li
              key={idx}
              style={{
                fontSize: '14px',
                color: 'var(--color-ink)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '1px',
                  background: '#F01916',
                  flexShrink: 0,
                }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function FeatureShowcase() {
  return (
    <section
      id="features-section"
      style={{
        padding: 'clamp(64px, 12vh, 120px) clamp(20px, 4vw, 56px)',
        maxWidth: '1120px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(56px, 10vh, 100px)',
      }}
    >
      {/* Feature 1: Left Image, Right Info */}
      <FeatureRow
        index={1}
        reverse={false}
        label="Thoughtful Pacing"
        title="Days that feel like a vacation, not a checklist."
        description="No rushing across the city or squeezing twelve sights into one exhausted afternoon. Activities are grouped naturally by neighborhood with realistic walking times so you can take it slow."
        details={[
          'Grouped by walkable neighborhoods',
          'Honest travel times between each stop',
          'Morning, afternoon, and evening breathing room',
        ]}
        filename="feature_pacing.png"
        imageAlt="Balanced daily pacing preview"
      />

      {/* Feature 2: Right Image, Left Info */}
      <FeatureRow
        index={2}
        reverse={true}
        label="Route Map"
        title="See your whole day clearly laid out on a map."
        description="A clean, distraction-free map stays right beside your schedule. It updates with every stop, showing walking paths, nearby sights, and neighborhoods at a glance."
        details={[
          'Simple, high-contrast map view',
          'Numbered markers matching your schedule',
          'Follows your active day automatically',
        ]}
        filename="feature_map.png"
        imageAlt="Interactive route map preview"
      />

      {/* Feature 3: Left Image, Right Info */}
      <FeatureRow
        index={3}
        reverse={false}
        label="Quick Changes"
        title="Need to change plans? Just ask in plain words."
        description="Plans change when you travel. Instead of rebuilding from scratch, just say 'Make day 2 more relaxed' or 'Find more local food spots' and watch your schedule adjust."
        details={[
          'Adjust individual days without losing the rest',
          'Helpful suggestions for every city',
          'Swap any single stop with one click',
        ]}
        filename="feature_tweak.png"
        imageAlt="Natural quick changes dock preview"
      />

      {/* Feature 4: Right Image, Left Info */}
      <FeatureRow
        index={4}
        reverse={true}
        label="Realistic Costs"
        title="Know what things cost before you head out."
        description="A clear, realistic estimate of daily costs for your stay, food, and transit — shown in Indian Rupee (₹) alongside the local currency, with sensible tips to save money."
        details={[
          'Dual currency (₹ INR alongside local currency)',
          'Clear daily estimates for stay, meals, and getting around',
          'Local tips to avoid overpaying',
        ]}
        filename="feature_budget.png"
        imageAlt="Realistic budget breakdown preview"
      />

      <style>{`
        @media (min-width: 861px) {
          .feature-row.reverse .feature-col-media {
            order: 2;
          }
          .feature-row.reverse .feature-col-text {
            order: 1;
          }
        }
        @media (max-width: 860px) {
          .feature-row {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .feature-row.reverse .feature-col-media {
            order: 1;
          }
          .feature-row.reverse .feature-col-text {
            order: 2;
          }
        }
      `}</style>
    </section>
  );
}
