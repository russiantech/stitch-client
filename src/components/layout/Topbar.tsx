// // src/components/layouts/Topbar.tsx

// import React, { useState, useRef, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext.tsx';
// import { useAppData } from '../../context/AppDataContext.tsx';
// import type { AppNotification } from '@/types/index.ts';
// import { useTour } from '@/context/TourContext.tsx';
// import { getNavRole } from '@/utils/roles';

// const PAGE_TITLES: Record<string, string> = {
//   '/dashboard':'Dashboard','/orders':'My Orders','/orders/new':'Create Order',
//   '/fashion/new':'Fashion Request','/payments':'Payments & Invoices',
//   '/addresses':'Saved Addresses','/profile':'Profile & Settings',
//   '/subscriptions':'My Subscriptions',
//   '/ops':'Operations Dashboard','/ops/laundry':'Laundry Orders',
//   '/ops/fashion':'Fashion Orders','/ops/pickups':'Pickups','/ops/deliveries':'Deliveries',
//   '/fashion-catalog':'Fashion Catalog','/crm':'CRM — Customers',
//   '/inventory':'Inventory','/billing':'Billing & Payments','/analytics':'Analytics & Reports',
//   '/admin/users':'User Management','/admin/plans':'Plans Management',
//   '/admin/pricing':'Pricing Settings','/admin/usage':'Usage Recording',
//   '/staff':'Staff Portal','/driver':'Driver Portal',
// };

// const TYPE_ICONS: Record<string, string> = {
//   order:'fa-box', subscription:'fa-layer-group', payment:'fa-credit-card',
//   system:'fa-bell', delivery:'fa-truck', loyalty:'fa-star',
// };

// function NotifDropdown({ notifications, unreadCount, onRead, onReadAll, onClose }:{
//   notifications: AppNotification[];
//   unreadCount: number;
//   onRead:(id:number)=>void;
//   onReadAll:()=>void;
//   onClose:()=>void;
// }) {
//   return (
//     <div className="bg-white rounded-3 shadow-lg border"
//       style={{ position:'absolute',top:'calc(100% + 8px)',right:0,width:320,zIndex:1050 }}>
//       <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
//         <span className="fw-semibold small">Notifications</span>
//         <div className="d-flex gap-2 align-items-center">
//           {unreadCount > 0 && (
//             <button className="btn btn-link btn-sm p-0 text-primary" style={{fontSize:11}} onClick={onReadAll}>
//               Mark all read
//             </button>
//           )}
//           <button className="btn-close" onClick={onClose} style={{fontSize:10}} />
//         </div>
//       </div>
//       <div style={{maxHeight:360,overflowY:'auto'}}>
//         {notifications.length === 0
//           ? <div className="text-center py-4 text-muted small">No notifications</div>
//           : notifications.slice(0,8).map(n => (
//             <div key={n.id}
//               className={`px-3 py-2 border-bottom d-flex gap-2 align-items-start ${!n.is_read?'bg-primary bg-opacity-5':''}`}
//               style={{cursor:'pointer'}} onClick={() => !n.is_read && onRead(typeof n.id === 'string' ? Number(n.id) : n.id)}>
//               <div className="mt-1 flex-shrink-0" style={{width:18}}>
//                 <i className={`fas ${TYPE_ICONS[n.type]??'fa-bell'} text-primary`} style={{fontSize:12}} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="fw-medium" style={{fontSize:12}}>{n.title}</div>
//                 <div className="text-muted text-truncate" style={{fontSize:11}}>{n.message}</div>
//                 <div className="text-muted" style={{fontSize:10}}>
//                   {new Date(n.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}
//                 </div>
//               </div>
//               {!n.is_read && (
//                 <div className="rounded-circle flex-shrink-0"
//                   style={{width:7,height:7,marginTop:4,background:'var(--primary)'}} />
//               )}
//             </div>
//           ))
//         }
//       </div>
//     </div>
//   );
// }

