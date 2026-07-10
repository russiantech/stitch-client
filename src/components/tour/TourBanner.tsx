
// src/components/tour/TourBanner.tsx
import React from 'react';
import { useTour } from '@/context/TourContext.tsx';
import type { NavRole } from '@/utils/roles';

export default function TourBanner({ role }: { role: NavRole }) {
  const { bannerVisible, startTour, dismissBanner } = useTour();
  if (!bannerVisible) return null;

  return (
    <div
      className="bg-white rounded-3 shadow-lg p-3 d-flex align-items-center gap-3"
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1900, width: 'min(320px, 90vw)', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 36, height: 36, background: 'var(--primary)', color: '#fff' }}>
        <i className="fas fa-compass" />
      </div>
      <div className="flex-1">
        <div className="fw-semibold" style={{ fontSize: 13 }}>New here?</div>
        <div className="text-muted" style={{ fontSize: 12 }}>Take a 60-second tour of Stitch.</div>
      </div>
      <div className="d-flex flex-column gap-1">
        <button className="btn btn-sm btn-primary" style={{ fontSize: 11 }} onClick={() => startTour(role)}>Start</button>
        <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }} onClick={dismissBanner}>Skip</button>
      </div>
    </div>
  );
}
