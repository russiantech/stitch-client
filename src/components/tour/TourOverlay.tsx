import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '@/context/TourContext.tsx';

function useTargetRect(selector: string, watchKey: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!selector) return;
    setRect(null);
    const update = () => {
      const el = document.querySelector(`[data-tour="${selector}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    const poll = setInterval(update, 200);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearInterval(poll);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [selector, watchKey]);
  return rect;
}

const CARD_WIDTH = 280;
const VIEWPORT_MARGIN = 12;

export default function TourOverlay() {
  const { active, stepIndex, steps, next, back, skip, finish } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const step = steps[stepIndex];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!active || !step?.path) return;
    if (location.pathname !== step.path) navigate(step.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  const sameRoute = !step?.path || location.pathname === step.path;
  const rect = useTargetRect(sameRoute ? (step?.target ?? '') : '', `${stepIndex}-${location.pathname}`);

  useEffect(() => {
    if (active && step && sameRoute) {
      document.querySelector(`[data-tour="${step.target}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [active, step, sameRoute, rect]);

  const isLast = stepIndex === steps.length - 1;
  const waitingForNav = !sameRoute;
  const useCenteredCard = isMobile || !rect || waitingForNav;

  const rawStyle: React.CSSProperties | null = useCenteredCard || !rect
    ? null
    : (() => {
        const placement = step!.placement ?? 'right';
        const gap = 14;
        if (placement === 'right') return { top: rect.top, left: rect.right + gap };
        if (placement === 'left') return { top: rect.top, left: rect.left - CARD_WIDTH - gap };
        if (placement === 'top') return { top: rect.top - gap, left: rect.left, transform: 'translateY(-100%)' };
        return { top: rect.bottom + gap, left: rect.left };
      })();

  // Clamp the computed position within the viewport once the card has
  // actually rendered and we know its real height (fixes cases like the
  // notification bell, near the top-right corner, pushing the card
  // off-screen to the right or top).
  useLayoutEffect(() => {
    if (!rawStyle || !cardRef.current) { setClamped(null); return; }
    const cardEl = cardRef.current;
    const height = cardEl.offsetHeight || 160;
    let top = typeof rawStyle.top === 'number' ? rawStyle.top : 0;
    let left = typeof rawStyle.left === 'number' ? rawStyle.left : 0;
    const isTranslatedUp = rawStyle.transform === 'translateY(-100%)';
    const effectiveTop = isTranslatedUp ? top - height : top;

    if (left + CARD_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    if (effectiveTop + height > window.innerHeight - VIEWPORT_MARGIN) {
      top = window.innerHeight - height - VIEWPORT_MARGIN + (isTranslatedUp ? height : 0);
    }
    if (effectiveTop < VIEWPORT_MARGIN) {
      top = VIEWPORT_MARGIN + (isTranslatedUp ? height : 0);
    }

    setClamped({ top, left });
  }, [rawStyle?.top, rawStyle?.left, rect]);

  if (!active || !step) return null;

  const cardStyle: React.CSSProperties = useCenteredCard
    ? { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', width: 'min(340px, 92vw)', zIndex: 2001 }
    : {
        position: 'fixed',
        zIndex: 2001,
        width: CARD_WIDTH,
        top: clamped?.top ?? rawStyle?.top ?? 0,
        left: clamped?.left ?? rawStyle?.left ?? 0,
        transform: clamped ? undefined : rawStyle?.transform,
      };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 2000 }} onClick={skip} />

      {rect && !useCenteredCard && (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 4px var(--primary), 0 0 0 9999px rgba(15,23,42,0.45)',
            zIndex: 2000,
            transition: 'all 0.25s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      <div ref={cardRef} className="bg-white rounded-3 shadow-lg p-3" style={{ ...cardStyle, border: '1px solid rgba(0,0,0,0.08)' }} role="dialog" aria-live="polite">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="fw-semibold" style={{ fontSize: 14, fontFamily: 'var(--font-heading)' }}>{step.title}</div>
          <button className="btn-close" style={{ fontSize: 10 }} onClick={skip} aria-label="Close tour" />
        </div>
        <p className="text-muted mb-3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {waitingForNav ? 'Taking you there…' : step.content}
        </p>
        <div className="d-flex align-items-center justify-content-between">
          <span className="text-muted" style={{ fontSize: 11 }}>{stepIndex + 1} / {steps.length}</span>
          <div className="d-flex gap-2">
            {stepIndex > 0 && <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12 }} onClick={back} disabled={waitingForNav}>Back</button>}
            <button className="btn btn-sm btn-primary" style={{ fontSize: 12 }} onClick={isLast ? finish : next} disabled={waitingForNav}>
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