// // function ProfileDropdown({ name, email, role, onSignOut, onClose }:{
// //   name:string; email:string; role:string;
// //   onSignOut:()=>void; onClose:()=>void;
// // }) {
// // v2
// function ProfileDropdown({ name, email, role, onSignOut, onReplayTour, onClose }: {
//   name: string; email: string; role: string;
//   onSignOut: () => void; onReplayTour: () => void; onClose: () => void;
// }) {
//   const navigate = useNavigate();
//   const go = (p: string) => { navigate(p); onClose(); };
//   const links = [
//     {icon:'fa-gauge',      label:'Dashboard',        path:'/dashboard'},
//     {icon:'fa-box',        label:'My Orders',         path:'/orders'},
//     {icon:'fa-layer-group',label:'My Subscriptions',  path:'/subscriptions'},
//     {icon:'fa-credit-card',label:'Payments',          path:'/payments'},
//     {icon:'fa-user',       label:'Profile & Settings',path:'/profile'},
//     {icon:'fa-map-marker-alt',label:'Addresses',      path:'/addresses'},
//   ];
//   return (
//     <div className="bg-white rounded-3 shadow-lg border"
//       style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:220,zIndex:1050}}>
//       <div className="px-3 py-3 border-bottom">
//         <div className="d-flex align-items-center gap-2">
//           <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
//             style={{width:36,height:36,fontSize:14,background:'var(--primary)'}}>
//             {name.charAt(0)}
//           </div>
//           <div className="min-w-0">
//             <div className="fw-semibold text-truncate" style={{fontSize:13}}>{name}</div>
//             <div className="text-muted text-truncate" style={{fontSize:11}}>{email}</div>
//             <span className="badge" style={{fontSize:9,background:'var(--primary)'}}>{role}</span>
//           </div>
//         </div>
//       </div>
//       <div className="py-1">
//         {links.map(l => (
//           <button key={l.path}
//             className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
//             style={{fontSize:13,borderRadius:0}} onClick={() => go(l.path)}>
//             <i className={`fas ${l.icon} text-muted`} style={{width:16,fontSize:12}} />{l.label}
//           </button>
//         ))}
//       </div>

//       <div className="border-top py-1">
//         <button
//           className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
//           style={{ fontSize: 13, borderRadius: 0 }}
//           onClick={() => { onReplayTour(); onClose(); }}
//         >
//           <i className="fas fa-route text-muted" style={{ width: 16, fontSize: 12 }} />Replay Walkthrough
//         </button>
//       </div>

//       <div className="border-top py-1">
//         <button className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-danger"
//           style={{fontSize:13}} onClick={onSignOut}>
//           <i className="fas fa-sign-out-alt" style={{width:16,fontSize:12}} />Sign Out
//         </button>
//       </div>

//       <>
      
//       </>

//     </div>
//   );
// }

// export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
//   const location = useLocation();
//   // const { user, signOut } = useAuth();
//   const { user, signOut, isAdmin } = useAuth();
//   const { startTour } = useTour();
//   const role = getNavRole(user, isAdmin);

//   const { notifications, unreadCount, markNotificationRead, markAllRead } = useAppData();
//   const navigate = useNavigate();
//   const [showNotifs,  setShowNotifs]  = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const notifsRef  = useRef<HTMLDivElement>(null);
//   const profileRef = useRef<HTMLDivElement>(null);
//   const title = PAGE_TITLES[location.pathname] ?? 'Stitch';

//   useEffect(() => {
//     const h = (e: MouseEvent) => {
//       if (notifsRef.current  && !notifsRef.current.contains(e.target as Node))  setShowNotifs(false);
//       if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
//     };
//     document.addEventListener('mousedown', h);
//     return () => document.removeEventListener('mousedown', h);
//   }, []);

//   const handleSignOut = async () => { await signOut(); navigate('/signin'); };

