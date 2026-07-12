/* 
5. Persistent, accessible entry point — for after the banner's dismissed
Same idea as your tour's "Stuck later? Come back here" — install access shouldn't disappear forever just because someone closed a banner once. 
Drop this into your profile/topbar dropdown, next to "Replay tour":
*/

// src/components/pwa/InstallMenuItem.tsx
import { useState } from 'react';
import { usePwaInstall } from '@/hooks/pwa/usePwaInstall';

export default function InstallMenuItem() {
  const { canInstall, isIOSManual, isInstalled, promptInstall } = usePwaInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  if (isInstalled || (!canInstall && !isIOSManual)) return null;

  if (isIOSManual) {
    return (
      <div className="px-3 py-2">
        <button
          type="button"
          className="dropdown-item p-0 border-0 bg-transparent text-start"
          onClick={() => setShowIOSHint(v => !v)}
          aria-expanded={showIOSHint}
        >
          Install App
        </button>
        {showIOSHint && (
          <p className="text-muted mt-1 mb-0" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
            Tap the Share icon, then "Add to Home Screen".
          </p>
        )}
      </div>
    );
  }

  return (
    <button type="button" className="dropdown-item" onClick={() => promptInstall()}>
      Install App
    </button>
  );
}

