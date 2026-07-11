
// // v2
// import React, { useState } from 'react';
// import Sidebar from './Sidebar.tsx';
// import Topbar from './Topbar.tsx';
// import ImpersonationBanner from './ImpersonationBanner';

// interface AppShellProps { children: React.ReactNode; }

// export default function AppShell({ children }: AppShellProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   return (
//     <div className="app-wrapper" style={{ flexDirection:'column' }}>
//       <ImpersonationBanner />
//       <div style={{ display:'flex', flex:1, minHeight:0 }}>
//         <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//         <div className="main-content">
//           <Topbar onMenuClick={() => setSidebarOpen(p => !p)} />
//           <main className="page-content">{children}</main>
//         </div>
//       </div>
//     </div>
//   );
// }



// // v3
// // src/components/layouts/AppShell.tsx
// import React, { useState, useEffect } from 'react';
// import Sidebar from './Sidebar.tsx';
// import Topbar from './Topbar.tsx';
// import ImpersonationBanner from './ImpersonationBanner';
// import { TourProvider, useTour, hasTourCompleted } from '@/context/TourContext.tsx';
// import TourOverlay from '@/components/tour/TourOverlay.tsx';
// import TourButton from '@/components/tour/TourButton.tsx';
// import { useAuth } from '@/context/AuthContext.tsx';
// import { getNavRole } from '@/utils/roles.ts';

// interface AppShellProps { children: React.ReactNode; }

// function AutoStartTour() {
//   const { user, isAdmin } = useAuth();
//   const { startTour } = useTour();
//   const role = getNavRole(user, isAdmin);

//   useEffect(() => {
//     if (!user) return;
//     if (!hasTourCompleted(role)) {
//       const t = setTimeout(() => startTour(role), 600);
//       return () => clearTimeout(t);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user?.id, role]);

//   return null;
// }

// function ShellBody({ children }: AppShellProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const { user, isAdmin } = useAuth();
//   const { active } = useTour();
//   const role = getNavRole(user, isAdmin);

//   // Force the sidebar open during the tour on small screens, since tour
//   // steps point at nav items that are off-canvas when the sidebar is closed.
//   useEffect(() => {
//     if (active && typeof window !== 'undefined' && window.innerWidth < 992) {
//       setSidebarOpen(true);
//     }
//   }, [active]);

//   return (
//     <div className="app-wrapper" style={{ flexDirection: 'column' }}>
//       <ImpersonationBanner />
//       <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
//         <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//         <div className="main-content">
//           <Topbar onMenuClick={() => setSidebarOpen(p => !p)} />
//           <main className="page-content">{children}</main>
//         </div>
//       </div>
//       <AutoStartTour />
//       <TourOverlay />
//       <TourButton role={role} />
//     </div>
//   );
// }

// export default function AppShell({ children }: AppShellProps) {
//   return (
//     <TourProvider>
//       <ShellBody>{children}</ShellBody>
//     </TourProvider>
//   );
// }





// v3
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.tsx';
import Topbar from './Topbar.tsx';
import ImpersonationBanner from './ImpersonationBanner';
import { TourProvider, useTour, triggerBannerCheck } from '@/context/TourContext.tsx';
import TourOverlay from '@/components/tour/TourOverlay.tsx';
import TourButton from '@/components/tour/TourButton.tsx';
import TourBanner from '@/components/tour/TourBanner.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { getNavRole } from '@/utils/roles';

interface AppShellProps { children: React.ReactNode; }

function BannerTrigger() {
  const { user, isAdmin } = useAuth();
  const role = getNavRole(user, isAdmin);
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => triggerBannerCheck(role), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);
  return null;
}
/*
function ShellBody({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { active } = useTour();
  const role = getNavRole(user, isAdmin);

  useEffect(() => {
    if (active && typeof window !== 'undefined' && window.innerWidth < 992) {
      setSidebarOpen(true);
    }
  }, [active]);

  return (
    <div className="app-wrapper" style={{ flexDirection: 'column' }}>
      <ImpersonationBanner />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(p => !p)} />
          <main className="page-content">{children}</main>
        </div>
      </div>
      <BannerTrigger />
      <TourOverlay />
      <TourButton role={role} />
      <TourBanner role={role} />
    </div>
  );
}

*/

// AppShell.tsx — ShellBody, corrected
function ShellBody({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { active, steps, stepIndex } = useTour();
  const role = getNavRole(user, isAdmin);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 992) return;
    if (!active) { setSidebarOpen(false); return; }
    const target = steps[stepIndex]?.target ?? '';
    const isSidebarTarget = target.startsWith('nav-') || target === 'sidebar-brand' || target === 'sidebar-logout';
    setSidebarOpen(isSidebarTarget);
  }, [active, stepIndex, steps]);

  return (
    <div className="app-wrapper" style={{ flexDirection: 'column' }}>
      <ImpersonationBanner />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(p => !p)} />
          <main className="page-content">{children}</main>
        </div>
      </div>
      <BannerTrigger />
      <TourOverlay />
      <TourButton role={role} />
      <TourBanner role={role} />
    </div>
  );
}


export default function AppShell({ children }: AppShellProps) {
  return (
    <TourProvider>
      <ShellBody>{children}</ShellBody>
    </TourProvider>
  );
}

