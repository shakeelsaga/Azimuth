'use client';

import { useMemo } from 'react';
import type { ActivityStop } from '@/lib/schemas';
import { getTransitBridgeInfo } from '@/lib/geo';
import { Footprints, BusFront, CarFront } from 'lucide-react';

interface TransitBridgeProps {
  fromStop: ActivityStop;
  toStop: ActivityStop;
}

export function TransitBridge({ fromStop, toStop }: TransitBridgeProps) {
  const info = useMemo(() => {
    return getTransitBridgeInfo(fromStop, toStop);
  }, [fromStop, toStop]);

  const renderModeIcon = () => {
    if (info.mode === 'Walk') {
      return <Footprints size={14} style={{ color: 'var(--color-steel)', flexShrink: 0 }} />;
    }
    if (info.mode === 'Transit') {
      return <BusFront size={14} style={{ color: 'var(--color-steel)', flexShrink: 0 }} />;
    }
    return <CarFront size={14} style={{ color: 'var(--color-steel)', flexShrink: 0 }} />;
  };

  return (
    <div
      className="transit-bridge"
      style={{
        margin: '12px 0 12px 20px',
        padding: '10px 16px',
        background: 'var(--color-faint-ash)',
        borderRadius: 'var(--radius-small)',
        borderLeft: '2px dashed var(--color-steel)',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-caption)',
          color: 'var(--color-steel)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
        }}
      >
        {renderModeIcon()}
        <span>
          {info.distanceDisplay} • {info.durationDisplay} {info.mode.toLowerCase()}
        </span>
      </div>
      {info.bufferNote && (
        <div
          style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--color-steel)',
            paddingLeft: '21px',
          }}
        >
          {info.bufferNote}
        </div>
      )}
    </div>
  );
}