//   return (
//     <header className="sl-topbar">
//       <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={onMenuClick}>
//         <i className="fas fa-bars" />
//       </button>
//       <div className="me-auto">
//         <h6 className="mb-0 fw-semibold" style={{fontFamily:'var(--font-heading)'}}>{title}</h6>
//       </div>
//       <div className="d-flex align-items-center gap-2">
//         {/* Notifications */}
//         <div ref={notifsRef} style={{position:'relative'}}>
//           <button data-tour="topbar-notifications" className="btn btn-sm btn-outline-secondary position-relative"
//             onClick={() => { setShowNotifs(p=>!p); setShowProfile(false); }}>
//             <i className="fas fa-bell" />
//             {unreadCount > 0 && (
//               <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
//                 style={{fontSize:9}}>{unreadCount > 9 ? '9+' : unreadCount}</span>
//             )}
//           </button>
//           {showNotifs && (
//             <NotifDropdown
//               notifications={notifications} unreadCount={unreadCount}
//               onRead={markNotificationRead} onReadAll={markAllRead}
//               onClose={() => setShowNotifs(false)}
//             />
//           )}
//         </div>
//         {/* Profile */}
//         <div ref={profileRef} style={{position:'relative'}}>
//           <button data-tour="topbar-profile" className="btn btn-sm d-flex align-items-center gap-2" style={{padding:'4px 8px'}}
//             onClick={() => { setShowProfile(p=>!p); setShowNotifs(false); }}>
//             <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
//               style={{width:30,height:30,fontSize:12,flexShrink:0,background:'var(--primary)'}}>
//               {user?.names?.charAt(0)?.toUpperCase() ?? 'U'}
//             </div>
//             <span className="d-none d-sm-inline fw-medium" style={{fontSize:13}}>
//               {user?.names?.split(' ')[0] ?? 'User'}
//             </span>
//             <i className="fas fa-chevron-down d-none d-sm-inline text-muted" style={{fontSize:9}} />
//           </button>
//           {/* {showProfile && user && (
//             <ProfileDropdown
//               name={user.names} email={user.email} role={user.roles?.[0] ?? 'User'}
//               onSignOut={handleSignOut} onClose={() => setShowProfile(false)} onReplayTour={function (): void {
//                 throw new Error('Function not implemented.');
//               } }            />
//           )} */}

//           {showProfile && user && (
//             <ProfileDropdown
//               name={user.names} email={user.email} role={user.roles?.[0] ?? 'User'}
//               onSignOut={handleSignOut}
//               onReplayTour={() => startTour(role)}
//               onClose={() => setShowProfile(false)}
//             />
//           )}

//         </div>
//       </div>
//     </header>
//   );
// }




// // v2
// import { useIsNarrowViewport } from '@/hooks/useIsNarrowViewport.ts';
// import { AppNotification } from '@/types';
// import { useNavigate } from 'react-router-dom';

// function useDropdownStyle(desktopWidth: number): React.CSSProperties {
//   const narrow = useIsNarrowViewport();
//   return narrow
//     ? { position: 'fixed', top: 64, left: 12, right: 12, width: 'auto', zIndex: 1050 }
//     : { position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: desktopWidth, zIndex: 1050 };
// }

// function NotifDropdown({ notifications, unreadCount, onRead, onReadAll, onClose }: {
//   notifications: AppNotification[];
//   unreadCount: number;
//   onRead: (id: number) => void;
//   onReadAll: () => void;
//   onClose: () => void;
// }) {
//   const style = useDropdownStyle(320);
//   return (
//     <div className="bg-white rounded-3 shadow-lg border" style={style}>
//       <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
//         <span className="fw-semibold small">Notifications</span>
//         <div className="d-flex gap-2 align-items-center">
//           {unreadCount > 0 && (
//             <button className="btn btn-link btn-sm p-0 text-primary" style={{ fontSize: 11 }} onClick={onReadAll}>
//               Mark all read
//             </button>
//           )}
//           <button className="btn-close" onClick={onClose} style={{ fontSize: 10 }} />
//         </div>
//       </div>
//       <div style={{ maxHeight: 360, overflowY: 'auto' }}>
//         {notifications.length === 0
//           ? <div className="text-center py-4 text-muted small">No notifications</div>
//           : notifications.slice(0, 8).map(n => (
//             <div key={n.id}
//               className={`px-3 py-2 border-bottom d-flex gap-2 align-items-start ${!n.is_read ? 'bg-primary bg-opacity-5' : ''}`}
//               style={{ cursor: 'pointer' }} onClick={() => !n.is_read && onRead(n.id)}>
//               <div className="mt-1 flex-shrink-0" style={{ width: 18 }}>
//                 <i className={`fas ${TYPE_ICONS[n.type] ?? 'fa-bell'} text-primary`} style={{ fontSize: 12 }} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="fw-medium" style={{ fontSize: 12 }}>{n.title}</div>
//                 <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{n.message}</div>
//                 <div className="text-muted" style={{ fontSize: 10 }}>
//                   {new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
//                 </div>
//               </div>
//               {!n.is_read && (
//                 <div className="rounded-circle flex-shrink-0" style={{ width: 7, height: 7, marginTop: 4, background: 'var(--primary)' }} />
//               )}
//             </div>
//           ))
//         }
//       </div>
//     </div>
//   );
// }

