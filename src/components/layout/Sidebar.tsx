// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext.tsx';

// const NAV = {
//   customer: [
//     { to: '/dashboard', icon: 'fa-gauge', label: 'Dashboard' },
//     { to: '/orders/new', icon: 'fa-plus-circle', label: 'New Order' },
//     { to: '/orders', icon: 'fa-box', label: 'My Orders' },
//     { to: '/fashion/new', icon: 'fa-shirt', label: 'Fashion Request' },
//     { to: '/subscriptions', icon: 'fa-layer-group', label: 'My Subscriptions' },
//     { to: '/payments', icon: 'fa-credit-card', label: 'Payments' },
//     { to: '/addresses', icon: 'fa-map-marker-alt', label: 'Addresses' },
//     { to: '/profile', icon: 'fa-user', label: 'Profile & Settings' },
//   ],
//   admin: [
//     { label: 'Operations', section: true },
//     { to: '/ops', icon: 'fa-gauge', label: 'Ops Dashboard' },
//     { to: '/ops/laundry', icon: 'fa-soap', label: 'Laundry Orders' },
//     { to: '/ops/fashion', icon: 'fa-shirt', label: 'Fashion Orders' },
//     { to: '/ops/pickups', icon: 'fa-truck-pickup', label: 'Pickups' },
//     { to: '/ops/deliveries', icon: 'fa-truck', label: 'Deliveries' },
//     { label: 'Management', section: true },
//     { to: '/fashion-catalog', icon: 'fa-store', label: 'Fashion Catalog' },
//     { to: '/crm', icon: 'fa-users', label: 'CRM / Customers' },
//     { to: '/inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
//     { to: '/billing', icon: 'fa-file-invoice', label: 'Billing' },
//     { to: '/analytics', icon: 'fa-chart-line', label: 'Analytics' },
//     { label: 'Admin', section: true },
//     { to: '/admin/users', icon: 'fa-user-shield', label: 'Users' },
//     { to: '/admin/plans', icon: 'fa-layer-group', label: 'Plans' },
//     { to: '/admin/pricing', icon: 'fa-tags', label: 'Pricing Settings' },
//     { to: '/admin/usage', icon: 'fa-chart-bar', label: 'Usage Recording' },
//     { label: 'My Account', section: true },
//     { to: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
//     { to: '/subscriptions', icon: 'fa-layer-group', label: 'Subscriptions' },
//   ],
//   staff: [
//     { to: '/staff', icon: 'fa-gauge', label: 'My Tasks' },
//     { to: '/ops/laundry', icon: 'fa-soap', label: 'Laundry Queue' },
//     { to: '/ops/fashion', icon: 'fa-shirt', label: 'Fashion Queue' },
//     { to: '/admin/usage', icon: 'fa-chart-bar', label: 'Record Usage' },
//     { to: '/dashboard', icon: 'fa-home', label: 'My Account' },
//   ],
//   driver: [
//     { to: '/driver', icon: 'fa-gauge', label: 'My Routes' },
//     { to: '/driver/pickups', icon: 'fa-truck-pickup', label: 'Pickups' },
//     { to: '/driver/deliveries', icon: 'fa-truck', label: 'Deliveries' },
//     { to: '/dashboard', icon: 'fa-home', label: 'My Account' },
//   ],
// };

// export default function Sidebar({ show, onClose }) {
//   const { user, signOut, isAdmin } = useAuth();
//   const navigate = useNavigate();

//   const role = isAdmin() ? 'admin'
//     : user?.role === 'staff' ? 'staff'
//     : user?.role === 'driver' ? 'driver'
//     : 'customer';

//   const navItems = NAV[role] || NAV.customer;

//   const handleSignOut = async () => {
//     await signOut();
//     navigate('/signin');
//   };

//   return (
//     <>
//       {show && (
//         <div
//           className="d-lg-none"
//           style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
//           onClick={onClose}
//         />
//       )}

//       <aside className={`sl-sidebar${show ? ' show' : ''}`}>
//         {/* Brand */}
//         <a href="/dashboard" className="sidebar-brand">
//           <span className="brand-scissors"><i className="fas fa-scissors" /></span>
//           Stitch
//         </a>

//         {/* User info */}
//         <div className="px-4 py-3 border-bottom">
//           <div className="d-flex align-items-center gap-2">
//             <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
//               style={{ width: 36, height: 36, fontSize: 14 }}>
//               {user?.names?.charAt(0)?.toUpperCase() || '?'}
//             </div>
//             <div className="min-w-0">
//               <div className="fw-medium text-truncate" style={{ fontSize: 13 }}>{user?.names || 'Guest'}</div>
//               <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{user?.email || ''}</div>
//             </div>
//           </div>
//         </div>

//         {/* Nav */}
//         <nav className="py-2" style={{ flex: 1, overflowY: 'auto' }}>
//           {navItems.map((item, i) => {
//             if (item.section) {
//               return <div key={i} className="nav-section-label">{item.label}</div>;
//             }
//             return (
//               <NavLink
//                 key={item.to + i}
//                 to={item.to}
//                 onClick={onClose}
//                 className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//                 end={item.to === '/dashboard' || item.to === '/ops'}
//               >
//                 <i className={`fas ${item.icon}`} />
//                 {item.label}
//               </NavLink>
//             );
//           })}
//         </nav>

//         {/* Sign out */}
//         <div className="p-3 border-top">
//           <button className="btn btn-outline-danger btn-sm w-100" onClick={handleSignOut}>
//             <i className="fas fa-sign-out-alt me-2" />Log Out
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }



