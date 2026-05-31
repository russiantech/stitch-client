import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userService, addressService } from '../../services/api.js';
import { useAppData } from '../../context/AppDataContext.jsx';
import { MOCK_DELIVERY_AREAS } from '../../services/mockData.js';

const MOCK_ADDRESSES = [
  { id: 1, label: 'Home', address: '14B Admiralty Way, Lekki Phase 1', area: 'Lekki Phase 1', is_default: true },
  { id: 2, label: 'Office', address: '5 Broad Street, Lagos Island', area: 'Lagos Island', is_default: false },
];

const EMPTY_ADDR = { label: '', address: '', area: '' };

function AddressCard({ addr, onEdit, onDelete, onSetDefault }) {
  return (
    <div className={`bg-white rounded-3 border p-3 mb-2 ${addr.is_default ? 'border-primary border-2' : ''}`}>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="fas fa-map-marker-alt text-primary small" />
            <span className="fw-medium small">{addr.label}</span>
            {addr.is_default && <span className="badge bg-primary" style={{ fontSize: 9 }}>Default</span>}
          </div>
          <div className="text-muted small">{addr.address}</div>
          <div className="text-muted" style={{ fontSize: 11 }}>{addr.area}</div>
        </div>
        <div className="d-flex gap-1 flex-shrink-0">
          <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onEdit(addr)} title="Edit">
            <i className="fas fa-edit" />
          </button>
          {!addr.is_default && (
            <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onSetDefault(addr.id)} title="Set default">
              <i className="fas fa-check" />
            </button>
          )}
          <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onDelete(addr.id)} title="Delete">
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressModal({ addr, areas, onSave, onClose }) {
  const [form, setForm] = useState(addr ? { ...addr } : EMPTY_ADDR);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">{addr ? 'Edit Address' : 'Add Address'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-medium">Label *</label>
              <input className="form-control" value={form.label} onChange={f('label')} placeholder="Home, Office, etc." />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Area *</label>
              <select className="form-select" value={form.area} onChange={f('area')}>
                <option value="">Select area…</option>
                {areas.filter(a => a.active !== false).map(a => <option key={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Full Address *</label>
              <textarea className="form-control" rows={2} value={form.address} onChange={f('address')} placeholder="House number, street, landmark…" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!form.label || !form.area || !form.address) return;
                onSave(form);
              }}
            >
              {addr ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const { deliveryAreas } = useAppData();
  const areas = deliveryAreas.length > 0 ? deliveryAreas : MOCK_DELIVERY_AREAS;

  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [addresses, setAddresses] = useState(MOCK_ADDRESSES);
  const [addrModal, setAddrModal] = useState(null); // null | 'add' | addr object
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    order_updates: true, pickup_reminders: true,
    delivery_notifs: true, promotions: false, loyalty: true,
  });

  useEffect(() => {
    addressService.list()
      .then(d => d?.addresses && setAddresses(d.addresses))
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile(form);
      toast.success('Profile updated successfully');
    } catch {
      toast.success('Profile updated (demo)');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.new_password.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await userService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch {
      toast.success('Password changed (demo)');
    } finally {
      setSavingPw(false);
    }
  };

  const handleAddrSave = async (formData) => {
    if (addrModal && addrModal !== 'add') {
      // Edit
      const updated = { ...addrModal, ...formData };
      try {
        await addressService.update(addrModal.id, formData);
      } catch {}
      setAddresses(prev => prev.map(a => a.id === addrModal.id ? updated : a));
      toast.success('Address updated');
    } else {
      // Add
      const newAddr = { ...formData, id: Date.now(), is_default: false };
      try {
        const res = await addressService.create(formData);
        if (res?.address) newAddr.id = res.address.id;
      } catch {}
      setAddresses(prev => [...prev, newAddr]);
      toast.success('Address saved');
    }
    setAddrModal(null);
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try { await addressService.delete(id); } catch {}
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast.success('Address removed');
  };

  const setDefault = async (id) => {
    try { await addressService.setDefault(id); } catch {}
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    toast.success('Default address updated');
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fpw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHeader title="Profile & Settings" />

      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'profile', label: 'Profile', icon: 'fa-user' },
          { key: 'addresses', label: 'Addresses', icon: 'fa-map-marker-alt' },
          { key: 'security', label: 'Security', icon: 'fa-lock' },
          { key: 'notifications', label: 'Notifications', icon: 'fa-bell' },
        ].map(t => (
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon} me-2 d-none d-sm-inline`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* ─── Profile Tab ─── */}
      {tab === 'profile' && (
        <div className="bg-white rounded-3 border p-4">
          <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
              style={{ width: 64, height: 64, fontSize: 24 }}
            >
              {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h5 className="fw-bold mb-0" style={{ fontFamily: 'var(--font-heading)' }}>{user?.name}</h5>
              <div className="text-muted small">{user?.email}</div>
              <span className="badge bg-primary mt-1" style={{ fontSize: 10 }}>{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Full Name</label>
                <input className="form-control" value={form.name} onChange={f('name')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Username</label>
                <input className="form-control" value={form.username} onChange={f('username')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Email Address</label>
                <input type="email" className="form-control" value={form.email} onChange={f('email')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Phone Number</label>
                <input className="form-control" value={form.phone} onChange={f('phone')} placeholder="080XXXXXXXX" />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Loyalty & Referral */}
          <div className="mt-4 pt-4 border-top">
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="bg-warning bg-opacity-10 rounded-3 p-3 d-flex align-items-center gap-3">
                  <i className="fas fa-star text-warning fs-4" />
                  <div>
                    <div className="fw-bold">{(user?.loyalty_points || 340).toLocaleString()} pts</div>
                    <div className="text-muted small">Loyalty Points</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="bg-light rounded-3 p-3">
                  <div className="text-muted small mb-1">Referral Code</div>
                  <div className="input-group input-group-sm">
                    <input className="form-control" readOnly value={user?.referral_code || 'ST-ADAEZE'} />
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referral_code || 'ST-ADAEZE');
                        toast.success('Copied!');
                      }}
                    >
                      <i className="fas fa-copy" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Addresses Tab ─── */}
      {tab === 'addresses' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold mb-0">Saved Addresses ({addresses.length})</h6>
            <button className="btn btn-primary btn-sm" onClick={() => setAddrModal('add')}>
              <i className="fas fa-plus me-1" />Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              <i className="fas fa-map-marker-alt fa-2x d-block mb-2 opacity-25" />
              No addresses saved yet.
            </div>
          ) : (
            addresses.map(addr => (
              <AddressCard
                key={addr.id}
                addr={addr}
                onEdit={a => setAddrModal(a)}
                onDelete={deleteAddress}
                onSetDefault={setDefault}
              />
            ))
          )}
        </div>
      )}

      {/* ─── Security Tab ─── */}
      {tab === 'security' && (
        <div className="bg-white rounded-3 border p-4">
          <h6 className="fw-semibold mb-4">Change Password</h6>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-3">
              <label className="form-label small fw-medium">Current Password</label>
              <input type="password" className="form-control" value={pwForm.current_password}
                onChange={fpw('current_password')} placeholder="••••••••" required />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">New Password</label>
              <input type="password" className="form-control" value={pwForm.new_password}
                onChange={fpw('new_password')} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-medium">Confirm New Password</label>
              <input type="password" className="form-control" value={pwForm.confirm}
                onChange={fpw('confirm')} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <><span className="spinner-border spinner-border-sm me-2" />Updating…</> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* ─── Notifications Tab ─── */}
      {tab === 'notifications' && (
        <div className="bg-white rounded-3 border p-4">
          <h6 className="fw-semibold mb-4">Notification Preferences</h6>
          {[
            { key: 'order_updates', label: 'Order status updates', sub: 'Notified when your order status changes' },
            { key: 'pickup_reminders', label: 'Pickup reminders', sub: 'When driver is on the way to pick up' },
            { key: 'delivery_notifs', label: 'Delivery notifications', sub: 'When your order is out for delivery' },
            { key: 'promotions', label: 'Promotions & offers', sub: 'Discount codes and seasonal offers' },
            { key: 'loyalty', label: 'Loyalty point updates', sub: 'Earn and redemption notifications' },
          ].map(item => (
            <div key={item.key} className="d-flex align-items-center justify-content-between py-3 border-bottom">
              <div>
                <div className="small fw-medium">{item.label}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{item.sub}</div>
              </div>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={e => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                />
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary btn-sm mt-4"
            onClick={() => toast.success('Notification preferences saved')}
          >
            Save Preferences
          </button>
        </div>
      )}

      {/* Address Modal */}
      {addrModal !== null && (
        <AddressModal
          addr={addrModal === 'add' ? null : addrModal}
          areas={areas}
          onSave={handleAddrSave}
          onClose={() => setAddrModal(null)}
        />
      )}
    </div>
  );
}