// function ProfileDropdown({ name, email, role, onSignOut, onReplayTour, onClose }: {
//   name: string; email: string; role: string;
//   onSignOut: () => void; onReplayTour: () => void; onClose: () => void;
// }) {
//   const navigate = useNavigate();
//   const style = useDropdownStyle(220);
//   const go = (p: string) => { navigate(p); onClose(); };
//   const links = [
//     { icon: 'fa-gauge', label: 'Dashboard', path: '/dashboard' },
//     { icon: 'fa-box', label: 'My Orders', path: '/orders' },
//     { icon: 'fa-layer-group', label: 'My Subscriptions', path: '/subscriptions' },
//     { icon: 'fa-credit-card', label: 'Payments', path: '/payments' },
//     { icon: 'fa-user', label: 'Profile & Settings', path: '/profile' },
//     { icon: 'fa-map-marker-alt', label: 'Addresses', path: '/addresses' },
//   ];
//   return (
//     <div className="bg-white rounded-3 shadow-lg border" style={style}>
//       <div className="px-3 py-3 border-bottom">
//         <div className="d-flex align-items-center gap-2">
//           <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
//             style={{ width: 36, height: 36, fontSize: 14, background: 'var(--primary)' }}>
//             {name.charAt(0)}
//           </div>
//           <div className="min-w-0">
//             <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{name}</div>
//             <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{email}</div>
//             <span className="badge" style={{ fontSize: 9, background: 'var(--primary)' }}>{role}</span>
//           </div>
//         </div>
//       </div>
//       <div className="py-1">
//         {links.map(l => (
//           <button key={l.path}
//             className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
//             style={{ fontSize: 13, borderRadius: 0 }} onClick={() => go(l.path)}>
//             <i className={`fas ${l.icon} text-muted`} style={{ width: 16, fontSize: 12 }} />{l.label}
//           </button>
//         ))}
//       </div>
//       <div className="border-top py-1">
//         <button
//           className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
//           style={{ fontSize: 13, borderRadius: 0 }}
//           onClick={() => { onReplayTour(); onClose(); }}
//         >
//           <i className="fas fa-route text-muted" style={{ width: 16, fontSize: 12 }} />Replay Walkthrough
//         </button>
//       </div>
//       <div className="border-top py-1">
//         <button
//           className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-danger"
//           style={{ fontSize: 13 }} onClick={onSignOut}>
//           <i className="fas fa-sign-out-alt" style={{ width: 16, fontSize: 12 }} />Sign Out
//         </button>
//       </div>
//     </div>
//   );
// }







