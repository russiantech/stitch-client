import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SectionHeader, EmptyState, LoadingSpinner } from '../../components/shared/index.jsx';
import { subscriptionService, planService, usageService } from '../../services/api.js';
import { PAYSTACK_KEY } from '../../services/api.js';
import { MOCK_PLANS, MOCK_SUBSCRIPTIONS, formatNGN } from '../../services/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

// ─── Mock usage log with rich source info ─────────────────────────────────────
const MOCK_MY_LOG = [
  {
    id:1, order_id:'LD-001', description:'Standard Wash — 12 garments',
    units_deducted:12, plan_name:'Premium Clean', plan_id:2,
    balance_before:150, balance_after:138,
    date:'2025-05-24T10:30:00Z', staff:'Chioma U.',
    source_type:'subscription', payment_status:'deducted',
  },
  {
    id:2, order_id:'LD-003', description:'Dry Cleaning — 8 garments',
    units_deducted:8, plan_name:'Premium Clean', plan_id:2,
    balance_before:138, balance_after:130,
    date:'2025-05-23T14:20:00Z', staff:'Musa A.',
    source_type:'subscription', payment_status:'deducted',
  },
  {
    id:3, order_id:'LD-004', description:'Standard Wash — 20 garments',
    units_deducted:20, plan_name:'Multiple Plans', plan_id:null,
    balance_before:180, balance_after:160,
    date:'2025-05-22T09:10:00Z', staff:'Chioma U.',
    source_type:'subscription', payment_status:'deducted',
    merged:true,
    breakdown:[
      { plan_name:'Basic Wash', plan_id:1, units:10 },
      { plan_name:'Premium Clean', plan_id:2, units:10 },
    ],
  },
  {
    id:4, order_id:'LD-005', description:'Ironing Only — 3 garments',
    units_deducted:3, plan_name:'Basic Wash', plan_id:1,
    balance_before:50, balance_after:47,
    date:'2025-05-21T11:00:00Z', staff:'Musa A.',
    source_type:'subscription', payment_status:'deducted',
  },
  {
    id:5, order_id:'LD-006', description:'Express Wash — 5 garments (direct payment)',
    units_deducted:0, plan_name:null, plan_id:null,
    balance_before:47, balance_after:47,
    date:'2025-05-20T08:00:00Z', staff:'Chioma U.',
    source_type:'direct', payment_status:'paid', payment_amount:4000,
  },
];

// ─── Paystack: inline popup first, backend redirect fallback ──────────────────
async function initiateSubscription({ plan, email, isRenew, onSuccess, onClose, toast }) {
  const actionLabel = isRenew ? 'top-up' : 'subscription';

  // 1. Try backend initiate (returns authorization_url for hosted Paystack page + plan_code recurring)
  try {
    const res = await subscriptionService.initiate(plan.id, email);
    if (res?.authorization_url) {
      sessionStorage.setItem('pending_sub', JSON.stringify({
        plan_id: plan.id, plan_name: plan.name, is_renew: isRenew,
      }));
      toast.info(`Redirecting to payment for ${actionLabel}…`);
      window.location.href = res.authorization_url;
      return;
    }
    if (res?.success) {
      onSuccess?.(res.reference || `BE-${Date.now()}`, plan, isRenew);
      return;
    }
  } catch (err) {
    console.warn('Backend initiate failed, trying inline:', err.message);
  }

  // 2. Paystack inline popup (v2 API)
  if (window.PaystackPop) {
    const ref = `ST-SUB-${plan.id}-${Date.now()}`;
    await new Promise((resolve) => {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email,
        amount: plan.amount * 100,
        currency: 'NGN',
        ref,
        // plan: plan.paystack_plan_code  // backend provides if available
        metadata: {
          plan_id: plan.id,
          plan_name: plan.name,
          type: 'subscription',
          is_renew: isRenew,
          action: isRenew ? 'top_up_reset' : 'new_subscription',
        },
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        callback: async (response) => {
          toast.info('Verifying payment…');
          try {
            const verified = await subscriptionService.verify(response.reference);
            toast.success(verified?.message || 'Payment verified!');
          } catch {
            // Verification timeout — webhook will reconcile server-side
            toast.success('Payment received — subscription updating in background.');
          }
          onSuccess?.(response.reference, plan, isRenew);
          resolve();
        },
        onClose: () => {
          onClose?.();
          resolve();
        },
      });
      handler.openIframe();
    });
    return;
  }

  // 3. Demo fallback
  toast.info(`Processing ${actionLabel} (demo)…`);
  await new Promise(r => setTimeout(r, 1400));
  toast.success(`${isRenew ? 'Top-up' : 'Subscription'} activated (demo)!`);
  onSuccess?.(`DEMO-${Date.now()}`, plan, isRenew);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Sub status badge ─────────────────────────────────────────────────────────
