import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/shared/index.tsx';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/context/ToastContext.tsx';
import { userService, authService } from '@/services/api.ts';
import { useAppData } from '@/context/AppDataContext.tsx';
import type { Address } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const EMPTY_ADDR = { label: '', address_line: '', area: '' };
type AddrForm = typeof EMPTY_ADDR;

function AddressCard({ addr, onEdit, onDelete, onSetDefault }: {
  addr: Address; onEdit: (a: Address) => void; onDelete: (id: number) => void; onSetDefault: (id: number) => void;
}) {
  return (
    <div className={`bg-white rounded-3 border p-3 mb-2 ${addr.is_default ? 'border-primary border-2' : ''}`}>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="fas fa-map-marker-alt text-primary small" />
            <span className="fw-medium small">{addr.label}</span>
            {addr.is_default && <span className="badge bg-primary" style={{ fontSize: 9 }}>Default</span>}
          </div>
          <div className="text-muted small">{addr.address_line}</div>
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

function AddressModal({ addr, areaNames, onSave, onClose }: {
  addr: Address | null; areaNames: string[]; onSave: (form: AddrForm) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<AddrForm>(addr ? { label: addr.label, address_line: addr.address_line, area: addr.area || '' } : EMPTY_ADDR);
  const f = (k: keyof AddrForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
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
                {areaNames.map(name => <option key={name}>{name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Full Address *</label>
              <textarea className="form-control" rows={2} value={form.address_line} onChange={f('address_line')} placeholder="House number, street, landmark…" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (!form.label || !form.area || !form.address_line) return;
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
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const { deliveryAreas } = useAppData();
  const areaNames = deliveryAreas.map(a => a.name);

  const [tab, setTab] = useState<'profile' | 'addresses' | 'security' | 'notifications'>('profile');
  const [form, setForm] = useState({
    names: user?.names || '',
    phone: user?.phone || '',
    username: user?.username || '',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrModal, setAddrModal] = useState<null | 'add' | Address>(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    order_updates: true, pickup_reminders: true,
    delivery_notifs: true, promotions: false, loyalty: true,
  });

  useEffect(() => {
    userService.myAddresses()
      .then(setAddresses)
      .catch(() => { /* ignore */ });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateMe(form);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.new_password.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await authService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSavingPw(false);
    }
  };

  const handleAddrSave = async (formData: AddrForm) => {
    try {
      if (addrModal && addrModal !== 'add') {
        const updated = await userService.updateAddress(addrModal.id, formData);
        setAddresses(prev => prev.map(a => a.id === addrModal.id ? updated : a));
        toast.success('Address updated');
      } else {
        const created = await userService.createAddress({ label: formData.label, address_line: formData.address_line, area: formData.area, is_default: addresses.length === 0 });
        setAddresses(prev => [...prev, created]);
        toast.success('Address saved');
      }
      setAddrModal(null);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const deleteAddress = async (id: number) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await userService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address removed');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const setDefault = async (id: number) => {
    try {
      await userService.setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const fpw = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const primaryRole = user?.roles?.[0] || 'customer';

  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHeader title="Profile & Settings" />

      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'profile' as const, label: 'Profile', icon: 'fa-user' },
          { key: 'addresses' as const, label: 'Addresses', icon: 'fa-map-marker-alt' },
          { key: 'security' as const, label: 'Security', icon: 'fa-lock' },
          { key: 'notifications' as const, label: 'Notifications', icon: 'fa-bell' },
        ].map(t => (
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon} me-2 d-none d-sm-inline`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'profile' && (
        <div className="bg-white rounded-3 border p-4">
          <div className="d-flex align-items-center gap-4 mb-4 pb-4 border-bottom">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
              style={{ width: 64, height: 64, fontSize: 24 }}
            >
              {user?.names?.charAt(0) || '?'}
            </div>
            <div>
              <h5 className="fw-bold mb-0" style={{ fontFamily: 'var(--font-heading)' }}>{user?.names}</h5>
              <div className="text-muted small">{user?.email}</div>
              <span className="badge bg-primary mt-1 text-capitalize" style={{ fontSize: 10 }}>{primaryRole}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave}>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Full Name</label>
                <input className="form-control" value={form.names} onChange={f('names')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Username</label>
                <input className="form-control" value={form.username} onChange={f('username')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Email Address</label>
                <input type="email" className="form-control" value={user?.email || ''} disabled readOnly />
                <div className="form-text small">Contact support to change your email address.</div>
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

          {user?.loyalty_points != null && (
            <div className="mt-4 pt-4 border-top">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="bg-warning bg-opacity-10 rounded-3 p-3 d-flex align-items-center gap-3">
                    <i className="fas fa-star text-warning fs-4" />
                    <div>
                      <div className="fw-bold">{user.loyalty_points.toLocaleString()} pts</div>
                      <div className="text-muted small">Loyalty Points</div>
                    </div>
                  </div>
                </div>
                {user.referral_code && (
                  <div className="col-sm-6">
                    <div className="bg-light rounded-3 p-3">
                      <div className="text-muted small mb-1">Referral Code</div>
                      <div className="input-group input-group-sm">
                        <input className="form-control" readOnly value={user.referral_code} />
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => {
                            navigator.clipboard.writeText(user.referral_code || '');
                            toast.success('Copied!');
                          }}
                        >
                          <i className="fas fa-copy" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

      {tab === 'notifications' && (
        <div className="bg-white rounded-3 border p-4">
          <h6 className="fw-semibold mb-4">Notification Preferences</h6>
          <div className="alert alert-secondary small mb-4">
            <i className="fas fa-info-circle me-2" />These preferences are stored on this device for now.
          </div>
          {[
            { key: 'order_updates' as const, label: 'Order status updates', sub: 'Notified when your order status changes' },
            { key: 'pickup_reminders' as const, label: 'Pickup reminders', sub: 'When driver is on the way to pick up' },
            { key: 'delivery_notifs' as const, label: 'Delivery notifications', sub: 'When your order is out for delivery' },
            { key: 'promotions' as const, label: 'Promotions & offers', sub: 'Discount codes and seasonal offers' },
            { key: 'loyalty' as const, label: 'Loyalty point updates', sub: 'Earn and redemption notifications' },
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

      {addrModal !== null && (
        <AddressModal
          addr={addrModal === 'add' ? null : addrModal}
          areaNames={areaNames}
          onSave={handleAddrSave}
          onClose={() => setAddrModal(null)}
        />
      )}
    </div>
  );
}