// v3
// src/components/layouts/Topbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useAppData } from '../../context/AppDataContext.tsx';
import { useTour } from '@/context/TourContext.tsx';
import { getNavRole } from '@/utils/roles.ts';
import { useIsNarrowViewport } from '@/hooks/useIsNarrowViewport.ts';
import type { AppNotification } from '@/types/index.ts';
import { usePWAInstall } from '@/hooks/usePWAInstall.ts';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/orders': 'My Orders', '/orders/new': 'Create Order',
  '/fashion/new': 'Fashion Request', '/payments': 'Payments & Invoices',
  '/addresses': 'Saved Addresses', '/profile': 'Profile & Settings',
  '/subscriptions': 'My Subscriptions',
  '/ops': 'Operations Dashboard', '/ops/laundry': 'Laundry Orders',
  '/ops/fashion': 'Fashion Orders', '/ops/pickups': 'Pickups', '/ops/deliveries': 'Deliveries',
  '/fashion-catalog': 'Fashion Catalog', '/crm': 'CRM — Customers',
  '/inventory': 'Inventory', '/billing': 'Billing & Payments', '/analytics': 'Analytics & Reports',
  '/admin/users': 'User Management', '/admin/plans': 'Plans Management',
  '/admin/pricing': 'Pricing Settings', '/admin/usage': 'Usage Recording',
  '/staff': 'Staff Portal', '/driver': 'Driver Portal',
  '/orgs/settings': 'Organization Settings', '/orgs/payouts': 'Payout Settings',
};

const TYPE_ICONS: Record<string, string> = {
  order: 'fa-box', subscription: 'fa-layer-group', payment: 'fa-credit-card',
  system: 'fa-bell', delivery: 'fa-truck', loyalty: 'fa-star',
};

function useDropdownStyle(desktopWidth: number): React.CSSProperties {
  const narrow = useIsNarrowViewport();
  return narrow
    ? { position: 'fixed', top: 64, left: 12, right: 12, width: 'auto', zIndex: 1050 }
    : { position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: desktopWidth, zIndex: 1050 };
}

