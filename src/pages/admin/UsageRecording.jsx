import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, EmptyState } from '../../components/shared/index.jsx';
import { usageService, userService, subscriptionService } from '../../services/api.js';
import { MOCK_USAGE_LOG, MOCK_SUBSCRIPTIONS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const MOCK_USERS_LIGHT = [
  { id:1, username:'chiamaka_eze', name:'Chiamaka Eze',   email:'chiamaka@gmail.com' },
  { id:2, username:'emeka_n',      name:'Emeka Nwosu',    email:'emeka@gmail.com' },
  { id:3, username:'bisi_a',       name:'Bisi Adeyemi',   email:'bisi@gmail.com' },
  { id:6, username:'aisha_b',      name:'Aisha Bello',    email:'aisha@gmail.com' },
];

function fmtDT(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
  });
}

export default function UsageRecording() {
  const toast         = useToast();
  const { loadUsage } = useAppData();

  const [usageLog,  setUsageLog]  = useState(MOCK_USAGE_LOG);
  const [users,     setUsers]     = useState(MOCK_USERS_LIGHT);
  const [userSubs,  setUserSubs]  = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    user_id:'', subscription_id:'', units_used:'',
    order_id:'', notes:'', payment_method:'subscription',
  });

  const loadLog = useCallback(async () => {
    try {
      const d = await usageService.list({ include_user:1 });
      if (d?.usage) setUsageLog(d.usage);
    } catch {}
  }, []);

  useEffect(() => {
    loadLog();
    userService.list({ role:'customer' })
      .then(d => d?.users && setUsers(d.users))
      .catch(() => {});
  }, []);

  const loadUserSubs = async (uid) => {
    if (!uid) { setUserSubs([]); return; }
    try {
      const d = await subscriptionService.forUser(uid);
      setUserSubs((d?.subscriptions || []).filter(s => s.status === 'active'));
    } catch {
      setUserSubs(MOCK_SUBSCRIPTIONS.filter(s => s.status === 'active'));
    }
  };

  const handleUserChange = (uid) => {
    setForm(p => ({ ...p, user_id: uid, subscription_id: '' }));
    loadUserSubs(uid);
  };

  const selectedSub = userSubs.find(s => String(s.id) === String(form.subscription_id));

  const handleSubmit = async () => {
    if (!form.user_id) return toast.error('Select a customer');
    if (!Number(form.units_used) || Number(form.units_used) <= 0) return toast.error('Units must be > 0');
    if (form.payment_method === 'subscription') {
      if (!form.subscription_id) return toast.error('Select a subscription plan');
      if (selectedSub && Number(form.units_used) > selectedSub.units_remaining)
        return toast.error(`Not enough units. ${selectedSub.plan_name} has only ${selectedSub.units_remaining} left.`);
    }

    setSaving(true);
    try {
      await usageService.record({
        user_id:         form.user_id,
        subscription_id: form.payment_method === 'subscription' ? form.subscription_id : null,
        units_used:      Number(form.units_used),
        order_id:        form.order_id || null,
        notes:           form.notes    || null,
        payment_method:  form.payment_method,
      });
      toast.success('Usage recorded successfully!');
    } catch {
      toast.success('Usage recorded (demo mode)');
    }

    const u = users.find(u => String(u.id) === String(form.user_id));
    const before = selectedSub?.units_remaining ?? 150;
    const after  = form.payment_method === 'subscription' ? before - Number(form.units_used) : before;

    setUsageLog(p => [{
      id:          Date.now(),
      user:        { username: u?.username || 'user', name: u?.name || '' },
      units_used:  Number(form.units_used),
      total_units: selectedSub?.units ?? 150,
      remaining_units: after,
      order_id:    form.order_id,
      payment_method: form.payment_method,
      plan_name:   selectedSub?.plan_name ?? null,
      status:      'completed',
      created_at:  new Date().toISOString(),
      merged:      false,
    }, ...p]);

    setForm({ user_id:'', subscription_id:'', units_used:'', order_id:'', notes:'', payment_method:'subscription' });
    setUserSubs([]);
    setShowForm(false);
    loadUsage();
    setSaving(false);
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const totalToday = usageLog
    .filter(u => u.created_at?.startsWith(new Date().toISOString().slice(0,10)))
    .reduce((s,u) => s + (u.units_used || 0), 0);

  return (
    <div>
      <SectionHeader
        title="Usage Recording"
        subtitle="Record garment intake and deduct from customer subscription plans"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(p => !p)}>
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} me-1`} />
            {showForm ? 'Cancel' : 'Record Usage'}
          </button>
        }
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Records',     value:usageLog.length,                color:'var(--primary)' },
          { label:'Units Today',       value:totalToday,                     color:'var(--warning)' },
          { label:'All-time Units',    value:usageLog.reduce((s,u)=>s+(u.units_used||0),0), color:'var(--info)' },
          { label:'Via Subscription',  value:usageLog.filter(u=>u.payment_method==='subscription').length, color:'var(--success)' },
        ].map(s => (
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="fw-bold fs-4" style={{ color:s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Record form */}
      {showForm && (
        <div className="bg-white rounded-3 border p-4 mb-4">
          <h6 className="fw-semibold mb-4" style={{ fontFamily:'var(--font-heading)' }}>
            <i className="fas fa-plus-circle me-2" style={{ color:'var(--primary)' }} />
            Record Garment Intake
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-medium">Customer *</label>
              <select className="form-select" value={form.user_id} onChange={e => handleUserChange(e.target.value)}>
                <option value="">Select customer…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-medium">Payment Method *</label>
              <div className="d-flex gap-4 pt-2">
                {[
                  { val:'subscription', label:'From Subscription', icon:'fa-layer-group' },
                  { val:'direct',       label:'Direct / Cash',     icon:'fa-credit-card' },
                ].map(opt => (
                  <div key={opt.val} className="form-check">
                    <input className="form-check-input" type="radio" name="pm" id={`pm-${opt.val}`}
                      checked={form.payment_method === opt.val}
                      onChange={() => setForm(p => ({ ...p, payment_method:opt.val, subscription_id:'' }))} />
                    <label className="form-check-label small" htmlFor={`pm-${opt.val}`}>
                      <i className={`fas ${opt.icon} me-1`} />{opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {form.payment_method === 'subscription' && (
              <div className="col-md-6">
                <label className="form-label small fw-medium">Subscription Plan *</label>
                {!form.user_id ? (
                  <div className="text-muted small pt-1"><i className="fas fa-arrow-up me-1" />Select a customer first</div>
                ) : userSubs.length === 0 ? (
                  <div className="alert alert-warning py-2 small mb-0">
                    <i className="fas fa-exclamation-triangle me-1" />
                    No active subscriptions — switch to Direct payment
                  </div>
                ) : (
                  <select className="form-select" value={form.subscription_id} onChange={f('subscription_id')}>
                    <option value="">Select plan…</option>
                    {userSubs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.plan_name} — {s.units_remaining} units remaining
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="col-md-6">
              <label className="form-label small fw-medium">Garment Count *</label>
              <input type="number" className="form-control" min={1}
                value={form.units_used} onChange={f('units_used')}
                placeholder="Number of garments received" />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-medium">Order ID (optional)</label>
              <input className="form-control" value={form.order_id} onChange={f('order_id')} placeholder="e.g. LD-006" />
            </div>

            <div className="col-12">
              <label className="form-label small fw-medium">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={f('notes')}
                placeholder="Any notes about the garments received…" />
            </div>
          </div>

          {/* Balance preview */}
          {form.payment_method === 'subscription' && selectedSub && form.units_used && (
            <div className={`alert mt-3 small ${Number(form.units_used) > selectedSub.units_remaining ? 'alert-danger' : 'alert-info'}`}>
              <div className="fw-medium mb-1">{selectedSub.plan_name}</div>
              <div className="d-flex gap-4">
                <span>Current: <strong>{selectedSub.units_remaining} units</strong></span>
                <i className="fas fa-arrow-right text-muted" />
                <span>After: <strong className={Number(form.units_used) > selectedSub.units_remaining ? 'text-danger' : 'text-success'}>
                  {selectedSub.units_remaining - Number(form.units_used)} units
                </strong></span>
                {Number(form.units_used) > selectedSub.units_remaining && (
                  <span className="text-danger fw-medium">⚠️ Insufficient units!</span>
                )}
              </div>
            </div>
          )}

          <div className="d-flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                : <><i className="fas fa-save me-2" />Record Usage</>
              }
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Log table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-semibold mb-0">Usage Log</h6>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadLog}>
            <i className="fas fa-refresh me-1" />Refresh
          </button>
        </div>
        <div className="table-responsive" style={{ maxHeight:500, overflowY:'auto' }}>
          <table className="table mb-0">
            <thead style={{ position:'sticky', top:0, zIndex:1, background:'#fafafa' }}>
              <tr>
                <th className="ps-4 small fw-medium text-muted">#</th>
                <th className="small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Date & Time</th>
                <th className="small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Source / Plan</th>
                <th className="small fw-medium text-muted text-center">Units</th>
                <th className="small fw-medium text-muted text-center">Before</th>
                <th className="small fw-medium text-muted text-center pe-4">After</th>
              </tr>
            </thead>
            <tbody>
              {usageLog.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon="fa-chart-bar" title="No usage records yet"
                      message="Record usage when customers drop off garments" />
                  </td>
                </tr>
              ) : usageLog.map((item, idx) => (
                <tr key={item.id}>
                  <td className="ps-4 text-muted small">{idx + 1}</td>
                  <td>
                    <div className="small fw-medium">{item.user?.name || item.user?.username}</div>
                    <div className="text-muted" style={{ fontSize:11 }}>@{item.user?.username}</div>
                  </td>
                  <td className="small text-muted" style={{ whiteSpace:'nowrap' }}>{fmtDT(item.created_at)}</td>
                  <td className="small text-muted">{item.order_id || '—'}</td>
                  <td className="small">
                    {item.payment_method === 'direct' ? (
                      <span className="badge" style={{ background:'var(--accent-light)', color:'var(--accent-dark)' }}>
                        <i className="fas fa-credit-card me-1" />Direct / Cash
                      </span>
                    ) : item.merged && item.breakdown ? (
                      <div className="d-flex flex-wrap gap-1">
                        {item.breakdown.map((b,i) => (
                          <span key={i} className="badge" style={{ background:'var(--primary-light)', color:'var(--primary)', fontSize:10 }}>
                            <i className="fas fa-code-merge me-1" />{b.plan}: {b.units}u
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>
                        <i className="fas fa-layer-group me-1" />{item.plan_name || 'Subscription'}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="badge fw-bold"
                      style={{ background:'#fee2e2', color:'var(--danger)', fontSize:13 }}>
                      {item.units_used}
                    </span>
                  </td>
                  <td className="text-center small fw-medium text-muted">{item.total_units}</td>
                  <td className="pe-4 text-center small fw-bold" style={{ color:'var(--success)' }}>
                    {item.remaining_units}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
