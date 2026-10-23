'use client';

import type { TripPlan } from '@/lib/schemas';
import { getTransitBridgeInfo } from '@/lib/geo';
import { convertPriceRangeString, formatDualPrice } from '@/lib/currency';

interface PrintViewProps {
  trip: TripPlan;
}

export function PrintView({ trip }: PrintViewProps) {
  return (
    <div
      className="print-only-container"
      style={{
        display: 'none', // Controlled by @media print in globals.css
      }}
    >
      {/* Print Cover Header */}
      <div className="print-header" style={{ marginBottom: '24pt', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28pt', margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>
          AZIMUTH
        </h1>
        <div style={{ fontSize: '16pt', marginTop: '6pt', fontWeight: 600 }}>
          {trip.destination}, {trip.country} — {trip.daysCount} {trip.daysCount === 1 ? 'Day' : 'Days'}
        </div>
        {trip.friendlyIntro && (
          <p style={{ fontSize: '11pt', fontStyle: 'italic', maxWidth: '600px', margin: '10pt auto 0 auto', color: '#444' }}>
            {trip.friendlyIntro}
          </p>
        )}
      </div>

      {/* Days Iteration */}
      {trip.days.map((day) => (
        <div
          key={`print-day-${day.dayNumber}`}
          className="day-section"
          style={{ marginBottom: '20pt' }}
        >
          <div style={{ borderBottom: '2pt solid #000', paddingBottom: '6pt', marginBottom: '14pt' }}>
            <h2 style={{ fontSize: '18pt', margin: 0, fontWeight: 700 }}>
              DAY {String(day.dayNumber).padStart(2, '0')} — {day.title}
            </h2>
            {day.neighborhoodFocus && (
              <div style={{ fontSize: '10pt', color: '#555', marginTop: '2pt' }}>
                Area Focus: {day.neighborhoodFocus}
              </div>
            )}
          </div>

          {/* Stops & Bridges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10pt' }}>
            {day.stops.map((stop, sIndex) => {
              const nextStop = day.stops[sIndex + 1];
              const bridge = nextStop ? getTransitBridgeInfo(stop, nextStop) : null;

              return (
                <div key={`print-stop-${stop.id}`}>
                  <div
                    className="stop-card"
                    style={{
                      border: '1pt solid #000',
                      padding: '10pt',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
                      <span style={{ fontWeight: 700, fontSize: '11pt' }}>
                        {stop.startTime} • {stop.timeSlot} — {stop.title}
                      </span>
                      <span style={{ fontSize: '9pt', textTransform: 'uppercase', color: '#555' }}>
                        {stop.category}
                      </span>
                    </div>

                    {stop.neighborhood && (
                      <div style={{ fontSize: '9pt', color: '#666', marginBottom: '4pt' }}>
                        {stop.neighborhood}
                      </div>
                    )}

                    <p style={{ margin: '4pt 0', fontSize: '10pt', lineHeight: 1.4 }}>
                      {stop.description}
                    </p>

                    {stop.timingAnnotation && (
                      <div style={{ fontSize: '9pt', fontStyle: 'italic', color: '#555', marginTop: '3pt' }}>
                        Timing Note: {stop.timingAnnotation}
                      </div>
                    )}

                    {stop.foodSpot && (
                      <div style={{ marginTop: '5pt', fontSize: '9pt', background: '#f5f5f5', padding: '4pt 6pt' }}>
                        <strong>Food:</strong> {stop.foodSpot.name} — Try the {stop.foodSpot.dishToTry} ({stop.foodSpot.vibe})
                      </div>
                    )}

                    {stop.overnightStay && (
                      <div style={{ marginTop: '4pt', fontSize: '9pt', background: '#f5f5f5', padding: '4pt 6pt' }}>
                        <strong>Stay:</strong> {stop.overnightStay.name} ({convertPriceRangeString(stop.overnightStay.priceRangeUSD, trip.country || trip.destination).dual})
                      </div>
                    )}
                  </div>

                  {bridge && (
                    <div
                      className="transit-bridge"
                      style={{
                        padding: '4pt 8pt',
                        fontSize: '9pt',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      ↓ {bridge.mode}: {bridge.distanceDisplay} ({bridge.durationDisplay}) — {bridge.bufferNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logistics Summary Page */}
      <div style={{ pageBreakBefore: 'always', paddingTop: '10pt' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 700, borderBottom: '2pt solid #000', paddingBottom: '4pt' }}>
          Travel Logistics & Notes
        </h2>

        {/* Budget */}
        {trip.budgetSummary && (
          <div style={{ marginTop: '14pt' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 700, margin: '0 0 6pt 0' }}>Estimated Budget</h3>
            <div style={{ fontSize: '10pt', lineHeight: 1.5 }}>
              <div>Accommodation: {formatDualPrice(trip.budgetSummary.accommodationPerNightUSD, trip.country || trip.destination).dual} / night</div>
              <div>Food: {formatDualPrice(trip.budgetSummary.foodPerDayUSD, trip.country || trip.destination).dual} / day</div>
              <div>Transit & Tickets: {formatDualPrice(trip.budgetSummary.transitAndTicketsPerDayUSD, trip.country || trip.destination).dual} / day</div>
              <div style={{ fontWeight: 700, marginTop: '4pt' }}>
                Total Daily Average: {formatDualPrice(trip.budgetSummary.dailyAverageUSD, trip.country || trip.destination).dual} / day
              </div>
              {trip.budgetSummary.moneySavingTrick && (
                <div style={{ fontStyle: 'italic', marginTop: '4pt', color: '#444' }}>
                  Tip: {trip.budgetSummary.moneySavingTrick}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packing */}
        {trip.packingItems && trip.packingItems.length > 0 && (
          <div style={{ marginTop: '16pt' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 700, margin: '0 0 6pt 0' }}>Key Packing Items</h3>
            <ul style={{ margin: 0, paddingLeft: '16pt', fontSize: '10pt' }}>
              {trip.packingItems.map((p) => (
                <li key={p.item} style={{ marginBottom: '3pt' }}>
                  <strong>{p.item}</strong>: {p.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        {trip.beforeYouGoTips && trip.beforeYouGoTips.length > 0 && (
          <div style={{ marginTop: '16pt' }}>
            <h3 style={{ fontSize: '14pt', fontWeight: 700, margin: '0 0 6pt 0' }}>Before You Go</h3>
            <ol style={{ margin: 0, paddingLeft: '16pt', fontSize: '10pt' }}>
              {trip.beforeYouGoTips.map((tip, i) => (
                <li key={i} style={{ marginBottom: '4pt' }}>
                  {tip}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .print-only-container {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
