import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import ImpersonationBanner from './ImpersonationBanner.jsx';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
}
