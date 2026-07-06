import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
import { userService } from '@/services/api.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/context/ToastContext.tsx';
import type { User, UserRole } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-danger', super_admin: 'bg-danger', manager: 'bg-dark',
  staff: 'bg-primary', driver: 'bg-warning text-dark', customer: 'bg-success', cashier: 'bg-info',
};
const ROLES: UserRole[] = ['customer', 'staff', 'driver', 'manager', 'admin'];

// ─── Invite User Modal ─────────────────────────────────────────────────────────
function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (u: User) => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer' as UserRole });
  const [saving, setSaving] = useState(false);
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSend = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required');
    setSaving(true);
    try {
      const created = await userService.invite(form);
      toast.success(`Invitation sent to ${form.email}`);
      onInvited(created);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold"><i className="fas fa-user-plus me-2 text-primary" />Invite New User</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-medium">Full Name *</label>
              <input className="form-control" value={form.name} onChange={f('name')} placeholder="e.g. Chiamaka Eze" autoFocus />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Email Address *</label>
              <input type="email" className="form-control" value={form.email} onChange={f('email')} placeholder="user@example.com" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Phone Number</label>
              <input className="form-control" value={form.phone} onChange={f('phone')} placeholder="080XXXXXXXXX" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Role</label>
              <select className="form-select" value={form.role} onChange={f('role')}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="alert alert-info small py-2 mb-0">
              <i className="fas fa-info-circle me-2" />An invitation email with a setup link will be sent to the user.
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : <><i className="fas fa-paper-plane me-2" />Send Invitation</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal (profile fields + roles + active status) ────────────────
function EditUserModal({ user: u, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const toast = useToast();
  const [names, setNames] = useState(u.names);
  const [phone, setPhone] = useState(u.phone || '');
  const [isActive, setIsActive] = useState(u.is_active);
  const [roles, setRoles] = useState<UserRole[]>(u.roles);
  const [saving, setSaving] = useState(false);

  const toggleRole = (role: UserRole) =>
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let updated = await userService.update(u.id, { names, phone, is_active: isActive });
      const toAdd = roles.filter(r => !u.roles.includes(r));
      const toRemove = u.roles.filter(r => !roles.includes(r));
      for (const r of toAdd) updated = await userService.assignRole(u.id, r);
      for (const r of toRemove) updated = await userService.removeRole(u.id, r);
      toast.success('User updated');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Edit — {u.names}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-medium">Full Name</label>
                <input className="form-control" value={names} onChange={e => setNames(e.target.value)} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Email</label>
                <input type="email" className="form-control" value={u.email} disabled readOnly />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Phone</label>
                <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-medium">Roles</label>
                <div className="d-flex flex-wrap gap-3">
                  {ROLES.map(r => (
                    <div key={r} className="form-check">
                      <input className="form-check-input" type="checkbox" id={`role-${r}`}
                        checked={roles.includes(r)} onChange={() => toggleRole(r)} />
                      <label className="form-check-label small text-capitalize" htmlFor={`role-${r}`}>{r}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="user-active"
                    checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <label className="form-check-label small" htmlFor="user-active">Account Active</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Order on behalf modal ─────────────────────────────────────────────
function CreateOrderForUserModal({ targetUser, onClose }: { targetUser: User; onClose: () => void }) {
  const nav = useNavigate();
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold"><i className="fas fa-box me-2 text-primary" />Create Order for {targetUser.names}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-4">Choose how you'd like to create this order:</p>
            <div className="d-flex flex-column gap-3">
              <div className="bg-light rounded-3 p-3 d-flex gap-3 align-items-center" style={{ cursor: 'pointer' }}
                onClick={() => { onClose(); nav(`/orders/new?behalf_of=${targetUser.id}&behalf_name=${encodeURIComponent(targetUser.names)}`); }}>
                <div className="stat-icon bg-primary bg-opacity-10 flex-shrink-0" style={{ width: 44, height: 44 }}>
                  <i className="fas fa-edit text-primary" />
                </div>
                <div>
                  <div className="fw-medium small">Fill order form on their behalf</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>You stay as admin — order is attributed to {targetUser.names}</div>
                </div>
                <i className="fas fa-arrow-right text-muted ms-auto" />
              </div>
              <div className="bg-light rounded-3 p-3 d-flex gap-3 align-items-center" style={{ cursor: 'pointer' }}
                onClick={() => { onClose(); nav('/admin/users'); }}>
                <div className="stat-icon bg-warning bg-opacity-10 flex-shrink-0" style={{ width: 44, height: 44 }}>
                  <i className="fas fa-user-secret text-warning" />
                </div>
                <div>
                  <div className="fw-medium small">Impersonate {targetUser.names}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>Switch to their account — see the platform as they do</div>
                </div>
                <i className="fas fa-arrow-right text-muted ms-auto" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User detail drawer ────────────────────────────────────────────────────────
function UserDrawer({ u, onClose, onEdit, onImpersonate, onDelete, onCreateOrder }: {
  u: User; onClose: () => void; onEdit: (u: User) => void; onImpersonate: (u: User) => void;
  onDelete: (id: string) => void; onCreateOrder: (u: User) => void;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(400px,94vw)', background: '#fff', zIndex: 201,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom flex-shrink-0">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
              style={{ width: 44, height: 44, fontSize: 17, flexShrink: 0 }}>
              {u.names.charAt(0)}
            </div>
            <div>
              <div className="fw-semibold">{u.names}</div>
              <div className="d-flex gap-1 flex-wrap">
                {u.roles.map(r => <span key={r} className={`badge ${ROLE_COLORS[r] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{r}</span>)}
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {[
            { icon: 'fa-envelope', label: 'Email', value: u.email },
            { icon: 'fa-phone', label: 'Phone', value: u.phone || '—' },
            { icon: 'fa-calendar', label: 'Joined', value: new Date(u.created_at).toLocaleDateString('en-NG') },
            { icon: 'fa-circle-check', label: 'Status', value: u.is_active ? 'Active' : 'Inactive' },
          ].map(i => (
            <div key={i.label} className="d-flex gap-3 mb-3">
              <i className={`fas ${i.icon} text-muted mt-1`} style={{ width: 16, fontSize: 13 }} />
              <div>
                <div className="text-muted" style={{ fontSize: 11 }}>{i.label}</div>
                <div className="small fw-medium">{i.value}</div>
              </div>
            </div>
          ))}

          <div className="border-top pt-3 mt-3">
            <div className="fw-semibold small mb-3">Quick Actions</div>
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={() => onCreateOrder(u)}>
                <i className="fas fa-plus-circle text-primary" />Create Order for this User
              </button>
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={() => onEdit(u)}>
                <i className="fas fa-edit text-primary" />Edit Profile
              </button>
              {!u.roles.some(r => ['admin', 'super_admin', 'staff'].includes(r)) && (
                <button className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2" onClick={() => onImpersonate(u)}>
                  <i className="fas fa-user-secret text-warning" />Impersonate (Act as this User)
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-top flex-shrink-0">
          <button className="btn btn-outline-danger btn-sm w-100" onClick={() => { onClose(); onDelete(u.id); }}>
            <i className="fas fa-trash me-2" />Delete User
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const toast = useToast();
  const navigate = useNavigate();
  const { impersonate, user: me } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [modal, setModal] = useState<null | 'invite'>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [drawer, setDrawer] = useState<User | null>(null);
  const [orderTarget, setOrderTarget] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.list({ page_size: 100, search: search || undefined });
      setUsers(data.items);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => !roleFilter || u.roles.includes(roleFilter));

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await userService.delete(id);
      setUsers(p => p.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleSaved = (updated: User) => setUsers(p => p.map(u => u.id === updated.id ? updated : u));

  const handleImpersonate = async (targetUser: User) => {
    if (targetUser.id === me?.id) { toast.info('That is your own account.'); return; }
    setImpersonating(true);
    try {
      await impersonate(targetUser);
      toast.success(`Now acting as ${targetUser.names}. A banner will remind you.`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setImpersonating(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage platform users, roles, access and act on their behalf"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal('invite')}>
            <i className="fas fa-user-plus me-2" />Invite User
          </button>
        }
      />

      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users', value: users.length, color: 'primary', icon: 'fa-users' },
          { label: 'Customers', value: users.filter(u => u.roles.includes('customer')).length, color: 'success', icon: 'fa-user' },
          { label: 'Staff', value: users.filter(u => u.roles.includes('staff') || u.roles.includes('manager')).length, color: 'info', icon: 'fa-id-badge' },
          { label: 'Drivers', value: users.filter(u => u.roles.includes('driver')).length, color: 'warning', icon: 'fa-car' },
        ].map(s => (
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className={`stat-icon bg-${s.color} bg-opacity-10`} style={{ width: 40, height: 40 }}>
                  <i className={`fas ${s.icon} text-${s.color}`} />
                </div>
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="fw-bold fs-4">{s.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input className="form-control form-control-sm" style={{ maxWidth: 240 }}
          placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value as UserRole | '')}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        {(search || roleFilter) && <button className="btn btn-outline-secondary btn-sm" onClick={() => { setSearch(''); setRoleFilter(''); }}>Clear</button>}
        <span className="ms-auto text-muted small">{filtered.length} users</span>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">User</th>
                  <th className="small fw-medium text-muted">Roles</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted">Joined</th>
                  <th className="small fw-medium text-muted pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon="fa-users" title="No users found" /></td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setDrawer(u)}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary fw-bold flex-shrink-0"
                          style={{ width: 34, height: 34, fontSize: 13 }}>
                          {u.names.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-medium small">{u.names}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {u.roles.map(r => <span key={r} className={`badge ${ROLE_COLORS[r] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{r}</span>)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 11 }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="small text-muted">{new Date(u.created_at).toLocaleDateString('en-NG')}</td>
                    <td className="pe-4" onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-1 flex-wrap">
                        <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditTarget(u)} title="Edit"><i className="fas fa-edit" /></button>
                        <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setOrderTarget(u)} title="Create order for user"><i className="fas fa-plus" /></button>
                        {u.roles.includes('customer') && (
                          <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleImpersonate(u)} title="Impersonate" disabled={impersonating}>
                            <i className="fas fa-user-secret" />
                          </button>
                        )}
                        <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleDelete(u.id)} title="Delete"><i className="fas fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'invite' && (
        <InviteModal onClose={() => setModal(null)} onInvited={u => setUsers(p => [u, ...p])} />
      )}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { handleSaved(updated); setDrawer(null); }}
        />
      )}
      {orderTarget && (
        <CreateOrderForUserModal targetUser={orderTarget} onClose={() => setOrderTarget(null)} />
      )}
      {drawer && !editTarget && !orderTarget && (
        <UserDrawer
          u={drawer}
          onClose={() => setDrawer(null)}
          onEdit={u => setEditTarget(u)}
          onImpersonate={handleImpersonate}
          onDelete={handleDelete}
          onCreateOrder={u => setOrderTarget(u)}
        />
      )}
    </div>
  );
}
