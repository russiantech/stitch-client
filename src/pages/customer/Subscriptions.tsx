import { useState, useEffect, useCallback, useRef } from 'react';
import { SectionHeader, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
import { subscriptionService, planService, usageService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import { useToast } from '@/context/ToastContext.tsx';
import { useAppData } from '@/context/AppDataContext.tsx';
import type { Plan, Subscription, UsageLogEntry, SubscriptionStatus } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// ─── Paystack: inline popup first, backend redirect fallback ──────────────────
// v3
async function initiateSubscription({ plan, email, isRenew, onSuccess, onClose, toast }: {
  plan: Plan; email: string; isRenew: boolean;
  onSuccess: (ref: string, plan: Plan) => void | Promise<void>;
  onClose: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const actionLabel = isRenew ? 'top-up' : 'subscription';

  // Backend always initializes with Paystack first — single source of truth
  // for the reference (format: ST-SUB-20260706122612-4682AB, from generate_reference()).
  let res;
  try {
    res = await subscriptionService.initiate(plan.id, email);
  } catch (err) {
    toast.error(`Could not start ${actionLabel}: ` + errMsg(err));
    return;
  }

  const { reference, access_code, authorization_url } = res;

  sessionStorage.setItem('pending_sub', JSON.stringify({
    plan_id: plan.id, plan_name: plan.name, is_renew: isRenew,
  }));

  // Prefer inline — resume the SAME transaction/reference the backend already created.
  const PaystackPop = (window as any).PaystackPop;
  if (PaystackPop && access_code) {
    const popup = new PaystackPop();
    popup.resumeTransaction(access_code, {
      onSuccess: async (response: { reference: string }) => {
        toast.info('Verifying payment…');
        try {
          await subscriptionService.verifyInline(plan.id, response.reference);
          toast.success('Payment verified!');
        } catch (err) {
          toast.error('Payment verification failed — please contact support with reference: ' + response.reference);
          console.error(err);
        }
        await onSuccess(response.reference, plan);
      },
      onCancel: () => {
        onClose();
      },
    });
    return;
  }

  // Fallback: full redirect, same reference/authorization_url.
  if (authorization_url) {
    toast.info(`Redirecting to payment for ${actionLabel}…`);
    window.location.href = authorization_url;
    return;
  }

  toast.error('Payment could not be started. Please try again.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub status badge ─────────────────────────────────────────────────────────
function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const MAP: Record<SubscriptionStatus, { cls: string; label: string }> = {
    active: { cls: 'bg-success', label: 'Active' },
    paused: { cls: 'bg-warning text-dark', label: 'Paused' },
    cancelled: { cls: 'bg-danger', label: 'Cancelled' },
    expired: { cls: 'bg-secondary', label: 'Expired' },
    pending: { cls: 'bg-secondary', label: 'Pending' },
  };
  const { cls, label } = MAP[status] || MAP.pending;
  return <span className={`badge ${cls}`} style={{ fontSize: 10 }}>{label}</span>;
}

// ─── Manage dropdown ──────────────────────────────────────────────────────────
type ManageAction = 'pause' | 'resume' | 'manage_link' | 'cancel';

function ManageDropdown({ sub, onAction }: { sub: Subscription; onAction: (sub: Subscription, action: ManageAction) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const act = (action: ManageAction) => { setOpen(false); onAction(sub, action); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(p => !p)}>
        <i className="fas fa-ellipsis-v" />
      </button>
      {open && (
        <div className="bg-white border rounded-2 shadow-sm py-1"
          style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', width: 190, zIndex: 100 }}>
          {sub.status === 'active' && (
            <button className="btn btn-link w-100 text-start px-3 py-2 text-decoration-none text-warning-emphasis small"
              onClick={() => act('pause')}>
              <i className="fas fa-pause me-2" />Pause Subscription
            </button>
          )}
          {sub.status === 'paused' && (
            <button className="btn btn-link w-100 text-start px-3 py-2 text-decoration-none text-success small"
              onClick={() => act('resume')}>
              <i className="fas fa-play me-2" />Resume Subscription
            </button>
          )}
          <button className="btn btn-link w-100 text-start px-3 py-2 text-decoration-none text-muted small"
            onClick={() => act('manage_link')}>
            <i className="fas fa-external-link-alt me-2" />Manage on Paystack
          </button>
          {['active', 'paused'].includes(sub.status) && (
            <>
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <button className="btn btn-link w-100 text-start px-3 py-2 text-decoration-none text-danger small"
                onClick={() => act('cancel')}>
                <i className="fas fa-times-circle me-2" />Cancel Subscription
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ action, sub, onConfirm, onClose }: {
  action: 'cancel' | 'pause'; sub: Subscription; onConfirm: () => void; onClose: () => void;
}) {
  const MAP: Record<'cancel' | 'pause', { title: string; body: string; btnClass: string; btnLabel: string }> = {
    cancel: {
      title: 'Cancel Subscription',
      body: `Cancel your "${sub.plan_name}" subscription? Remaining units stay usable until the billing period ends. No further charges.`,
      btnClass: 'btn-danger', btnLabel: 'Yes, Cancel',
    },
    pause: {
      title: 'Pause Subscription',
      body: `Pause "${sub.plan_name}"? No new charges will be made. Your units remain usable. Resume anytime.`,
      btnClass: 'btn-warning', btnLabel: 'Pause It',
    },
  };
  const info = MAP[action];
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h6 className="modal-title fw-semibold">{info.title}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body pt-2">
            <p className="text-muted small mb-0">{info.body}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Nevermind</button>
            <button className={`btn ${info.btnClass} btn-sm`} onClick={onConfirm}>{info.btnLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, existingSub, onSubscribe, onRenew, loading }: {
  plan: Plan; existingSub: Subscription | undefined;
  onSubscribe: (plan: Plan) => void; onRenew: (plan: Plan) => void; loading: number | null;
}) {
  const isLoading = loading === plan.id;
  const hasThisSub = !!existingSub && existingSub.status === 'active';
  const isPaused = !!existingSub && existingSub.status === 'paused';
  const pct = hasThisSub && existingSub
    ? Math.min(100, Math.round((existingSub.units_used / existingSub.units) * 100))
    : 0;

  return (
    <div className={`bg-white rounded-3 border p-4 h-100 d-flex flex-column ${plan.is_popular ? 'sub-active-ring' : ''}`}
      style={{ position: 'relative' }}>
      {plan.is_popular && (
        <span className="badge mb-2" style={{ background: 'var(--primary)', fontSize: 10, width: 'fit-content' }}>Most Popular</span>
      )}
      {hasThisSub && (
        <span className="badge mb-2" style={{ background: 'var(--success)', fontSize: 10, width: 'fit-content' }}>
          <i className="fas fa-check-circle me-1" />Active
        </span>
      )}
      {isPaused && (
        <span className="badge mb-2 bg-warning text-dark" style={{ fontSize: 10, width: 'fit-content' }}>
          <i className="fas fa-pause-circle me-1" />Paused
        </span>
      )}

      <h5 className="fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{plan.name}</h5>
      <div className="fw-bold fs-3 mb-0" style={{ color: 'var(--primary)' }}>{formatNGN(plan.amount)}</div>
      <div className="text-muted small mb-2">/{plan.interval} · {plan.units} units</div>
      {plan.description && <p className="text-muted small flex-1 mb-3">{plan.description}</p>}

      <ul className="list-unstyled small mb-3">
        {[
          `${plan.units} laundry units per billing period`,
          'Use across any service type',
          'Merge units with other plans',
          'Auto-renews · cancel anytime',
        ].map(f => (
          <li key={f} className="mb-1">
            <i className="fas fa-check me-2" style={{ color: 'var(--success)' }} />{f}
          </li>
        ))}
      </ul>

      {hasThisSub && existingSub && (
        <div className="mb-3">
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Units used</span>
            <span style={{ color: pct > 80 ? 'var(--danger)' : 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div className="progress" style={{ height: 6, borderRadius: 4 }}>
            <div
              className="progress-bar"
              style={{
                width: `${pct}%`, borderRadius: 4, transition: 'width 0.6s',
                backgroundColor: pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--primary)',
              }}
            />
          </div>
          <div className="d-flex justify-content-between small mt-1">
            <span className="text-muted">{existingSub.units_used} used</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{existingSub.units_remaining} remaining</span>
          </div>
        </div>
      )}

      {hasThisSub ? (
        <div className="d-flex flex-column gap-2">
          <button className="btn w-100 btn-accent" onClick={() => onRenew(plan)} disabled={isLoading}>
            {isLoading
              ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
              : <><i className="fas fa-rotate me-2" />Top Up / Renew — {formatNGN(plan.amount)}</>}
          </button>
          <div className="text-center small text-muted" style={{ fontSize: 11 }}>
            Adds {plan.units} units · resets billing period from today
          </div>
        </div>
      ) : isPaused ? (
        <button className="btn btn-outline-secondary w-100" disabled>
          <i className="fas fa-pause me-2" />Paused
        </button>
      ) : (
        <button className="btn w-100" style={{ background: 'var(--primary)', color: '#fff' }}
          onClick={() => onSubscribe(plan)} disabled={isLoading}>
          {isLoading
            ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
            : <><i className="fas fa-credit-card me-2" />Subscribe — {formatNGN(plan.amount)}/{plan.interval}</>}
        </button>
      )}
    </div>
  );
}

// ─── Subscription card (My Plans tab) ────────────────────────────────────────
function SubscriptionCard({ sub, onAction }: { sub: Subscription; onAction: (sub: Subscription, action: ManageAction) => void }) {
  const pct = sub.units > 0 ? Math.min(100, Math.round((sub.units_used / sub.units) * 100)) : 0;
  const barColor = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : 'var(--primary)';
  return (
    <div className="bg-white rounded-3 border p-4 mb-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <div className="fw-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{sub.plan_name}</div>
          <div className="text-muted small">
            Started {fmtDate(sub.subscribed_at)}
            {sub.renews_at && <> · Renews {fmtDate(sub.renews_at)}</>}
          </div>
          {sub.interval && (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
              <i className="fas fa-rotate me-1" />{sub.interval} billing
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <SubStatusBadge status={sub.status} />
          {!['cancelled', 'expired'].includes(sub.status) && (
            <ManageDropdown sub={sub} onAction={onAction} />
          )}
        </div>
      </div>

      <div className="row g-2 text-center mb-3">
        {[
          { label: 'Plan Units', value: sub.units, color: 'var(--text)' },
          { label: 'Used', value: sub.units_used, color: 'var(--danger)' },
          { label: 'Remaining', value: sub.units_remaining, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="col-4">
            <div className="fw-bold fs-5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-muted" style={{ fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="d-flex justify-content-between small mb-1">
          <span className="text-muted">Usage progress</span>
          <span style={{ color: pct > 80 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: pct > 80 ? 600 : 400 }}>{pct}%</span>
        </div>
        <div className="progress" style={{ height: 8, borderRadius: 6 }}>
          <div className="progress-bar" style={{ width: `${pct}%`, borderRadius: 6, backgroundColor: barColor, transition: 'width 0.6s' }} />
        </div>
        {sub.units_remaining <= 20 && sub.status === 'active' && (
          <div className="small mt-1" style={{ color: 'var(--danger)' }}>
            <i className="fas fa-exclamation-triangle me-1" />Low units — consider topping up!
          </div>
        )}
        {sub.status === 'paused' && (
          <div className="small mt-1 text-muted">
            <i className="fas fa-pause-circle me-1" />Paused — no charges. Units still usable.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage Log ────────────────────────────────────────────────────────────────
function UsageLogTab({ log, loading }: { log: UsageLogEntry[]; loading: boolean }) {
  if (loading) return <LoadingSpinner message="Loading usage history…" />;
  if (log.length === 0) return (
    <EmptyState icon="fa-chart-bar" title="No usage records yet"
      message="Your unit deductions appear here after Stitch staff process your garments." />
  );

  const totalDed = log.reduce((s, l) => s + (l.units_deducted || 0), 0);
  const subOrders = log.filter(l => l.source === 'subscription');
  const directOrders = log.filter(l => l.source !== 'subscription');

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Entries', value: log.length, color: 'var(--primary)' },
          { label: 'Units Deducted', value: totalDed, color: 'var(--danger)' },
          { label: 'Via Subscription', value: subOrders.length, color: 'var(--success)' },
          { label: 'Direct Payments', value: directOrders.length, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="col-6 col-sm-3">
            <div className="bg-white rounded-3 border p-3 text-center">
              <div className="fw-bold fs-4" style={{ color: s.color }}>{s.value}</div>
              <div className="text-muted small">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width: 10, height: 10, background: 'var(--primary)', flexShrink: 0 }} />Deducted from subscription
        </div>
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width: 10, height: 10, background: 'var(--accent)', flexShrink: 0 }} />Direct / cash payment
        </div>
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width: 10, height: 10, background: 'var(--warning)', flexShrink: 0 }} />Merged from multiple plans
        </div>
      </div>

      {/* Mobile cards */}
      <div className="d-flex flex-column gap-3 d-md-none">
        {log.map((entry) => (
          <div key={entry.id} className="bg-white rounded-3 border p-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-medium small">{entry.order_id ? `#${entry.order_id}` : '—'}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{fmtDateTime(entry.created_at)}</div>
              </div>
              <div>
                {entry.source === 'subscription' ? (
                  <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11 }}>
                    −{entry.units_deducted}u
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', fontSize: 11 }}>
                    {formatNGN(entry.payment_amount || 0)}
                  </span>
                )}
              </div>
            </div>

            <div className="small text-muted mb-2">{entry.description}</div>

            <div className="bg-light rounded-2 p-2 mb-2">
              <div className="small fw-medium mb-1">
                {entry.source === 'subscription' ? (
                  <><i className="fas fa-layer-group me-1" style={{ color: 'var(--primary)' }} />Charged from: </>
                ) : (
                  <><i className="fas fa-credit-card me-1" style={{ color: 'var(--accent)' }} />Paid directly</>
                )}
              </div>
              {entry.source === 'subscription' && entry.is_merged && entry.merge_breakdown ? (
                <div className="d-flex flex-wrap gap-1">
                  {entry.merge_breakdown.map((b, i) => (
                    <span key={i} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 10 }}>
                      <i className="fas fa-code-merge me-1" />{b.plan_name}: {b.units}u
                    </span>
                  ))}
                </div>
              ) : entry.source === 'subscription' ? (
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 10 }}>
                  {entry.plan_name}
                </span>
              ) : null}
            </div>

            {entry.source === 'subscription' && (
              <div className="d-flex justify-content-between align-items-center small border-top pt-2">
                <div><span className="text-muted">Before:</span> <strong>{entry.balance_before}</strong></div>
                <i className="fas fa-long-arrow-alt-right text-muted" />
                <div><span className="text-muted">After:</span> <strong style={{ color: 'var(--success)' }}>{entry.balance_after}</strong></div>
              </div>
            )}
            {entry.recorded_by_name && (
              <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                <i className="fas fa-user-circle me-1" />Recorded by {entry.recorded_by_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="bg-white rounded-3 border overflow-hidden d-none d-md-block">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">#</th>
                <th className="small fw-medium text-muted">Date & Time</th>
                <th className="small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Description</th>
                <th className="small fw-medium text-muted">Source / Plan(s)</th>
                <th className="small fw-medium text-muted text-center">Units</th>
                <th className="small fw-medium text-muted text-center">Before</th>
                <th className="small fw-medium text-muted text-center pe-4">After</th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry, idx) => (
                <tr key={entry.id}>
                  <td className="ps-4 text-muted small">{idx + 1}</td>
                  <td className="small text-muted" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(entry.created_at)}</td>
                  <td className="small fw-medium">{entry.order_id ? `#${entry.order_id}` : '—'}</td>
                  <td className="small" style={{ maxWidth: 220 }}>
                    <div>{entry.description}</div>
                    {entry.recorded_by_name && (
                      <div className="text-muted" style={{ fontSize: 10 }}>
                        <i className="fas fa-user-circle me-1" />Recorded by {entry.recorded_by_name}
                      </div>
                    )}
                  </td>
                  <td className="small">
                    {entry.source !== 'subscription' ? (
                      <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                        <i className="fas fa-credit-card me-1" />Direct — {formatNGN(entry.payment_amount || 0)}
                      </span>
                    ) : entry.is_merged && entry.merge_breakdown ? (
                      <div className="d-flex flex-wrap gap-1">
                        {entry.merge_breakdown.map((b, i) => (
                          <span key={i} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 10 }}>
                            <i className="fas fa-code-merge me-1" />{b.plan_name}: {b.units}u
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <i className="fas fa-layer-group me-1" />{entry.plan_name || 'Subscription'}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {entry.source === 'subscription' ? (
                      <span className="badge" style={{ background: '#fee2e2', color: 'var(--danger)', fontSize: 13, fontWeight: 700 }}>
                        −{entry.units_deducted}
                      </span>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td className="text-center small fw-medium text-muted">
                    {entry.source === 'subscription' ? entry.balance_before : '—'}
                  </td>
                  <td className="pe-4 text-center small fw-bold" style={{ color: entry.source === 'subscription' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {entry.source === 'subscription' ? entry.balance_after : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-muted small text-center mt-3 mb-0">
        <i className="fas fa-lock me-1" />All entries are recorded by Stitch staff. Contact support for disputes.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { user } = useAuth();
  const toast = useToast();
  const { loadUsage } = useAppData();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubs] = useState<Subscription[]>([]);
  const [usageLog, setUsageLog] = useState<UsageLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'cancel' | 'pause'; sub: Subscription } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [tab, setTab] = useState<'plans' | 'active' | 'log'>('plans');
  const [verifying, setVerifying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pr, sr] = await Promise.allSettled([planService.list(), subscriptionService.mySubscriptions()]);
      if (pr.status === 'fulfilled') setPlans(pr.value);
      if (sr.status === 'fulfilled') setSubs(sr.value);
    } catch { /* ignore */ }
  }, []);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const d = await usageService.list({ mine: true });
      setUsageLog(d.items);
    } catch { /* ignore */ }
    setLogLoading(false);
  }, []);

  // Verify Paystack return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      setVerifying(true); setTab('active');
      (async () => {
        try {
          await subscriptionService.verifyCallback(ref);
          const pending = sessionStorage.getItem('pending_sub');
          const info = pending ? JSON.parse(pending) : null;
          sessionStorage.removeItem('pending_sub');
          toast.success(`${info?.is_renew ? 'Top-up complete' : 'Subscription active'}! ${info?.plan_name || ''}`);
          await loadData(); await loadUsage();
        } catch (err) {
          toast.error('Could not verify payment: ' + errMsg(err));
        } finally {
          setVerifying(false);
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
    loadData();
  }, []);

  useEffect(() => { if (tab === 'log') loadLog(); }, [tab, loadLog]);

  const existingSubForPlan = (planId: number) => subscriptions.find(s => s.plan_id === planId);
  const activeSubForPlan = (planId: number) => subscriptions.find(s => s.plan_id === planId && s.status === 'active');

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalUnits = subscriptions.reduce((s, sub) => s + (sub.units || 0), 0);
  const totalUsed = subscriptions.reduce((s, sub) => s + (sub.units_used || 0), 0);
  const totalRemaining = subscriptions.reduce((s, sub) => s + (sub.units_remaining || 0), 0);

  const handleSubscribe = async (plan: Plan) => {
    if (activeSubForPlan(plan.id)) {
      toast.info(`You already have an active ${plan.name} subscription. Use "Top Up / Renew" instead.`);
      return;
    }
    setPaying(plan.id);
    try {
      await initiateSubscription({
        plan, email: user?.email || '', isRenew: false, toast,
        onSuccess: async (_ref, p) => {
          toast.success(`Subscribed to ${p.name}! ${p.units} units added.`);
          await loadData(); await loadUsage();
        },
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (err) {
      toast.error('Subscription failed: ' + errMsg(err));
    } finally { setPaying(null); }
  };

  const handleRenew = async (plan: Plan) => {
    setPaying(plan.id);
    try {
      await initiateSubscription({
        plan, email: user?.email || '', isRenew: true, toast,
        onSuccess: async (_ref, p) => {
          toast.success(`${p.name} topped up! +${p.units} units, billing period reset from today.`);
          await loadData(); await loadUsage();
        },
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (err) {
      toast.error('Top-up failed: ' + errMsg(err));
    } finally { setPaying(null); }
  };

  const handleAction = async (sub: Subscription, action: ManageAction) => {
    if (action === 'manage_link') {
      try {
        const res = await subscriptionService.manageLink(sub.id);
        if (res?.link) { window.open(res.link, '_blank'); return; }
      } catch { /* ignore */ }
      toast.info('Visit app.paystack.com to manage your subscription directly.');
      return;
    }
    if (action === 'resume') {
      setActioning(sub.id);
      try {
        await subscriptionService.resume(sub.id);
        toast.success(`"${sub.plan_name}" subscription resumed.`);
        await loadData();
      } catch (err) {
        toast.error(errMsg(err));
      }
      setActioning(null);
      return;
    }
    if (action === 'cancel' || action === 'pause') setConfirm({ action, sub });
  };

  const handleConfirmed = async () => {
    if (!confirm) return;
    const { action, sub } = confirm;
    setConfirm(null);
    setActioning(sub.id);
    try {
      if (action === 'cancel') await subscriptionService.cancel(sub.id);
      if (action === 'pause') await subscriptionService.pause(sub.id);
      toast.success(action === 'cancel'
        ? `"${sub.plan_name}" cancelled. Units usable until period end.`
        : `"${sub.plan_name}" paused. No further charges.`);
      await loadData();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setActioning(null);
  };

  const TABS: Array<{ key: typeof tab; label: string; icon: string }> = [
    { key: 'plans', label: 'Available Plans', icon: 'fa-layer-group' },
    { key: 'active', label: `My Plans (${subscriptions.length})`, icon: 'fa-check-circle' },
    { key: 'log', label: `Usage Log (${usageLog.length})`, icon: 'fa-chart-bar' },
  ];

  return (
    <div>
      {verifying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-white rounded-3 p-4 text-center shadow-lg" style={{ maxWidth: 300 }}>
            <div className="spinner-border mb-3" role="status" style={{ color: 'var(--primary)' }} />
            <div className="fw-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Verifying Payment</div>
            <div className="text-muted small mt-1">Confirming your subscription…</div>
          </div>
        </div>
      )}

      <SectionHeader title="My Subscriptions" subtitle="Manage your volume plans and track unit usage" />

      {subscriptions.length > 0 && (
        <div className="rounded-3 p-4 mb-4 text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="opacity-75 small fw-medium mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Total Volume Balance</div>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="fw-bold" style={{ fontSize: '2.5rem', lineHeight: 1, fontFamily: 'var(--font-heading)' }}>{totalRemaining}</span>
                <span className="opacity-75">units remaining</span>
              </div>
              <div className="progress mb-1" style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 4 }}>
                <div className="progress-bar bg-white"
                  style={{ width: `${totalUnits ? Math.round((totalRemaining / totalUnits) * 100) : 0}%`, borderRadius: 4 }} />
              </div>
              <div className="opacity-75 small">{totalUsed} used · {totalUnits} total across {activeSubs.length} active plan(s)</div>
            </div>
            <div className="col-md-6">
              <div className="row g-2">
                {[
                  { label: 'Active Plans', value: activeSubs.length },
                  { label: 'Total Units', value: totalUnits },
                  { label: 'Units Used', value: totalUsed },
                  { label: 'Usage Records', value: usageLog.length },
                ].map(s => (
                  <div key={s.label} className="col-6">
                    <div className="rounded-3 p-2 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <div className="fw-bold fs-5" style={{ fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                      <div className="opacity-75" style={{ fontSize: 11 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

     <ul className="nav nav-tabs mb-4">
        {TABS.map(t => (
          <li key={t.key} className="nav-item">
            <button
              data-tour={t.key === 'plans' ? 'tour-sub-plans-tab' : t.key === 'log' ? 'tour-sub-usage-tab' : undefined}
              className={`nav-link ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <i className={`fas ${t.icon} me-2 d-none d-sm-inline`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'plans' && (
        <>
          <div className="alert alert-info small mb-4 d-flex gap-3 align-items-start" style={{ borderColor: 'var(--info)', background: '#e0f2fe' }}>
            <i className="fas fa-circle-info mt-1 flex-shrink-0" style={{ color: 'var(--info)' }} />
            <div>
              <strong>How plans work:</strong> Subscribe to one or more <em>different</em> plans simultaneously — units pool together.
              If you already have a plan, top it up to add fresh units and reset the billing period.
              Same plan = top-up. Different plan = subscribe in parallel. All units usable together.
            </div>
          </div>
          {plans.length === 0 ? (
            <EmptyState icon="fa-layer-group" title="No plans available" message="Check back soon — plans will appear here once configured by the team." />
          ) : (
            <div className="row g-4">
              {plans.filter(p => p.is_active).map(plan => (
                <div key={plan.id} className="col-md-4">
                  <PlanCard plan={plan} existingSub={existingSubForPlan(plan.id)}
                    onSubscribe={handleSubscribe} onRenew={handleRenew} loading={paying} />
                </div>
              ))}
            </div>
          )}

          <div className="bg-light rounded-3 p-4 mt-4 border">
            <h6 className="fw-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              <i className="fas fa-info-circle me-2" style={{ color: 'var(--primary)' }} />How subscriptions work
            </h6>
            <div className="row g-3">
              {[
                { step: '1', title: 'Pick a Plan', desc: 'Choose any plan. You can run multiple different plans at once.' },
                { step: '2', title: 'Pay via Paystack', desc: 'Inline popup — card, transfer or USSD. Auto-renews each billing period.' },
                { step: '3', title: 'Units Pool Together', desc: 'All your plan units combine. Use any for any order.' },
                { step: '4', title: 'Top Up Anytime', desc: 'Same plan → top up & reset. New plan → subscribe in parallel.' },
              ].map(s => (
                <div key={s.step} className="col-sm-6 col-lg-3">
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
                      style={{ width: 28, height: 28, fontSize: 12, background: 'var(--primary)' }}>
                      {s.step}
                    </div>
                    <div>
                      <div className="fw-medium small">{s.title}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'active' && (
        <>
          {subscriptions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-layer-group fa-3x d-block mb-3 opacity-25" />
              <p className="mb-3">No subscriptions yet.</p>
              <button className="btn btn-primary" onClick={() => setTab('plans')}>Browse Plans</button>
            </div>
          ) : (
            <>
              <p className="text-muted small mb-4">
                <i className="fas fa-circle-info me-1" style={{ color: 'var(--primary)' }} />
                Units from all active plans pool together. Paused plans retain units but suspend billing.
                Cancelled plans remain usable until end of billing period.
              </p>
              {subscriptions.map(sub => (
                <div key={sub.id} style={{ opacity: actioning === sub.id ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  <SubscriptionCard sub={sub} onAction={handleAction} />
                </div>
              ))}
              <div className="text-center mt-2">
                <button className="btn btn-outline-primary btn-sm" onClick={() => setTab('plans')}>
                  <i className="fas fa-plus me-2" />Add or Top Up a Plan
                </button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'log' && (
        <>
          <p className="text-muted small mb-4">
            Every unit deduction is recorded by Stitch staff when your garments are received. Direct-pay orders show the amount charged instead.
          </p>
          <UsageLogTab log={usageLog} loading={logLoading} />
        </>
      )}

      {confirm && (
        <ConfirmModal action={confirm.action} sub={confirm.sub} onConfirm={handleConfirmed} onClose={() => setConfirm(null)} />
      )}
    </div>
  );
}
