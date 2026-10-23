'use client';

import Image from 'next/image';

interface AzimuthLogoProps {
  size?: number;
  className?: string;
}

export function AzimuthLogo({ size = 28, className }: AzimuthLogoProps) {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '6px',
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <Image
        src="/assets/Azimuth_Logo.png"
        alt="Azimuth"
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        priority
      />
    </div>
  );
}

export interface AzimuthWordmarkProps {
  className?: string;
  style?: React.CSSProperties;
  size?: string | number;
  withTrademark?: boolean;
}

export function AzimuthWordmark({
  className,
  style,
  size,
  withTrademark = false,
}: AzimuthWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        fontSize: size ?? 'inherit',
        lineHeight: 1,
        ...style,
      }}
      aria-label="AZiMUTH"
    >
      <span>AZ</span>
      <span style={{ color: '#F01916' }}>i</span>
      <span>MUTH</span>
      {withTrademark && (
        <span
          style={{
            fontSize: '0.42em',
            marginLeft: '2px',
            transform: 'translateY(-0.4em)',
            fontWeight: 600,
            letterSpacing: 'normal',
            display: 'inline-block',
          }}
        >
          ™
        </span>
      )}
    </span>
  );
}

