import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, EmptyState } from '@/components/shared/index.tsx';
import { usageService, userService, subscriptionService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import { useAppData } from '@/context/AppDataContext.tsx';
import type { UsageLogEntry, Subscription, User, UsagePaymentSource } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

function fmtDT(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface RecordForm {
  user_id: string;
  subscription_id: string;
  units_used: string;
  order_reference: string;
  notes: string;
  payment_method: UsagePaymentSource;
}

const EMPTY_FORM: RecordForm = {
  user_id: '', subscription_id: '', units_used: '',
  order_reference: '', notes: '', payment_method: 'subscription',
};

export default function UsageRecording() {
  const toast = useToast();
  const { loadUsage } = useAppData();

  const [usageLog, setUsageLog] = useState<UsageLogEntry[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [userSubs, setUserSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM);

  const loadLog = useCallback(async () => {
    try {
      const d = await usageService.list({ page_size: 100 });
      setUsageLog(d.items);
    } catch (err) {
      toast.error(errMsg(err));
    }
  }, []);

  useEffect(() => {
    loadLog();
    userService.list({ page_size: 100 })
      .then(d => setCustomers(d.items.filter(u => u.roles.includes('customer'))))
      .catch(() => { /* ignore */ });
  }, []);

  const loadUserSubs = async (uid: string) => {
    if (!uid) { setUserSubs([]); return; }
    try {
      const subs = await subscriptionService.forUser(uid);
      setUserSubs(subs.filter(s => s.status === 'active'));
    } catch {
      setUserSubs([]);
    }
  };

  const handleUserChange = (uid: string) => {
    setForm(p => ({ ...p, user_id: uid, subscription_id: '' }));
    loadUserSubs(uid);
  };

  const selectedSub = userSubs.find(s => String(s.id) === form.subscription_id);

  const handleSubmit = async () => {
    if (!form.user_id) return toast.error('Select a customer');
    const units = Number(form.units_used);
    if (!units || units <= 0) return toast.error('Units must be > 0');
    if (form.payment_method === 'subscription') {
      if (!form.subscription_id) return toast.error('Select a subscription plan');
      if (selectedSub && units > selectedSub.units_remaining)
        return toast.error(`Not enough units. ${selectedSub.plan_name} has only ${selectedSub.units_remaining} left.`);
    }

    setSaving(true);
    try {
      /* const entry = await usageService.record({
        user_id: form.user_id,
        subscription_id: form.payment_method === 'subscription' ? String(form.subscription_id) : undefined,
        units_used: units,
        order_reference: form.order_reference || undefined,
        description: form.notes || undefined,
        payment_method: form.payment_method,
      }); */
      const entry = await usageService.record({
          user_id: form.user_id,
          subscription_id: form.payment_method === 'subscription' ? form.subscription_id : undefined,   // was Number(form.subscription_id)
          units_used: units,
          order_reference: form.order_reference || undefined,
          description: form.notes || undefined,
          payment_method: form.payment_method,
        });

      setUsageLog(p => [entry, ...p]);
      toast.success('Usage recorded successfully!');
      setForm(EMPTY_FORM);
      setUserSubs([]);
      setShowForm(false);
      loadUsage();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const f = (k: keyof RecordForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const totalToday = usageLog
    .filter(u => u.created_at?.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((s, u) => s + (u.units_deducted || 0), 0);

  return (
    <div>
      <SectionHeader
        title="Usage Recording"
        subtitle="Record garment intake and deduct from customer subscription plans"
        actions={
          <button data-tour="tour-usage-record" className="btn btn-primary btn-sm" onClick={() => setShowForm(p => !p)}>
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} me-1`} />
            {showForm ? 'Cancel' : 'Record Usage'}
          </button>
        }
      />

      <div className="row g-3 mb-4" data-tour="tour-usage-stats">
        {[
          { label: 'Total Records', value: usageLog.length, color: 'var(--primary)' },
          { label: 'Units Today', value: totalToday, color: 'var(--warning)' },
          { label: 'All-time Units', value: usageLog.reduce((s, u) => s + (u.units_deducted || 0), 0), color: 'var(--info)' },
          { label: 'Via Subscription', value: usageLog.filter(u => u.source === 'subscription').length, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="fw-bold fs-4" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-3 border p-4 mb-4">
          <h6 className="fw-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            <i className="fas fa-plus-circle me-2" style={{ color: 'var(--primary)' }} />
            Record Garment Intake
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-medium">Customer *</label>
              <select className="form-select" value={form.user_id} onChange={e => handleUserChange(e.target.value)}>
                <option value="">Select customer…</option>
                {customers.map(u => <option key={u.id} value={u.id}>{u.names} — {u.email}</option>)}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-medium">Payment Method *</label>
              <div className="d-flex gap-4 pt-2">
                {([
                  { val: 'subscription' as const, label: 'From Subscription', icon: 'fa-layer-group' },
                  { val: 'direct' as const, label: 'Direct / Cash', icon: 'fa-credit-card' },
                ]).map(opt => (
                  <div key={opt.val} className="form-check">
                    <input className="form-check-input" type="radio" name="pm" id={`pm-${opt.val}`}
                      checked={form.payment_method === opt.val}
                      onChange={() => setForm(p => ({ ...p, payment_method: opt.val, subscription_id: '' }))} />
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
              <label className="form-label small fw-medium">Order Reference (optional)</label>
              <input className="form-control" value={form.order_reference} onChange={f('order_reference')} placeholder="e.g. LD-006" />
            </div>

            <div className="col-12">
              <label className="form-label small fw-medium">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={f('notes')}
                placeholder="Any notes about the garments received…" />
            </div>
          </div>

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
                : <><i className="fas fa-save me-2" />Record Usage</>}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3 border overflow-hidden" data-tour="tour-usage-log">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-semibold mb-0">Usage Log</h6>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadLog}>
            <i className="fas fa-refresh me-1" />Refresh
          </button>
        </div>
        <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table className="table mb-0">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fafafa' }}>
              <tr>
                <th className="ps-4 small fw-medium text-muted">#</th>
                <th className="small fw-medium text-muted">Recorded By</th>
                <th className="small fw-medium text-muted">Date & Time</th>
                <th className="small fw-medium text-muted">Description</th>
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
                    <div className="small fw-medium">{item.user_username || '—'}</div>
                    {item.recorded_by_name && <div className="text-muted" style={{ fontSize: 11 }}>by {item.recorded_by_name}</div>}
                  </td>
                  <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>{fmtDT(item.created_at)}</td>
                  <td className="small text-muted">{item.description || '—'}</td>
                  <td className="small">
                    {item.source === 'direct' ? (
                      <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                        <i className="fas fa-credit-card me-1" />Direct / Cash
                      </span>
                    ) : item.is_merged && item.merge_breakdown ? (
                      <div className="d-flex flex-wrap gap-1">
                        {item.merge_breakdown.map((b, i) => (
                          <span key={i} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 10 }}>
                            <i className="fas fa-code-merge me-1" />{b.plan_name}: {b.units}u
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <i className="fas fa-layer-group me-1" />{item.plan_name || 'Subscription'}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="badge fw-bold"
                      style={{ background: '#fee2e2', color: 'var(--danger)', fontSize: 13 }}>
                      {item.units_deducted}
                    </span>
                  </td>
                  <td className="text-center small fw-medium text-muted">{item.balance_before}</td>
                  <td className="pe-4 text-center small fw-bold" style={{ color: 'var(--success)' }}>
                    {item.balance_after}
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
