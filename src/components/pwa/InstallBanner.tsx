// /* 
// 4. Install banner — shown once, quiet, dismissible for good
// Styled to match the card language TourOverlay already uses (bg-white rounded-3 shadow-lg, var(--font-heading), var(--primary)), 
// positioned bottom-left so it never competes with the tour card (bottom-center) or the update toast (bottom-right, below):
// */
// // src/components/pwa/InstallBanner.tsx

// v3
// src/components/pwa/InstallBanner.tsx
import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall.ts';
import { useTour, hasTourCompleted, hasTourBannerBeenSeen } from '@/context/TourContext.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { getNavRole } from '@/utils/roles';

export default function InstallBanner() {
  const { canInstall, isIosDevice, hasNativePrompt, promptInstall, dismiss } = usePWAInstall();
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  const { user, isAdmin } = useAuth();
  const role = getNavRole(user, isAdmin);
  const { active: tourActive, bannerVisible: tourBannerVisible } = useTour();

  // Only show the install prompt once the onboarding tour is fully out of
  // the way — either the user has seen/dismissed the tour banner, or has
  // actually completed the tour. Prevents two bottom-corner banners from
  // competing for attention on a brand-new user's very first load.
  const [tourGateCleared, setTourGateCleared] = useState(false);

  useEffect(() => {
    if (tourActive || tourBannerVisible) {
      setTourGateCleared(false);
      return;
    }
    const cleared = hasTourCompleted(role) || hasTourBannerBeenSeen(role);
    if (cleared) {
      // small delay so it doesn't pop in the instant the tour banner fades
      const t = setTimeout(() => setTourGateCleared(true), 800);
      return () => clearTimeout(t);
    }
  }, [tourActive, tourBannerVisible, role]);

  if (!canInstall || !tourGateCleared) return null;

  const handleInstallClick = async () => {
    if (isIosDevice && !hasNativePrompt) {
      setShowIosInstructions(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <div
        className="bg-white rounded-3 shadow-lg p-3 d-flex align-items-center gap-3"
        style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1900, width: 'min(340px, 90vw)', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-3" style={{ width: 44, height: 44, background: 'var(--primary)' }}>
          <i className="fas fa-mobile-screen-button text-white" style={{ fontSize: 18 }} />
        </div>
        <div className="flex-1">
          <div className="fw-semibold" style={{ fontSize: 13 }}>Install Stitch</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Add to your home screen for quick, app-like access.</div>
        </div>
        <div className="d-flex flex-column gap-1 flex-shrink-0">
          <button className="btn btn-sm btn-primary" style={{ fontSize: 11 }} onClick={handleInstallClick}>Install</button>
          <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }} onClick={dismiss}>Not now</button>
        </div>
      </div>

      {showIosInstructions && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">Install on iPhone/iPad</h6>
                <button className="btn-close" onClick={() => setShowIosInstructions(false)} />
              </div>
              <div className="modal-body">
                <ol className="ps-3 mb-0" style={{ fontSize: 13, lineHeight: 1.9 }}>
                  <li>Tap the <i className="fas fa-arrow-up-from-bracket mx-1" /> Share button in Safari's toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary btn-sm w-100" onClick={() => { setShowIosInstructions(false); dismiss(); }}>Got it</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
