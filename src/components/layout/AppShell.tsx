// v3
// src/components/layout/AppShell.tsx
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
import InstallBanner from '../pwa/InstallBanner.tsx';
import UpdateToast from '../pwa/UpdateToast.tsx';

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
      <InstallBanner />
      {/* <UpdateToast /> - Because it's already being called/rendered in the App.tsx globally */}

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

