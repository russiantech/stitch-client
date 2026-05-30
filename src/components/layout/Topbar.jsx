import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import { formatNGN } from '../../services/mockData.js';

const PAGE_TITLES = {
  '/dashboard':'Dashboard','/orders':'My Orders','/orders/new':'Create Order',
  '/fashion/new':'Fashion Request','/payments':'Payments & Invoices',
  '/addresses':'Saved Addresses','/profile':'Profile & Settings',
  '/ops':'Operations Dashboard','/ops/laundry':'Laundry Orders',
  '/ops/fashion':'Fashion Orders','/ops/pickups':'Pickups','/ops/deliveries':'Deliveries',
  '/fashion-catalog':'Fashion Catalog','/crm':'CRM — Customers',
  '/inventory':'Inventory','/billing':'Billing & Payments','/analytics':'Analytics & Reports',
  '/admin/users':'User Management','/admin/plans':'Plans Management',
  '/admin/pricing':'Pricing Settings','/admin/areas':'Delivery Areas',
  '/admin/usage':'Usage Recording',
  '/staff':'Staff Portal','/driver':'Driver Portal',
  '/driver/pickups':'My Pickups','/driver/deliveries':'My Deliveries',
  '/subscriptions':'My Subscriptions',
};

function NotificationIcon({ type }) {
  const icons = { order:'fa-box',subscription:'fa-layer-group',payment:'fa-credit-card' };
  const colors = { order:'text-primary',subscription:'text-success',payment:'text-warning' };
  return <i className={`fas ${icons[type]||'fa-bell'} ${colors[type]||'text-muted'}`} style={{fontSize:12}} />;
}

function NotificationsDropdown({ notifications, unreadCount, onMarkRead, onMarkAll, onClose }) {
  const recent = notifications.slice(0, 8);
  return (
    <div
      className="bg-white rounded-3 shadow-lg border"
      style={{ position:'absolute',top:'calc(100% + 8px)',right:0,width:320,zIndex:1050 }}
    >
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
        <span className="fw-semibold small">Notifications</span>
        <div className="d-flex gap-2 align-items-center">
          {unreadCount > 0 && (
            <button className="btn btn-link btn-sm p-0 text-primary" style={{fontSize:11}} onClick={onMarkAll}>
              Mark all read
            </button>
          )}
          <button className="btn-close btn-sm" onClick={onClose} style={{fontSize:10}} />
        </div>
      </div>
      <div style={{ maxHeight:360,overflowY:'auto' }}>
        {recent.length === 0 ? (
          <div className="text-center py-4 text-muted small">No notifications</div>
        ) : recent.map(n => (
          <div
            key={n.id}
            className={`px-3 py-2 border-bottom d-flex gap-2 align-items-start ${!n.read ? 'bg-primary bg-opacity-5' : ''}`}
            style={{ cursor:'pointer' }}
            onClick={() => !n.read && onMarkRead(n.id)}
          >
            <div className="mt-1 flex-shrink-0" style={{width:18}}>
              <NotificationIcon type={n.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="fw-medium" style={{fontSize:12}}>{n.title}</div>
              <div className="text-muted text-truncate" style={{fontSize:11}}>{n.message}</div>
              <div className="text-muted" style={{fontSize:10}}>
                {new Date(n.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short'})}
              </div>
            </div>
            {!n.read && <div className="rounded-circle bg-primary flex-shrink-0" style={{width:7,height:7,marginTop:4}} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileDropdown({ user, onSignOut, onClose }) {
  const navigate = useNavigate();
  const go = (path) => { navigate(path); onClose(); };
  return (
    <div
      className="bg-white rounded-3 shadow-lg border"
      style={{ position:'absolute',top:'calc(100% + 8px)',right:0,width:220,zIndex:1050 }}
    >
      <div className="px-3 py-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
            style={{width:36,height:36,fontSize:14}}>
            {user?.name?.charAt(0)||'U'}
          </div>
          <div className="min-w-0">
            <div className="fw-semibold text-truncate" style={{fontSize:13}}>{user?.name}</div>
            <div className="text-muted text-truncate" style={{fontSize:11}}>{user?.email}</div>
            <span className="badge bg-primary" style={{fontSize:9}}>{user?.role}</span>
          </div>
        </div>
      </div>
      <div className="py-1">
        {[
          {icon:'fa-gauge',label:'Dashboard',path:'/dashboard'},
          {icon:'fa-box',label:'My Orders',path:'/orders'},
          {icon:'fa-layer-group',label:'My Subscriptions',path:'/subscriptions'},
          {icon:'fa-credit-card',label:'Payments',path:'/payments'},
          {icon:'fa-user',label:'Profile & Settings',path:'/profile'},
          {icon:'fa-map-marker-alt',label:'Addresses',path:'/addresses'},
        ].map(item => (
          <button key={item.path} className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
            style={{fontSize:13,borderRadius:0}} onClick={() => go(item.path)}>
            <i className={`fas ${item.icon} text-muted`} style={{width:16,fontSize:12}} />
            {item.label}
          </button>
        ))}
      </div>
      <div className="border-top py-1">
        <button className="btn btn-link w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-danger"
          style={{fontSize:13}} onClick={onSignOut}>
          <i className="fas fa-sign-out-alt" style={{width:16,fontSize:12}} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useAppData();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef = useRef();
  const profileRef = useRef();

  const title = PAGE_TITLES[location.pathname] || 'SimplyLovely';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <header className="sl-topbar">
      <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={onMenuClick}>
        <i className="fas fa-bars" />
      </button>

      <div className="me-auto">
        <h6 className="mb-0 fw-semibold" style={{fontFamily:'var(--font-display)'}}>{title}</h6>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Notifications */}
        <div ref={notifsRef} style={{position:'relative'}}>
          <button
            className="btn btn-sm btn-outline-secondary position-relative"
            onClick={() => { setShowNotifs(p => !p); setShowProfile(false); }}
          >
            <i className="fas fa-bell" />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize:9}}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <NotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={markNotificationRead}
              onMarkAll={markAllRead}
              onClose={() => setShowNotifs(false)}
            />
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{position:'relative'}}>
          <button
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{padding:'4px 8px'}}
            onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}
          >
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
              style={{width:30,height:30,fontSize:12,flexShrink:0}}>
              {user?.name?.charAt(0)?.toUpperCase()||'U'}
            </div>
            <span className="d-none d-sm-inline fw-medium" style={{fontSize:13}}>
              {user?.name?.split(' ')[0]||'User'}
            </span>
            <i className="fas fa-chevron-down d-none d-sm-inline text-muted" style={{fontSize:9}} />
          </button>
          {showProfile && (
            <ProfileDropdown
              user={user}
              onSignOut={handleSignOut}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}
