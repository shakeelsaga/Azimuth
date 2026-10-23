'use client';

import { useState } from 'react';
import { useTripStore } from '@/store/useTripStore';
import type { TripPlan, TweakResponse } from '@/lib/schemas';
import { Sparkles } from 'lucide-react';

interface QuickTweakDockProps {
  trip: TripPlan;
}

export function QuickTweakDock({ trip }: QuickTweakDockProps) {
  const [inputVal, setInputVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingPrompt, setSubmittingPrompt] = useState<string | null>(null);
  const [clarification, setClarification] = useState<string | null>(null);

  const setPendingDiff = useTripStore((s) => s.setPendingDiff);
  const setActiveDayNumber = useTripStore((s) => s.setActiveDayNumber);
  const setSelectedStopId = useTripStore((s) => s.setSelectedStopId);
  const showToast = useTripStore((s) => s.showToast);

  const suggestedPrompts = trip.suggestedTweakPrompts || [];

  const handleTweakSubmit = async (message: string, isFromPill = false) => {
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    if (isFromPill) {
      setSubmittingPrompt(message);
    }
    setClarification(null);

    try {
      const res = await fetch('/api/trip/tweak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripContext: {
            destination: trip.destination,
            country: trip.country,
            daysCount: trip.daysCount,
            structuralParams: {
              travelCompanions: 'couple',
              tripPurpose: 'cultural',
              budgetPreference: 'mid_range',
            },
            days: trip.days,
          },
          userMessage: message.trim(),
        }),
      });

      if (!res.ok) {
        showToast("Couldn't process your tweak request. Try rephrasing.", 'error');
        setIsSubmitting(false);
        return;
      }

      const tweakData: TweakResponse = await res.json();

      if (tweakData.type === 'clarification' && tweakData.clarificationMessage) {
        setClarification(tweakData.clarificationMessage);
      } else if (tweakData.type === 'swap' && tweakData.swapResponse && tweakData.affectedStopId) {
        const dayNumber = tweakData.affectedDayNumber || 1;
        setActiveDayNumber(dayNumber);
        setSelectedStopId(tweakData.affectedStopId);

        setPendingDiff({
          dayNumber,
          stopId: tweakData.affectedStopId,
          diffResponse: tweakData.swapResponse,
        });

        setInputVal('');
        showToast('Proposed modification is ready in your itinerary.', 'info');
      } else {
        showToast('Modification applied.', 'info');
      }
    } catch {
      showToast('Network error while modifying trip.', 'error');
    } finally {
      setIsSubmitting(false);
      setSubmittingPrompt(null);
    }
  };

  function LoadingDots({ color = 'currentColor' }: { color?: string }) {
    return (
      <span
        className="loading-dots"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          marginLeft: '4px',
          verticalAlign: 'middle',
        }}
        aria-label="Loading..."
      >
        <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }} />
        <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }} />
        <span className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: color }} />
      </span>
    );
  }

  return (
    <div
      className="tweak-dock"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-charcoal)',
        borderTopLeftRadius: 'var(--radius-cards)',
        borderTopRightRadius: 'var(--radius-cards)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid #333333',
        borderBottom: 'none',
        marginBottom: 0,
      }}
    >
      {/* Suggested prompts (visible when input is empty and not clarifying) */}
      {!inputVal && !clarification && suggestedPrompts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
          {suggestedPrompts.map((prompt, idx) => {
            const isThisPromptActive = isSubmitting && submittingPrompt === prompt;
            return (
              <button
                key={`suggested-tweak-${idx}-${prompt || 'p'}`}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setInputVal(prompt);
                  handleTweakSubmit(prompt, true);
                }}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '8px 18px',
                  minHeight: '36px',
                  borderRadius: 'var(--radius-buttons)',
                  background: isThisPromptActive ? '#555555' : '#333333',
                  color: isThisPromptActive ? 'var(--color-paper)' : 'var(--color-steel)',
                  border: isThisPromptActive ? '1px solid #777777' : '1px solid #444444',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 500,
                  lineHeight: 1,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.color = 'var(--color-paper)';
                    e.currentTarget.style.borderColor = '#666666';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.color = 'var(--color-steel)';
                    e.currentTarget.style.borderColor = '#444444';
                  }
                }}
              >
                <span>{prompt}</span>
                {isThisPromptActive && <LoadingDots color="var(--color-paper)" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Active processing banner */}
      {isSubmitting && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: '#222222',
            borderRadius: 'var(--radius-small)',
            border: '1px solid #383838',
            fontSize: 'var(--text-caption)',
            color: 'var(--color-steel)',
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--color-paper)', flexShrink: 0 }} />
          <span style={{ color: 'var(--color-paper)' }}>Thinking through changes to your itinerary</span>
          <LoadingDots color="var(--color-paper)" />
        </div>
      )}

      {/* Clarification prompt bubble */}
      {clarification && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-cards)',
            background: '#333333',
            color: 'var(--color-paper)',
            fontSize: 'var(--text-caption)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ flexShrink: 0, color: 'var(--color-showcase)' }} />
            <span>{clarification}</span>
          </div>
          <button
            type="button"
            onClick={() => setClarification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-steel)',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleTweakSubmit(inputVal);
        }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isSubmitting}
          placeholder={isSubmitting ? 'Crafting requested adjustment...' : 'Need to tweak something? (e.g. Add more quiet gardens, swap temples)'}
          style={{
            flex: 1,
            height: '46px',
            padding: '0 16px',
            borderRadius: 'var(--radius-cards)',
            border: '1px solid var(--color-steel)',
            background: 'var(--color-charcoal)',
            color: 'var(--color-paper)',
            fontSize: 'var(--text-body-sm)',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isSubmitting}
          aria-label="Submit modification"
          className="tweak-submit-btn"
          style={{
            height: '46px',
            padding: '0 20px',
            borderRadius: 'var(--radius-buttons)',
            background: inputVal.trim() && !isSubmitting ? 'var(--color-paper)' : '#444444',
            color: inputVal.trim() && !isSubmitting ? 'var(--color-ink)' : 'var(--color-steel)',
            border: 'none',
            fontSize: 'var(--text-subheading)',
            fontWeight: 700,
            cursor: inputVal.trim() && !isSubmitting ? 'pointer' : isSubmitting ? 'wait' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'background var(--transition-fast), color var(--transition-fast)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSubmitting ? (
            <LoadingDots color={inputVal.trim() ? 'var(--color-ink)' : 'var(--color-paper)'} />
          ) : (
            <span
              className="tweak-arrow"
              style={{
                display: 'inline-block',
                transition: 'transform var(--transition-fast)',
              }}
            >
              →
            </span>
          )}
        </button>
      </form>

      <style>{`
        .tweak-submit-btn:not(:disabled):hover .tweak-arrow {
          transform: translateX(6px);
        }
        @keyframes tweakDotPulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.35;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        .loading-dots .dot {
          display: inline-block;
          animation: tweakDotPulse 1.4s infinite ease-in-out both;
        }
        .loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dots .dot:nth-child(3) { animation-delay: 0s; }
      `}</style>
    </div>
  );
}
