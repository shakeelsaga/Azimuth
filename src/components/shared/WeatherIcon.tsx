'use client';

import {
  Sun,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Cloud,
} from 'lucide-react';

interface WeatherIconProps {
  code?: number;
  className?: string;
  size?: number;
}

export function WeatherIcon({ code = 0, className = '', size = 16 }: WeatherIconProps) {
  if (code === 0) {
    return <Sun size={size} className={className} strokeWidth={2} />;
  }
  if ([1, 2, 3].includes(code)) {
    return <CloudSun size={size} className={className} strokeWidth={2} />;
  }
  if ([45, 48].includes(code)) {
    return <CloudFog size={size} className={className} strokeWidth={2} />;
  }
  if ([51, 53, 55].includes(code)) {
    return <CloudDrizzle size={size} className={className} strokeWidth={2} />;
  }
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return <CloudRain size={size} className={className} strokeWidth={2} />;
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return <CloudSnow size={size} className={className} strokeWidth={2} />;
  }
  if ([95, 96, 99].includes(code)) {
    return <CloudLightning size={size} className={className} strokeWidth={2} />;
  }

  return <Cloud size={size} className={className} strokeWidth={2} />;
}
