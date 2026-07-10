// import React, { useEffect, useState, useLayoutEffect } from 'react';
// import { useTour } from '@/context/TourContext.tsx';

// function useTargetRect(selector: string, active: boolean) {
//   const [rect, setRect] = useState<DOMRect | null>(null);

//   useLayoutEffect(() => {
//     if (!active || !selector) return;
//     const update = () => {
//       const el = document.querySelector(`[data-tour="${selector}"]`);
//       setRect(el ? el.getBoundingClientRect() : null);
//     };
//     update();
//     window.addEventListener('resize', update);
//     window.addEventListener('scroll', update, true);
//     const t = setInterval(update, 300); // catches layout shifts (sidebar open/close, etc.)
//     return () => {
//       window.removeEventListener('resize', update);
//       window.removeEventListener('scroll', update, true);
//       clearInterval(t);
//     };
//   }, [selector, active]);

//   return rect;
// }

// export default function TourOverlay() {
//   const { active, stepIndex, steps, next, back, skip, finish } = useTour();
//   const step = steps[stepIndex];
//   const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
//   const rect = useTargetRect(step?.target ?? '', active);

//   useEffect(() => {
//     if (active && step) {
//       document.querySelector(`[data-tour="${step.target}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
//     }
//   }, [active, step]);

//   if (!active || !step) return null;

//   const isLast = stepIndex === steps.length - 1;
//   const useCenteredCard = isMobile || !rect;

//   const cardStyle: React.CSSProperties = useCenteredCard
//     ? { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', width: 'min(340px, 92vw)', zIndex: 2001 }
//     : (() => {
//         const placement = step.placement ?? 'right';
//         const gap = 14;
//         const base: React.CSSProperties = { position: 'fixed', zIndex: 2001, width: 280 };
//         if (placement === 'right') return { ...base, top: rect.top, left: rect.right + gap };
//         if (placement === 'left') return { ...base, top: rect.top, left: Math.max(12, rect.left - 280 - gap) };
//         if (placement === 'top') return { ...base, top: Math.max(12, rect.top - gap), left: rect.left, transform: 'translateY(-100%)' };
//         return { ...base, top: rect.bottom + gap, left: rect.left };
//       })();

//   return (
//     <>
//       <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 2000 }} onClick={skip} />

//       {rect && !useCenteredCard && (
//         <div
//           style={{
//             position: 'fixed',
//             top: rect.top - 6, left: rect.left - 6,
//             width: rect.width + 12, height: rect.height + 12,
//             borderRadius: 10,
//             boxShadow: '0 0 0 4px var(--primary), 0 0 0 9999px rgba(15,23,42,0.45)',
//             zIndex: 2000,
//             transition: 'all 0.25s ease',
//             pointerEvents: 'none',
//           }}
//         />
//       )}

//       <div className="bg-white rounded-3 shadow-lg p-3" style={{ ...cardStyle, border: '1px solid rgba(0,0,0,0.08)' }} role="dialog" aria-live="polite">
//         <div className="d-flex justify-content-between align-items-start mb-2">
//           <div className="fw-semibold" style={{ fontSize: 14, fontFamily: 'var(--font-heading)' }}>{step.title}</div>
//           <button className="btn-close" style={{ fontSize: 10 }} onClick={skip} aria-label="Close tour" />
//         </div>
//         <p className="text-muted mb-3" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{step.content}</p>
//         <div className="d-flex align-items-center justify-content-between">
//           <span className="text-muted" style={{ fontSize: 11 }}>{stepIndex + 1} / {steps.length}</span>
//           <div className="d-flex gap-2">
//             {stepIndex > 0 && <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12 }} onClick={back}>Back</button>}
//             <button className="btn btn-sm btn-primary" style={{ fontSize: 12 }} onClick={isLast ? finish : next}>
//               {isLast ? 'Done' : 'Next'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }





// v2
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '@/context/TourContext.tsx';

function useTargetRect(selector: string, watchKey: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!selector) return;
    setRect(null);
    let tries = 0;
    const update = () => {
      const el = document.querySelector(`[data-tour="${selector}"]`);
      if (el) setRect(el.getBoundingClientRect());
      tries += 1;
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
    // watchKey forces a re-run when the step (and possibly route) changes
  }, [selector, watchKey]);

  return rect;
}

export default function TourOverlay() {
  const { active, stepIndex, steps, next, back, skip, finish } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const step = steps[stepIndex];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Navigate to the step's page first, if it's elsewhere.
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

  if (!active || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const waitingForNav = !sameRoute;
  const useCenteredCard = isMobile || !rect || waitingForNav;

  const cardStyle: React.CSSProperties = useCenteredCard
    ? { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', width: 'min(340px, 92vw)', zIndex: 2001 }
    : (() => {
        const placement = step.placement ?? 'right';
        const gap = 14;
        const base: React.CSSProperties = { position: 'fixed', zIndex: 2001, width: 280 };
        if (placement === 'right') return { ...base, top: rect!.top, left: rect!.right + gap };
        if (placement === 'left') return { ...base, top: rect!.top, left: Math.max(12, rect!.left - 280 - gap) };
        if (placement === 'top') return { ...base, top: Math.max(12, rect!.top - gap), left: rect!.left, transform: 'translateY(-100%)' };
        return { ...base, top: rect!.bottom + gap, left: rect!.left };
      })();

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

      <div className="bg-white rounded-3 shadow-lg p-3" style={{ ...cardStyle, border: '1px solid rgba(0,0,0,0.08)' }} role="dialog" aria-live="polite">
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

