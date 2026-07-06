// import React, { useState } from 'react';
// import Sidebar from './Sidebar.tsx';
// import Topbar from './Topbar.tsx';
// import ImpersonationBanner from './ImpersonationBanner.tsx';

// export default function AppShell({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

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
//     </div>
//   );
// }



// v2
import React, { useState } from 'react';
import Sidebar from './Sidebar.tsx';
import Topbar from './Topbar.tsx';
import ImpersonationBanner from './ImpersonationBanner';

interface AppShellProps { children: React.ReactNode; }

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-wrapper" style={{ flexDirection:'column' }}>
      <ImpersonationBanner />
      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        <Sidebar show={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onMenuClick={() => setSidebarOpen(p => !p)} />
          <main className="page-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