// v2
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';

interface NavItem { to?: string; icon?: string; label: string; section?: boolean; }

const NAV: Record<string, NavItem[]> = {
  customer: [
    { to:'/dashboard',    icon:'fa-gauge',         label:'Dashboard' },
    { to:'/orders/new',   icon:'fa-plus-circle',   label:'New Order' },
    { to:'/orders',       icon:'fa-box',           label:'My Orders' },
    { to:'/fashion/new',  icon:'fa-shirt',         label:'Fashion Request' },
    { to:'/subscriptions',icon:'fa-layer-group',   label:'My Subscriptions' },
    { to:'/payments',     icon:'fa-credit-card',   label:'Payments' },
    { to:'/addresses',    icon:'fa-map-marker-alt',label:'Addresses' },
    { to:'/profile',      icon:'fa-user',          label:'Profile & Settings' },
  ],
  admin: [
    { label:'Operations', section:true },
    { to:'/ops',           icon:'fa-gauge',         label:'Ops Dashboard' },
    { to:'/ops/laundry',   icon:'fa-soap',          label:'Laundry Orders' },
    { to:'/ops/fashion',   icon:'fa-shirt',         label:'Fashion Orders' },
    { to:'/ops/pickups',   icon:'fa-truck-pickup',  label:'Pickups' },
    { to:'/ops/deliveries',icon:'fa-truck',         label:'Deliveries' },

    { label:'Management', section:true },
    { to:'/fashion-catalog',icon:'fa-store',        label:'Fashion Catalog' },
    { to:'/crm',           icon:'fa-users',         label:'CRM / Customers' },
    { to:'/inventory',     icon:'fa-boxes-stacked', label:'Inventory' },
    { to:'/billing',       icon:'fa-file-invoice',  label:'Billing' },
    { to:'/analytics',     icon:'fa-chart-line',    label:'Analytics' },

    { label:'Admin', section:true },
    { to:'/admin/users',   icon:'fa-user-shield',   label:'Users' },
    { to:'/admin/plans',   icon:'fa-layer-group',   label:'Plans' },
    { to:'/admin/pricing', icon:'fa-tags',          label:'Pricing Settings' },
    { to:'/admin/usage',   icon:'fa-chart-bar',     label:'Usage Recording' },

    { label:'My Organization', section:true },
    { to:'/orgs/settings',     icon:'fa-building',          label:'Org Settings' },
    { to:'/orgs/payouts',     icon:'fa-money-check-dollar',    label:'Payout Settings' },

    { label:'My Account', section:true },
    { to:'/dashboard',     icon:'fa-home',          label:'Dashboard' },
    { to:'/subscriptions', icon:'fa-layer-group',   label:'Subscriptions' },
  ],

  staff: [
    { to:'/staff',        icon:'fa-gauge',       label:'My Tasks' },
    { to:'/ops/laundry',  icon:'fa-soap',        label:'Laundry Queue' },
    { to:'/ops/fashion',  icon:'fa-shirt',       label:'Fashion Queue' },
    { to:'/admin/usage',  icon:'fa-chart-bar',   label:'Record Usage' },
    { to:'/dashboard',    icon:'fa-home',        label:'My Account' },
  ],
  driver: [
    { to:'/driver',            icon:'fa-gauge',       label:'My Routes' },
    { to:'/driver/pickups',    icon:'fa-truck-pickup',label:'Pickups' },
    { to:'/driver/deliveries', icon:'fa-truck',       label:'Deliveries' },
    { to:'/dashboard',         icon:'fa-home',        label:'My Account' },
  ],
};

export default function Sidebar({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const role = isAdmin() ? 'admin' : user?.roles.includes('staff') || user?.roles.includes('manager') ? 'staff' : user?.roles.includes('driver') ? 'driver' : 'customer';
  const navItems = NAV[role] ?? NAV.customer;
  const handleSignOut = async () => { await signOut(); navigate('/signin'); };
  return (
    <>
      {show && (
        <div className="d-lg-none"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:99 }}
          onClick={onClose} />
      )}
      <aside className={`sl-sidebar${show ? ' show' : ''}`}>
        <Link to="/dashboard" className="sidebar-brand">
          {/* <span className="brand-scissors"><i className="fas fa-scissors" /></span>Stitch */}
          {/* <span className="brand-scissors1">
            <img src="/images/logos/favicon.ico" alt="Stitch" style={{ width:28, height:28, marginRight:8 }} />
            </span>Stitch */}

            <img src="/images/logos/stitch-logo.png" alt="Stitch" style={{ width:200, height:38, marginRight:8 }} />
          
        </Link>
        <div className="px-4 py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
              style={{ width:36, height:36, fontSize:14, background:'var(--primary)' }}>
              {user?.names?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="fw-medium text-truncate" style={{ fontSize:13 }}>{user?.names ?? 'Guest'}</div>
              <div className="text-muted text-truncate" style={{ fontSize:11 }}>{user?.email ?? ''}</div>
            </div>
          </div>
        </div>
        <nav className="py-2" style={{ flex:1, overflowY:'auto' }}>
          {navItems.map((item, i) => {
            if (item.section) return <div key={i} className="nav-section-label">{item.label}</div>;
            return (
              <NavLink key={`${item.to}-${i}`} to={item.to!} onClick={onClose}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                end={item.to === '/dashboard' || item.to === '/ops'}>
                <i className={`fas ${item.icon}`} />{item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-top">
          <button className="btn btn-outline-danger btn-sm w-100" onClick={handleSignOut}>
            <i className="fas fa-sign-out-alt me-2" />Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