function NotifDropdown({ notifications, unreadCount, onRead, onReadAll, onClose }: {
  notifications: AppNotification[];
  unreadCount: number;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onClose: () => void;
}) {
  const style = useDropdownStyle(320);
  return (
    <div className="bg-white rounded-3 shadow-lg border" style={style}>
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
        <span className="fw-semibold small">Notifications</span>
        <div className="d-flex gap-2 align-items-center">
          {unreadCount > 0 && (
            <button className="btn btn-link btn-sm p-0 text-primary" style={{ fontSize: 11 }} onClick={onReadAll}>
              Mark all read
            </button>
          )}
          <button className="btn-close" onClick={onClose} style={{ fontSize: 10 }} />
        </div>
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0
          ? <div className="text-center py-4 text-muted small">No notifications</div>
          : notifications.slice(0, 8).map(n => (
            <div key={n.id}
              className={`px-3 py-2 border-bottom d-flex gap-2 align-items-start ${!n.is_read ? 'bg-primary bg-opacity-5' : ''}`}
              style={{ cursor: 'pointer' }} onClick={() => !n.is_read && onRead(n.id)}>
              <div className="mt-1 flex-shrink-0" style={{ width: 18 }}>
                <i className={`fas ${TYPE_ICONS[n.type] ?? 'fa-bell'} text-primary`} style={{ fontSize: 12 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="fw-medium" style={{ fontSize: 12 }}>{n.title}</div>
                <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{n.message}</div>
                <div className="text-muted" style={{ fontSize: 10 }}>
                  {new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              {!n.is_read && (
                <div className="rounded-circle flex-shrink-0" style={{ width: 7, height: 7, marginTop: 4, background: 'var(--primary)' }} />
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// function ProfileDropdown({ name, email, role, onSignOut, onReplayTour, onClose }: {
//   name: string; email: string; role: string;
//   onSignOut: () => void; onReplayTour: () => void; onClose: () => void;
// }) {
//   const navigate = useNavigate();
//   const style = useDropdownStyle(220);
//   const go = (p: string) => { navigate(p); onClose(); };
// v2
function ProfileDropdown({ name, email, role, onSignOut, onReplayTour, onClose }: {
  name: string; email: string; role: string;
  onSignOut: () => void; onReplayTour: () => void; onClose: () => void;
}) {
  const navigate = useNavigate();
  const style = useDropdownStyle(220);
  const { canInstall, isIosDevice, hasNativePrompt, promptInstall } = usePWAInstall();
  const go = (p: string) => { navigate(p); onClose(); };
  
  const links = [
    { icon: 'fa-gauge', label: 'Dashboard', path: '/dashboard' },
    { icon: 'fa-box', label: 'My Orders', path: '/orders' },
    { icon: 'fa-layer-group', label: 'My Subscriptions', path: '/subscriptions' },
    { icon: 'fa-credit-card', label: 'Payments', path: '/payments' },
    { icon: 'fa-user', label: 'Profile & Settings', path: '/profile' },
    { icon: 'fa-map-marker-alt', label: 'Addresses', path: '/addresses' },
  ];
  return (
    <div className="bg-white rounded-3 shadow-lg border" style={style}>
      <div className="px-3 py-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
            style={{ width: 36, height: 36, fontSize: 14, background: 'var(--primary)' }}>
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{name}</div>
            <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{email}</div>
            <span className="badge" style={{ fontSize: 9, background: 'var(--primary)' }}>{role}</span>
          </div>
        </div>
      </div>
      <div className="py-1">
        {links.map(l => (
          <button key={l.path}
            className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
            style={{ fontSize: 13, borderRadius: 0 }} onClick={() => go(l.path)}>
            <i className={`fas ${l.icon} text-muted`} style={{ width: 16, fontSize: 12 }} />{l.label}
          </button>
        ))}
      </div>
      <div className="border-top py-1">
        <button
          className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
          style={{ fontSize: 13, borderRadius: 0 }}
          onClick={() => { onReplayTour(); onClose(); }}
        >
          <i className="fas fa-route text-muted" style={{ width: 16, fontSize: 12 }} />Replay Walkthrough
        </button>
      </div>

      {canInstall && (
        <>

        {console.log(canInstall)}

        <div className="border-top py-1">
          <button
            className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
            style={{ fontSize: 13, borderRadius: 0 }}
            onClick={async () => {
              if (isIosDevice && !hasNativePrompt) { /* the InstallBanner's iOS modal handles this path already if the banner is dismissed — for the profile menu entry, just re-show the banner logic or a lightweight alert */ }
              else await promptInstall();
              onClose();
            }}
          >
            <i className="fas fa-mobile-screen-button text-muted" style={{ width: 16, fontSize: 12 }} />Install App
          </button>
        </div>
      
      </>
      )}

      <div className="border-top py-1">
        <button
          className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-danger"
          style={{ fontSize: 13 }} onClick={onSignOut}>
          <i className="fas fa-sign-out-alt" style={{ width: 16, fontSize: 12 }} />Sign Out
        </button>
      </div>
      
    </div>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const { startTour } = useTour();
  const role = getNavRole(user, isAdmin);
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useAppData();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const title = PAGE_TITLES[location.pathname] ?? 'Stitch';

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSignOut = async () => { await signOut(); navigate('/signin'); };

  return (
    <header className="sl-topbar">
      <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={onMenuClick}>
        <i className="fas fa-bars" />
      </button>
      <div className="me-auto">
        <h6 className="mb-0 fw-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h6>
      </div>
      <div className="d-flex align-items-center gap-2">
        {/* Notifications */}
        <div ref={notifsRef} style={{ position: 'relative' }}>
          <button data-tour="topbar-notifications" className="btn btn-sm btn-outline-secondary position-relative"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); }}>
            <i className="fas fa-bell" />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: 9 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {showNotifs && (
            <NotifDropdown
              notifications={notifications} unreadCount={unreadCount}
              onRead={(id: string) => { void markNotificationRead(Number(id)); }} onReadAll={() => { void markAllRead(); }}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>
        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button data-tour="topbar-profile" className="btn btn-sm d-flex align-items-center gap-2" style={{ padding: '4px 8px' }}
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}>
            <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
              style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0, background: 'var(--primary)' }}>
              {user?.names?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <span className="d-none d-sm-inline fw-medium" style={{ fontSize: 13 }}>
              {user?.names?.split(' ')[0] ?? 'User'}
            </span>
            <i className="fas fa-chevron-down d-none d-sm-inline text-muted" style={{ fontSize: 9 }} />
          </button>
          {showProfile && user && (
            <ProfileDropdown
              name={user.names} email={user.email} role={user.roles?.[0] ?? 'User'}
              onSignOut={handleSignOut}
              onReplayTour={() => startTour(role)}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
