import React from 'react';
import { useTour } from '@/context/TourContext.tsx';
import type { NavRole } from '@/utils/roles.ts';

export default function TourButton({ role }: { role: NavRole }) {
  const { startTour, active } = useTour();
  if (active) return null;
  return (
    <button
      data-tour="tour-help-button"
      onClick={() => startTour(role)}
      className="btn shadow-lg d-flex align-items-center justify-content-center"
      title="Replay walkthrough"
      aria-label="Replay walkthrough"
      style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1500, width: 46, height: 46, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: 'none' }}
    >
      <i className="fas fa-question" style={{ fontSize: 16 }} />
    </button>
  );
}

