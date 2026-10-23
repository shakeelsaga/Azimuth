'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TripPlan } from '@/lib/schemas';
import { Sparkles, Check } from 'lucide-react';
import { formatDualPrice, getDestinationCurrency, USD_TO_INR } from '@/lib/currency';

interface PackingBudgetSheetProps {
  isOpen: boolean;
  trip: TripPlan;
  onClose: () => void;
}

export function PackingBudgetSheet({ isOpen, trip, onClose }: PackingBudgetSheetProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [currencyMode, setCurrencyMode] = useState<'dual' | 'inr' | 'local'>('dual');

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const budget = trip.budgetSummary;
  const packing = trip.packingItems;
  const tips = trip.beforeYouGoTips;

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Packing, Budget and Tips"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 'var(--z-overlay)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        />

        {/* Panel Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '480px',
            height: '100%',
            background: 'var(--color-paper)',
            borderLeft: '1px solid var(--color-ink)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: 'clamp(24px, 4vw, 40px)',
            gap: '36px',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-caption)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--color-steel)' }}>
              Travel Logistics
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                lineHeight: 1,
                cursor: 'pointer',
                color: 'var(--color-ink)',
                padding: '4px',
              }}
            >
              ×
            </button>
          </div>

          {/* Section 1: Budget Breakdown */}
          {budget && (() => {
            const destinationCountry = trip.country || trip.destination;
            const localCurrency = getDestinationCurrency(destinationCountry);
            const accomPrices = formatDualPrice(budget.accommodationPerNightUSD, destinationCountry);
            const foodPrices = formatDualPrice(budget.foodPerDayUSD, destinationCountry);
            const transitPrices = formatDualPrice(budget.transitAndTicketsPerDayUSD, destinationCountry);
            const totalPrices = formatDualPrice(budget.dailyAverageUSD, destinationCountry);

            const renderPriceItem = (prices: ReturnType<typeof formatDualPrice>, suffix: string) => {
              if (currencyMode === 'inr') {
                return <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{prices.inr} {suffix}</span>;
              }
              if (currencyMode === 'local') {
                return <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{prices.local} {suffix}</span>;
              }
              return (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{prices.inr} {suffix}</span>
                  {prices.localCode !== 'INR' && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-steel)',
                        background: 'var(--color-faint-ash)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-buttons)',
                        fontWeight: 500,
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      {prices.local}
                    </span>
                  )}
                </div>
              );
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-ink)' }}>
                      Budget Breakdown
                    </h3>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)', margin: 0 }}>
                      Converted at 1 USD ≈ ₹{USD_TO_INR} INR {localCurrency.code !== 'USD' && `• 1 USD ≈ ${localCurrency.rateAgainstUSD} ${localCurrency.code}`}
                    </p>
                  </div>

                  {/* Currency selector toggle */}
                  <div
                    style={{
                      display: 'inline-flex',
                      background: 'var(--color-faint-ash)',
                      padding: '3px',
                      borderRadius: 'var(--radius-buttons)',
                      border: '1px solid #e0e0e0',
                      gap: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCurrencyMode('dual')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-buttons)',
                        border: 'none',
                        background: currencyMode === 'dual' ? 'var(--color-ink)' : 'transparent',
                        color: currencyMode === 'dual' ? 'var(--color-paper)' : 'var(--color-steel)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      ₹ INR + Local
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrencyMode('inr')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-buttons)',
                        border: 'none',
                        background: currencyMode === 'inr' ? 'var(--color-ink)' : 'transparent',
                        color: currencyMode === 'inr' ? 'var(--color-paper)' : 'var(--color-steel)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      ₹ INR
                    </button>
                    {localCurrency.code !== 'INR' && (
                      <button
                        type="button"
                        onClick={() => setCurrencyMode('local')}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-buttons)',
                          border: 'none',
                          background: currencyMode === 'local' ? 'var(--color-ink)' : 'transparent',
                          color: currencyMode === 'local' ? 'var(--color-paper)' : 'var(--color-steel)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {localCurrency.symbol} {localCurrency.code}
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--color-faint-ash)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-faint-ash)', fontSize: 'var(--text-body-sm)' }}>
                    <span style={{ color: 'var(--color-charcoal)' }}>Accommodation</span>
                    {renderPriceItem(accomPrices, '/ night')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-faint-ash)', fontSize: 'var(--text-body-sm)' }}>
                    <span style={{ color: 'var(--color-charcoal)' }}>Food & Dining</span>
                    {renderPriceItem(foodPrices, '/ day')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-faint-ash)', fontSize: 'var(--text-body-sm)' }}>
                    <span style={{ color: 'var(--color-charcoal)' }}>Transit & Tickets</span>
                    {renderPriceItem(transitPrices, '/ day')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--color-ink)', fontSize: 'var(--text-subheading)', fontWeight: 700 }}>
                    <span>Total Daily Estimate</span>
                    {renderPriceItem(totalPrices, '/ day')}
                  </div>
                </div>

                {/* Money Saving Tip */}
                {budget.moneySavingTrick && (
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--color-faint-ash)',
                      borderRadius: 'var(--radius-small)',
                      fontSize: 'var(--text-caption)',
                      lineHeight: 1.45,
                      color: 'var(--color-charcoal)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={15} style={{ color: 'var(--color-ink)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Local Money Tip:</strong> {budget.moneySavingTrick}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section 2: Smart Packing List */}
          {packing && packing.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Pack These
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {packing.map((pack) => {
                  const isChecked = Boolean(checkedItems[pack.item]);
                  return (
                    <div
                      key={pack.item}
                      onClick={() => toggleCheck(pack.item)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        cursor: 'pointer',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-small)',
                        background: isChecked ? 'var(--color-faint-ash)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid var(--color-ink)' : '1px solid #bbbbbb',
                          background: isChecked ? 'var(--color-ink)' : 'var(--color-paper)',
                          color: 'var(--color-paper)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-body-sm)',
                            fontWeight: 600,
                            color: isChecked ? 'var(--color-steel)' : 'var(--color-ink)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                          }}
                        >
                          {pack.item}
                        </span>
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-steel)' }}>
                          {pack.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Before You Go Tips */}
          {tips && tips.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' }}>
                Before You Go
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--color-ink)',
                        color: 'var(--color-paper)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', lineHeight: 1.45, color: 'var(--color-ink)' }}>
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