function SubStatusBadge({ status }) {
  const MAP = {
    active:    { cls:'bg-success', label:'Active' },
    paused:    { cls:'bg-warning text-dark', label:'Paused' },
    cancelled: { cls:'bg-danger', label:'Cancelled' },
    expired:   { cls:'bg-secondary', label:'Expired' },
    pending:   { cls:'bg-secondary', label:'Pending' },
  };
  const { cls, label } = MAP[status] || MAP.pending;
  return <span className={`badge ${cls}`} style={{ fontSize: 10 }}>{label}</span>;
}

// ─── Manage dropdown ──────────────────────────────────────────────────────────
function ManageDropdown({ sub, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const act = (action) => { setOpen(false); onAction(sub, action); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(p => !p)}>
        <i className="fas fa-ellipsis-v" />
      </button>
      {open && (
        <div className="bg-white border rounded-2 shadow-sm py-1"
          style={{ position:'absolute', right:0, top:'calc(100% + 4px)', width:190, zIndex:100 }}>
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
          {['active','paused'].includes(sub.status) && (
            <>
              <div style={{ height:1, background:'#f0f0f0', margin:'4px 0' }} />
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
function ConfirmModal({ action, sub, onConfirm, onClose }) {
  const MAP = {
    cancel: {
      title: 'Cancel Subscription',
      body: `Cancel your "${sub?.plan_name}" subscription? Remaining units stay usable until the billing period ends. No further charges.`,
      btnClass: 'btn-danger', btnLabel: 'Yes, Cancel',
    },
    pause: {
      title: 'Pause Subscription',
      body: `Pause "${sub?.plan_name}"? No new charges will be made. Your units remain usable. Resume anytime.`,
      btnClass: 'btn-warning', btnLabel: 'Pause It',
    },
  };
  const info = MAP[action];
  if (!info) return null;
  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth:400 }}>
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
// Rules:
//   - Already active with this plan → show "Top Up / Renew" (accent orange)
//   - Different plan, not subscribed → show "Subscribe" (primary purple)
//   - Multiple unique plans allowed in parallel
function PlanCard({ plan, existingSub, onSubscribe, onRenew, loading }) {
  const isLoading   = loading === plan.id;
  const hasThisSub  = !!existingSub && existingSub.status === 'active';
  const isPaused    = !!existingSub && existingSub.status === 'paused';
  const pct         = hasThisSub
    ? Math.min(100, Math.round((existingSub.units_used / existingSub.units) * 100))
    : 0;

  return (
    <div className={`bg-white rounded-3 border p-4 h-100 d-flex flex-column ${plan.popular ? 'sub-active-ring' : ''} ${hasThisSub ? '' : ''}`}
      style={{ position: 'relative' }}>
      {plan.popular && (
        <span className="badge mb-2" style={{ background:'var(--primary)', fontSize:10, width:'fit-content' }}>Most Popular</span>
      )}
      {hasThisSub && (
        <span className="badge mb-2" style={{ background:'var(--success)', fontSize:10, width:'fit-content' }}>
          <i className="fas fa-check-circle me-1" />Active
        </span>
      )}
      {isPaused && (
        <span className="badge mb-2 bg-warning text-dark" style={{ fontSize:10, width:'fit-content' }}>
          <i className="fas fa-pause-circle me-1" />Paused
        </span>
      )}

      <h5 className="fw-bold mb-1" style={{ fontFamily:'var(--font-heading)' }}>{plan.name}</h5>
      <div className="fw-bold fs-3 mb-0" style={{ color:'var(--primary)' }}>{formatNGN(plan.amount)}</div>
      <div className="text-muted small mb-2">/month · {plan.units} units</div>
      {plan.description && <p className="text-muted small flex-1 mb-3">{plan.description}</p>}

      <ul className="list-unstyled small mb-3">
        {[
          `${plan.units} laundry units per billing period`,
          'Use across any service type',
          'Merge units with other plans',
          'Auto-renews · cancel anytime',
        ].map(f => (
          <li key={f} className="mb-1">
            <i className="fas fa-check me-2" style={{ color:'var(--success)' }} />{f}
          </li>
        ))}
      </ul>

      {/* Progress bar if active */}
      {hasThisSub && (
        <div className="mb-3">
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Units used</span>
            <span style={{ color: pct>80 ? 'var(--danger)' : 'var(--text-muted)' }}>{pct}%</span>
          </div>
          <div className="progress" style={{ height:6, borderRadius:4 }}>
            <div
              className="progress-bar"
              style={{
                width:`${pct}%`, borderRadius:4, transition:'width 0.6s',
                backgroundColor: pct>80 ? 'var(--danger)' : pct>60 ? 'var(--warning)' : 'var(--primary)',
              }}
            />
          </div>
          <div className="d-flex justify-content-between small mt-1">
            <span className="text-muted">{existingSub.units_used} used</span>
            <span style={{ color:'var(--success)', fontWeight:600 }}>{existingSub.units_remaining} remaining</span>
          </div>
        </div>
      )}

      {/* CTA */}
      {hasThisSub ? (
        <div className="d-flex flex-column gap-2">
          <button
            className="btn w-100 btn-accent"
            onClick={() => onRenew(plan)}
            disabled={isLoading}
          >
            {isLoading
              ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
              : <><i className="fas fa-rotate me-2" />Top Up / Renew — {formatNGN(plan.amount)}</>
            }
          </button>
          <div className="text-center small text-muted" style={{ fontSize:11 }}>
            Adds {plan.units} units · resets billing period from today
          </div>
        </div>
      ) : isPaused ? (
        <button className="btn btn-outline-secondary w-100" disabled>
          <i className="fas fa-pause me-2" />Paused
        </button>
      ) : (
        <button
          className="btn w-100"
          style={{ background:'var(--primary)', color:'#fff' }}
          onClick={() => onSubscribe(plan)}
          disabled={isLoading}
        >
          {isLoading
            ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
            : <><i className="fas fa-credit-card me-2" />Subscribe — {formatNGN(plan.amount)}/mo</>
          }
        </button>
      )}
    </div>
  );
}

// ─── Subscription card (My Plans tab) ────────────────────────────────────────
function SubscriptionCard({ sub, onAction }) {
  const pct = sub.units > 0 ? Math.min(100,Math.round((sub.units_used/sub.units)*100)) : 0;
  const barColor = pct>80 ? 'var(--danger)' : pct>60 ? 'var(--warning)' : 'var(--primary)';
  return (
    <div className="bg-white rounded-3 border p-4 mb-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <div className="fw-semibold" style={{ fontFamily:'var(--font-heading)' }}>{sub.plan_name}</div>
          <div className="text-muted small">
            Started {fmtDate(sub.subscribed_at)}
            {sub.renews_at && <> · Renews {fmtDate(sub.renews_at)}</>}
          </div>
          {sub.interval && (
            <div style={{ fontSize:11, color:'var(--accent)', fontWeight:600 }}>
              <i className="fas fa-rotate me-1" />{sub.interval} billing
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <SubStatusBadge status={sub.status} />
          {!['cancelled','expired'].includes(sub.status) && (
            <ManageDropdown sub={sub} onAction={onAction} />
          )}
        </div>
      </div>

      <div className="row g-2 text-center mb-3">
        {[
          { label:'Plan Units', value:sub.units, color:'var(--text)' },
          { label:'Used',       value:sub.units_used, color:'var(--danger)' },
          { label:'Remaining',  value:sub.units_remaining, color:'var(--success)' },
        ].map(s => (
          <div key={s.label} className="col-4">
            <div className="fw-bold fs-5" style={{ color:s.color }}>{s.value}</div>
            <div className="text-muted" style={{ fontSize:11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="d-flex justify-content-between small mb-1">
          <span className="text-muted">Usage progress</span>
          <span style={{ color: pct>80 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: pct>80?600:400 }}>{pct}%</span>
        </div>
        <div className="progress" style={{ height:8, borderRadius:6 }}>
          <div className="progress-bar" style={{ width:`${pct}%`, borderRadius:6, backgroundColor:barColor, transition:'width 0.6s' }} />
        </div>
        {sub.units_remaining <= 20 && sub.status==='active' && (
          <div className="small mt-1" style={{ color:'var(--danger)' }}>
            <i className="fas fa-exclamation-triangle me-1" />Low units — consider topping up!
          </div>
        )}
        {sub.status==='paused' && (
          <div className="small mt-1 text-muted">
            <i className="fas fa-pause-circle me-1" />Paused — no charges. Units still usable.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage Log ────────────────────────────────────────────────────────────────
function UsageLogTab({ log, loading }) {
  if (loading) return <LoadingSpinner message="Loading usage history…" />;
  if (log.length===0) return (
    <EmptyState icon="fa-chart-bar" title="No usage records yet"
      message="Your unit deductions appear here after Stitch staff process your garments." />
  );

  const totalDed   = log.reduce((s,l) => s+(l.units_deducted||0), 0);
  const subOrders  = log.filter(l => l.source_type==='subscription');
  const directOrders = log.filter(l => l.source_type==='direct');

  return (
    <div>
      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Entries',       value:log.length,             color:'var(--primary)' },
          { label:'Units Deducted',      value:totalDed,               color:'var(--danger)' },
          { label:'Via Subscription',    value:subOrders.length,       color:'var(--success)' },
          { label:'Direct Payments',     value:directOrders.length,    color:'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="col-6 col-sm-3">
            <div className="bg-white rounded-3 border p-3 text-center">
              <div className="fw-bold fs-4" style={{ color:s.color }}>{s.value}</div>
              <div className="text-muted small">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width:10,height:10,background:'var(--primary)',flexShrink:0 }} />Deducted from subscription
        </div>
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width:10,height:10,background:'var(--accent)',flexShrink:0 }} />Direct / cash payment
        </div>
        <div className="d-flex align-items-center gap-2 small text-muted">
          <span className="rounded-circle" style={{ width:10,height:10,background:'var(--warning)',flexShrink:0 }} />Merged from multiple plans
        </div>
      </div>

      {/* Mobile cards */}
      <div className="d-flex flex-column gap-3 d-md-none">
        {log.map((entry) => (
          <div key={entry.id} className="bg-white rounded-3 border p-3">
            {/* Header row */}
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-medium small">{entry.order_id || '—'}</div>
                <div className="text-muted" style={{ fontSize:11 }}>{fmtDateTime(entry.date)}</div>
              </div>
              <div>
                {entry.source_type === 'subscription' ? (
                  <span className="badge" style={{ background:'var(--primary-light)',color:'var(--primary)',fontSize:11 }}>
                    −{entry.units_deducted}u
                  </span>
                ) : (
                  <span className="badge" style={{ background:'var(--accent-light)',color:'var(--accent-dark)',fontSize:11 }}>
                    {formatNGN(entry.payment_amount||0)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="small text-muted mb-2">{entry.description}</div>

            {/* Source / plan info */}
            <div className="bg-light rounded-2 p-2 mb-2">
              <div className="small fw-medium mb-1">
                {entry.source_type==='subscription' ? (
                  <><i className="fas fa-layer-group me-1" style={{ color:'var(--primary)' }} />Charged from: </>
                ) : (
                  <><i className="fas fa-credit-card me-1" style={{ color:'var(--accent)' }} />Paid directly</>
                )}
              </div>
              {entry.source_type==='subscription' && entry.merged && entry.breakdown ? (
                <div className="d-flex flex-wrap gap-1">
                  {entry.breakdown.map((b,i) => (
                    <span key={i} className="badge" style={{ background:'var(--primary-light)',color:'var(--primary)',fontSize:10 }}>
                      <i className="fas fa-code-merge me-1" />{b.plan_name}: {b.units}u
                    </span>
                  ))}
                </div>
              ) : entry.source_type==='subscription' ? (
                <span className="badge" style={{ background:'var(--primary-light)',color:'var(--primary)',fontSize:10 }}>
                  {entry.plan_name}
                </span>
              ) : null}
            </div>

            {/* Balance trail */}
            {entry.source_type==='subscription' && (
              <div className="d-flex justify-content-between align-items-center small border-top pt-2">
                <div><span className="text-muted">Before:</span> <strong>{entry.balance_before}</strong></div>
                <i className="fas fa-long-arrow-alt-right text-muted" />
                <div><span className="text-muted">After:</span> <strong style={{ color:'var(--success)' }}>{entry.balance_after}</strong></div>
              </div>
            )}
            {entry.staff && (
              <div className="text-muted mt-1" style={{ fontSize:10 }}>
                <i className="fas fa-user-circle me-1" />Recorded by {entry.staff}
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
                  <td className="ps-4 text-muted small">{idx+1}</td>
                  <td className="small text-muted" style={{ whiteSpace:'nowrap' }}>{fmtDateTime(entry.date)}</td>
                  <td className="small fw-medium">{entry.order_id||'—'}</td>
                  <td className="small" style={{ maxWidth:220 }}>
                    <div>{entry.description}</div>
                    {entry.staff && (
                      <div className="text-muted" style={{ fontSize:10 }}>
                        <i className="fas fa-user-circle me-1" />Recorded by {entry.staff}
                      </div>
                    )}
                  </td>
                  <td className="small">
                    {entry.source_type === 'direct' ? (
                      <span className="badge" style={{ background:'var(--accent-light)',color:'var(--accent-dark)' }}>
                        <i className="fas fa-credit-card me-1" />Direct — {formatNGN(entry.payment_amount||0)}
                      </span>
                    ) : entry.merged && entry.breakdown ? (
                      <div className="d-flex flex-wrap gap-1">
                        {entry.breakdown.map((b,i) => (
                          <span key={i} className="badge" style={{ background:'var(--primary-light)',color:'var(--primary)',fontSize:10 }}>
                            <i className="fas fa-code-merge me-1" />{b.plan_name}: {b.units}u
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge" style={{ background:'var(--primary-light)',color:'var(--primary)' }}>
                        <i className="fas fa-layer-group me-1" />{entry.plan_name||'Subscription'}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {entry.source_type==='subscription' ? (
                      <span className="badge" style={{ background:'#fee2e2',color:'var(--danger)',fontSize:13,fontWeight:700 }}>
                        −{entry.units_deducted}
                      </span>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td className="text-center small fw-medium text-muted">
                    {entry.source_type==='subscription' ? entry.balance_before : '—'}
                  </td>
                  <td className="pe-4 text-center small fw-bold" style={{ color:entry.source_type==='subscription'?'var(--success)':'var(--text-muted)' }}>
                    {entry.source_type==='subscription' ? entry.balance_after : '—'}
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
  const { user }   = useAuth();
  const toast      = useToast();
  const { loadUsage } = useAppData();

  const [plans,        setPlans]        = useState(MOCK_PLANS);
  const [subscriptions,setSubs]         = useState(MOCK_SUBSCRIPTIONS);
  const [usageLog,     setUsageLog]     = useState(MOCK_MY_LOG);
  const [logLoading,   setLogLoading]   = useState(false);
  const [paying,       setPaying]       = useState(null);
  const [confirm,      setConfirm]      = useState(null);
  const [actioning,    setActioning]    = useState(null);
  const [tab,          setTab]          = useState('plans');
  const [verifying,    setVerifying]    = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pr, sr] = await Promise.allSettled([planService.list(), subscriptionService.mySubscriptions()]);
      if (pr.status==='fulfilled' && pr.value?.plans) setPlans(pr.value.plans);
      if (sr.status==='fulfilled' && sr.value?.subscriptions) setSubs(sr.value.subscriptions);
    } catch {}
  }, []);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const d = await usageService.list({ mine:1 });
      if (d?.usage) setUsageLog(d.usage);
    } catch {}
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
          const result = await subscriptionService.verify(ref);
          const pending = sessionStorage.getItem('pending_sub');
          const info    = pending ? JSON.parse(pending) : null;
          sessionStorage.removeItem('pending_sub');
          toast.success(result?.message || `✅ ${info?.is_renew ? 'Top-up complete' : 'Subscription active'}! ${info?.plan_name || ''}`);
          await loadData(); await loadUsage();
        } catch (err) {
          toast.error('Could not verify payment: ' + err.message);
        } finally {
          setVerifying(false);
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
    loadData();
  }, []);

  useEffect(() => { if (tab==='log') loadLog(); }, [tab]);

  // Find existing sub for a given plan (if any, any status)
  const existingSubForPlan = (planId) => subscriptions.find(s => s.plan_id===planId);
  const activeSubForPlan   = (planId) => subscriptions.find(s => s.plan_id===planId && s.status==='active');

  // Totals across ALL subscriptions
  const activeSubs     = subscriptions.filter(s => s.status==='active');
  const totalUnits     = subscriptions.reduce((s,sub) => s+(sub.units||0), 0);
  const totalUsed      = subscriptions.reduce((s,sub) => s+(sub.units_used||0), 0);
  const totalRemaining = subscriptions.reduce((s,sub) => s+(sub.units_remaining||0), 0);

  // Subscribe to a NEW plan (no active sub for this plan)
  const handleSubscribe = async (plan) => {
    if (activeSubForPlan(plan.id)) {
      toast.info(`You already have an active ${plan.name} subscription. Use "Top Up / Renew" instead.`);
      return;
    }
    setPaying(plan.id);
    try {
      await initiateSubscription({
        plan, email: user?.email || '', isRenew: false, toast,
        onSuccess: async (ref, plan) => {
          toast.success(`🎉 Subscribed to ${plan.name}! ${plan.units} units added.`);
          const newSub = {
            id: Date.now(), plan_id: plan.id, plan_name: plan.name,
            units: plan.units, units_used: 0, units_remaining: plan.units,
            amount: plan.amount, status:'active', interval:'monthly',
            subscribed_at: new Date().toISOString().split('T')[0],
            renews_at: new Date(Date.now()+30*86400000).toISOString().split('T')[0],
            payment_ref: ref,
          };
          setSubs(prev => [...prev, newSub]);
          await loadData(); await loadUsage();
        },
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (err) {
      toast.error('Subscription failed: ' + err.message);
    } finally { setPaying(null); }
  };

  // Top Up / Renew existing plan: add units + reset billing period
  const handleRenew = async (plan) => {
    const existing = existingSubForPlan(plan.id);
    setPaying(plan.id);
    try {
      await initiateSubscription({
        plan, email: user?.email || '', isRenew: true, toast,
        onSuccess: async (ref, plan) => {
          toast.success(`🔄 ${plan.name} topped up! +${plan.units} units, billing period reset from today.`);
          // Top-up: add units to existing sub and reset renewal date
          setSubs(prev => prev.map(s => {
            if (s.plan_id !== plan.id) return s;
            return {
              ...s,
              units:          plan.units,           // reset to plan quota
              units_used:     0,                    // reset used counter
              units_remaining: plan.units,          // fresh units
              status:         'active',
              subscribed_at:  new Date().toISOString().split('T')[0],
              renews_at:      new Date(Date.now()+30*86400000).toISOString().split('T')[0],
              payment_ref:    ref,
            };
          }));
          await loadData(); await loadUsage();
        },
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (err) {
      toast.error('Top-up failed: ' + err.message);
    } finally { setPaying(null); }
  };

  // Manage actions
  const handleAction = async (sub, action) => {
    if (action === 'manage_link') {
      try {
        const res = await subscriptionService.manageLink(sub.id);
        if (res?.link) { window.open(res.link, '_blank'); return; }
      } catch {}
      toast.info('Visit app.paystack.com to manage your subscription directly.');
      return;
    }
    if (action === 'resume') {
      setActioning(sub.id);
      try { await subscriptionService.resume(sub.id); } catch {}
      setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:'active'} : s));
      toast.success(`"${sub.plan_name}" subscription resumed.`);
      setActioning(null);
      return;
    }
    setConfirm({ action, sub });
  };

  const handleConfirmed = async () => {
    if (!confirm) return;
    const { action, sub } = confirm;
    setConfirm(null);
    setActioning(sub.id);
    try {
      if (action==='cancel') { await subscriptionService.cancel(sub.id); }
      if (action==='pause')  { await subscriptionService.pause(sub.id); }
    } catch {}
    setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:action==='cancel'?'cancelled':'paused'} : s));
    toast.success(action==='cancel'
      ? `"${sub.plan_name}" cancelled. Units usable until period end.`
      : `"${sub.plan_name}" paused. No further charges.`);
    setActioning(null);
  };

  const TABS = [
    { key:'plans',  label:'Available Plans',             icon:'fa-layer-group' },
    { key:'active', label:`My Plans (${subscriptions.length})`, icon:'fa-check-circle' },
    { key:'log',    label:`Usage Log (${usageLog.length})`,     icon:'fa-chart-bar' },
  ];

  return (
    <div>
      {/* Verifying overlay */}
      {verifying && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center' }}>
          <div className="bg-white rounded-3 p-4 text-center shadow-lg" style={{ maxWidth:300 }}>
            <div className="spinner-border mb-3" role="status" style={{ color:'var(--primary)' }} />
            <div className="fw-semibold" style={{ fontFamily:'var(--font-heading)' }}>Verifying Payment</div>
            <div className="text-muted small mt-1">Confirming your subscription…</div>
          </div>
        </div>
      )}

      <SectionHeader
        title="My Subscriptions"
        subtitle="Manage your volume plans and track unit usage"
      />

      {/* Volume banner */}
      {subscriptions.length > 0 && (
        <div className="rounded-3 p-4 mb-4 text-white"
          style={{ background:'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="opacity-75 small fw-medium mb-1" style={{ fontFamily:'var(--font-heading)' }}>Total Volume Balance</div>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="fw-bold" style={{ fontSize:'2.5rem',lineHeight:1,fontFamily:'var(--font-heading)' }}>{totalRemaining}</span>
                <span className="opacity-75">units remaining</span>
              </div>
              <div className="progress mb-1" style={{ height:6,background:'rgba(255,255,255,0.25)',borderRadius:4 }}>
                <div className="progress-bar bg-white"
                  style={{ width:`${totalUnits?Math.round((totalRemaining/totalUnits)*100):0}%`,borderRadius:4 }} />
              </div>
              <div className="opacity-75 small">{totalUsed} used · {totalUnits} total across {activeSubs.length} active plan(s)</div>
            </div>
            <div className="col-md-6">
              <div className="row g-2">
                {[
                  { label:'Active Plans',   value:activeSubs.length },
                  { label:'Total Units',    value:totalUnits },
                  { label:'Units Used',     value:totalUsed },
                  { label:'Usage Records',  value:usageLog.length },
                ].map(s => (
                  <div key={s.label} className="col-6">
                    <div className="rounded-3 p-2 text-center" style={{ background:'rgba(255,255,255,0.15)' }}>
                      <div className="fw-bold fs-5" style={{ fontFamily:'var(--font-heading)' }}>{s.value}</div>
                      <div className="opacity-75" style={{ fontSize:11 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map(t => (
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon} me-2 d-none d-sm-inline`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Plans tab */}
      {tab === 'plans' && (
        <>
          <div className="alert alert-info small mb-4 d-flex gap-3 align-items-start" style={{ borderColor:'var(--info)', background:'#e0f2fe' }}>
            <i className="fas fa-circle-info mt-1 flex-shrink-0" style={{ color:'var(--info)' }} />
            <div>
              <strong>How plans work:</strong> Subscribe to one or more <em>different</em> plans simultaneously — units pool together.
              If you already have a plan, top it up to add fresh units and reset the billing period.
              Same plan = top-up. Different plan = subscribe in parallel. All units usable together.
            </div>
          </div>
          <div className="row g-4">
            {plans.map(plan => (
              <div key={plan.id} className="col-md-4">
                <PlanCard
                  plan={plan}
                  existingSub={existingSubForPlan(plan.id)}
                  onSubscribe={handleSubscribe}
                  onRenew={handleRenew}
                  loading={paying}
                />
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="bg-light rounded-3 p-4 mt-4 border">
            <h6 className="fw-semibold mb-3" style={{ fontFamily:'var(--font-heading)' }}>
              <i className="fas fa-info-circle me-2" style={{ color:'var(--primary)' }} />How subscriptions work
            </h6>
            <div className="row g-3">
              {[
                { step:'1', title:'Pick a Plan', desc:'Choose any plan. You can run multiple different plans at once.' },
                { step:'2', title:'Pay via Paystack', desc:'Inline popup — card, transfer or USSD. Auto-renews each billing period.' },
                { step:'3', title:'Units Pool Together', desc:'All your plan units combine. Use any for any order.' },
                { step:'4', title:'Top Up Anytime', desc:'Same plan → top up & reset. New plan → subscribe in parallel.' },
              ].map(s => (
                <div key={s.step} className="col-sm-6 col-lg-3">
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
                      style={{ width:28,height:28,fontSize:12,background:'var(--primary)' }}>
                      {s.step}
                    </div>
                    <div>
                      <div className="fw-medium small">{s.title}</div>
                      <div className="text-muted" style={{ fontSize:11 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* My Plans tab */}
      {tab === 'active' && (
        <>
          {subscriptions.length===0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-layer-group fa-3x d-block mb-3 opacity-25" />
              <p className="mb-3">No subscriptions yet.</p>
              <button className="btn btn-primary" onClick={()=>setTab('plans')}>Browse Plans</button>
            </div>
          ) : (
            <>
              <p className="text-muted small mb-4">
                <i className="fas fa-circle-info me-1" style={{ color:'var(--primary)' }} />
                Units from all active plans pool together. Paused plans retain units but suspend billing.
                Cancelled plans remain usable until end of billing period.
              </p>
              {subscriptions.map(sub => (
                <div key={sub.id} style={{ opacity:actioning===sub.id?0.6:1,transition:'opacity 0.2s' }}>
                  <SubscriptionCard sub={sub} onAction={handleAction} />
                </div>
              ))}
              <div className="text-center mt-2">
                <button className="btn btn-outline-primary btn-sm" onClick={()=>setTab('plans')}>
                  <i className="fas fa-plus me-2" />Add or Top Up a Plan
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Usage Log tab */}
      {tab === 'log' && (
        <>
          <p className="text-muted small mb-4">
            Every unit deduction is recorded by Stitch staff when your garments are received. Direct-pay orders show the amount charged instead.
          </p>
          <UsageLogTab log={usageLog} loading={logLoading} />
        </>
      )}

      {confirm && (
        <ConfirmModal action={confirm.action} sub={confirm.sub} onConfirm={handleConfirmed} onClose={()=>setConfirm(null)} />
      )}
    </div>
  );
}
