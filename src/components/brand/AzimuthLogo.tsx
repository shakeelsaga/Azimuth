'use client';

import Image from 'next/image';

interface AzimuthLogoProps {
  size?: number;
  className?: string;
}

export function AzimuthLogo({ size = 28, className }: AzimuthLogoProps) {
  return (
    <Image
      src="/assets/Azimuth_Logo.png"
      alt="Azimuth"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}
