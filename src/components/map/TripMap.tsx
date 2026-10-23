'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { DayPlan, TripPlan } from '@/lib/schemas';
import { useTripStore } from '@/store/useTripStore';
import { MapPin, X } from 'lucide-react';

interface TripMapProps {
  trip: TripPlan;
  activeDay: DayPlan;
  className?: string;
}

const CARTO_POSITRON_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function TripMap({ trip, activeDay, className = '' }: TripMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const selectedStopId = useTripStore((s) => s.selectedStopId);
  const hoveredStopId = useTripStore((s) => s.hoveredStopId);
  const setSelectedStopId = useTripStore((s) => s.setSelectedStopId);
  const setHoveredStopId = useTripStore((s) => s.setHoveredStopId);

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const stops = activeDay?.stops ?? [];

  // Construct GeoJSON LineString for current day's stops
  const routeGeoJSON = useMemo(() => {
    if (stops.length < 2) return null;

    const coordinates = stops.map((s) => [s.coordinates.lng, s.coordinates.lat]);

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
        },
      ],
    };
  }, [stops]);

  // Fit bounds whenever active day changes or stops change
  useEffect(() => {
    if (!mapRef.current || stops.length === 0) return;

    if (stops.length === 1) {
      mapRef.current.flyTo({
        center: [stops[0].coordinates.lng, stops[0].coordinates.lat],
        zoom: 14,
        duration: 1000,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    stops.forEach((s) => {
      bounds.extend([s.coordinates.lng, s.coordinates.lat]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      duration: 1000,
    });
  }, [activeDay.dayNumber, stops]);

  // Fly to hovered stop if changed
  useEffect(() => {
    if (!mapRef.current || !hoveredStopId) return;
    const target = stops.find((s) => s.id === hoveredStopId);
    if (target) {
      mapRef.current.flyTo({
        center: [target.coordinates.lng, target.coordinates.lat],
        zoom: Math.max(mapRef.current.getZoom(), 13.5),
        duration: 600,
      });
    }
  }, [hoveredStopId, stops]);

  const handleMarkerClick = (stopId: string) => {
    setSelectedStopId(stopId);
    const cardEl = document.getElementById(`stop-card-${stopId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const mapContent = (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: trip.centerCoordinates.lng,
          latitude: trip.centerCoordinates.lat,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_POSITRON_STYLE}
        attributionControl={false}
      >
        {/* Dashed Polyline Route between day's stops */}
        {routeGeoJSON && (
          <Source id="day-route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="day-route-line"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 2.5,
                'line-dasharray': [2, 2],
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Numbered Ink Pins */}
        {stops.map((stop, index) => {
          const isSelected = selectedStopId === stop.id;
          const isHovered = hoveredStopId === stop.id;
          const isHighlighted = isSelected || isHovered;
          const size = isHighlighted ? 40 : 32;

          return (
            <Marker
              key={stop.id || `map-stop-${index}`}
              longitude={stop.coordinates.lng}
              latitude={stop.coordinates.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(stop.id);
              }}
            >
              <div
                onMouseEnter={() => setHoveredStopId(stop.id)}
                onMouseLeave={() => setHoveredStopId(null)}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: isHighlighted ? 'var(--color-ink)' : '#111111',
                  color: 'var(--color-paper)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: isHighlighted ? '15px' : '13px',
                  border: isHighlighted ? '3px solid var(--color-paper)' : '2px solid var(--color-paper)',
                  boxShadow: isHighlighted ? '0 0 0 1px var(--color-ink)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  userSelect: 'none',
                }}
                title={`${stop.startTime}: ${stop.title}`}
              >
                {index + 1}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );

  return (
    <>
      {/* Desktop / Large Screen sticky container */}
      <div className={`desktop-map-container ${className}`} style={{ width: '100%', height: '100%' }}>
        {mapContent}
      </div>

      {/* Mobile Floating Map Button (FAB) */}
      <button
        type="button"
        className="mobile-map-toggle-fab"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Toggle map view"
        style={{
          display: 'none', // shown via media query
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          border: '2px solid var(--color-paper)',
          zIndex: 'var(--z-sticky)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapPin size={24} />
      </button>

      {/* Mobile Map Bottom Sheet Modal */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '80vh',
              background: 'var(--color-paper)',
              borderTopLeftRadius: 'var(--radius-cards)',
              borderTopRightRadius: 'var(--radius-cards)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                height: '48px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-faint-ash)',
              }}
            >
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600 }}>
                Day {activeDay.dayNumber} Route Map
              </span>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {/* Map */}
            <div style={{ flex: 1 }}>{mapContent}</div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) {
          .desktop-map-container {
            display: none !important;
          }
          .mobile-map-toggle-fab {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
