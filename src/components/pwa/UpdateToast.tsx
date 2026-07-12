// // src/components/pwa/UpdateToast.tsx
// /* 
// 6. Update notification — quiet, never forces a reload mid-session
// */
// import { useRegisterSW } from 'virtual:pwa-register/react';

// export default function UpdateToast() {
//   const {
//     needRefresh: [needRefresh, setNeedRefresh],
//     updateServiceWorker,
//   } = useRegisterSW({
//     onRegisteredSW(_url, registration) {
//       registration && setInterval(() => registration.update(), 60 * 60 * 1000); // hourly check, silent
//     },
//   });

//   if (!needRefresh) return null;

//   return (
//     <div
//       className="bg-white rounded-3 shadow-lg p-3"
//       style={{ position: 'fixed', bottom: 20, right: 20, maxWidth: 300, border: '1px solid rgba(0,0,0,0.08)', zIndex: 1500 }}
//       role="status"
//       aria-live="polite"
//     >
//       <div className="fw-semibold" style={{ fontSize: 13, fontFamily: 'var(--font-heading)' }}>Update available</div>
//       <p className="text-muted mb-2" style={{ fontSize: 12 }}>A new version of Stitch is ready.</p>
//       <button className="btn btn-sm btn-primary" style={{ fontSize: 12 }} onClick={() => updateServiceWorker(true)}>Refresh</button>
//       <button className="btn btn-sm btn-outline-secondary ms-2" style={{ fontSize: 12 }} onClick={() => setNeedRefresh(false)}>Later</button>
//     </div>
//   );
// }





// v2
// src/components/pwa/UpdateToast.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateToast() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates periodically while the app is open
      if (registration) {
        setInterval(() => { registration.update(); }, 60 * 60 * 1000); // hourly
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="bg-white rounded-3 shadow-lg p-3 d-flex align-items-center gap-3"
      style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2100, width: 'min(360px, 92vw)', border: '1px solid rgba(0,0,0,0.08)' }}
    >
      <i className="fas fa-rotate text-primary" />
      <div className="flex-1">
        <div className="fw-semibold" style={{ fontSize: 13 }}>Update available</div>
        <div className="text-muted" style={{ fontSize: 12 }}>A new version of Stitch is ready.</div>
      </div>
      <button className="btn btn-sm btn-primary" style={{ fontSize: 11 }} onClick={() => updateServiceWorker(true)}>Refresh</button>
    </div>
  );
}

