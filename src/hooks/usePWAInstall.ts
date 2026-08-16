// // src/hooks/usePWAInstall.ts
// import { useEffect, useState, useCallback } from 'react';

// interface BeforeInstallPromptEvent extends Event {
//   prompt: () => Promise<void>;
//   userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
// }

// function isIos(): boolean {
//   return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
// }

// function isInStandaloneMode(): boolean {
//   return (
//     window.matchMedia('(display-mode: standalone)').matches ||
//     (window.navigator as any).standalone === true
//   );
// }

// export function usePWAInstall() {
//   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
//   const [installed, setInstalled] = useState(isInStandaloneMode());
//   const [dismissed, setDismissed] = useState(() => {
//     try { return sessionStorage.getItem('pwa_install_dismissed') === '1'; } catch { return false; }
//   });

//   useEffect(() => {
//     const onBeforeInstall = (e: Event) => {
//       e.preventDefault();
//       setDeferredPrompt(e as BeforeInstallPromptEvent);
//     };
//     const onInstalled = () => {
//       setInstalled(true);
//       setDeferredPrompt(null);
//     };
//     window.addEventListener('beforeinstallprompt', onBeforeInstall);
//     window.addEventListener('appinstalled', onInstalled);
//     return () => {
//       window.removeEventListener('beforeinstallprompt', onBeforeInstall);
//       window.removeEventListener('appinstalled', onInstalled);
//     };
//   }, []);

//   const canInstall = !installed && !dismissed && (!!deferredPrompt || isIos());
//   const isIosDevice = isIos();

//   const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
//     if (!deferredPrompt) return 'unavailable';
//     await deferredPrompt.prompt();
//     const { outcome } = await deferredPrompt.userChoice;
//     setDeferredPrompt(null);
//     return outcome;
//   }, [deferredPrompt]);

//   const dismiss = useCallback(() => {
//     setDismissed(true);
//     try { sessionStorage.setItem('pwa_install_dismissed', '1'); } catch { /* ignore */ }
//   }, []);

//   return { canInstall, isIosDevice, installed, promptInstall, dismiss, hasNativePrompt: !!deferredPrompt };
// }


// v2
// src/hooks/usePWAInstall.ts
import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// ── Module-level capture ──────────────────────────────────────────────
// beforeinstallprompt fires once, as soon as the browser decides the page
// is eligible — which can happen before Hero/FinalCTA have even mounted.
// Listening here, outside any component, means we capture it exactly
// once regardless of mount timing, and every usePWAInstall() call shares
// the same captured event instead of racing to attach its own listener.
let capturedPrompt: BeforeInstallPromptEvent | null = null;
let capturedInstalled = isInStandaloneMode();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    capturedInstalled = true;
    capturedPrompt = null;
    notify();
  });
}

export function usePWAInstall() {
  const [, forceRender] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('pwa_install_dismissed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    const onChange = () => forceRender((n) => n + 1);
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  const canInstall = !capturedInstalled && !dismissed && (!!capturedPrompt || isIos());
  const isIosDevice = isIos();

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!capturedPrompt) return 'unavailable';
    await capturedPrompt.prompt();
    const { outcome } = await capturedPrompt.userChoice;
    capturedPrompt = null;
    notify();
    return outcome;
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { sessionStorage.setItem('pwa_install_dismissed', '1'); } catch { /* ignore */ }
  }, []);

  return { canInstall, isIosDevice, installed: capturedInstalled, promptInstall, dismiss, hasNativePrompt: !!capturedPrompt };
}
