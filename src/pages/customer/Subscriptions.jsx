import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SectionHeader, EmptyState, LoadingSpinner } from '../../components/shared/index.jsx';
import { subscriptionService, planService, usageService } from '../../services/api.js';
import { PAYSTACK_KEY } from '../../services/api.js';
import { MOCK_PLANS, MOCK_SUBSCRIPTIONS, formatNGN } from '../../services/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

// ─── Mock data for demo ────────────────────────────────────────────────────────
const MOCK_MY_LOG = [
  { id:1, order_id:'LD-001', description:'Standard Wash — 12 garments', units_deducted:12, plan_name:'Premium Clean', balance_before:150, balance_after:138, date:'2025-05-24T10:30:00Z', staff:'Chioma U.' },
  { id:2, order_id:'LD-003', description:'Dry Cleaning — 8 garments',   units_deducted:8,  plan_name:'Premium Clean', balance_before:138, balance_after:130, date:'2025-05-23T14:20:00Z', staff:'Musa A.' },
  { id:3, order_id:'LD-004', description:'Standard Wash — 20 garments', units_deducted:20, plan_name:'Multiple Plans', balance_before:180, balance_after:160, date:'2025-05-22T09:10:00Z', staff:'Chioma U.', merged:true, breakdown:[{plan:'Basic Wash',units:10},{plan:'Premium Clean',units:10}] },
  { id:4, order_id:'LD-005', description:'Ironing Only — 3 garments',   units_deducted:3,  plan_name:'Basic Wash',    balance_before:50,  balance_after:47,  date:'2025-05-21T11:00:00Z', staff:'Musa A.' },
];

// ─── Paystack flow ─────────────────────────────────────────────────────────────
// Full flow:
//   1. Try backend initiate → gets authorization_url (Paystack hosted page, supports recurring plan_code)
//   2. If backend returns redirect URL → redirect customer there (Paystack handles recurring setup)
//   3. On return, URL has ?reference= → we verify with backend
//   4. If backend unreachable → fall back to PaystackPop inline (one-time charge, no plan_code)
//   5. Demo mode (no Paystack loaded) → simulate after 1.2s

async function initiateSubscription({ plan, email, onSuccess, onClose, toast }) {
  // ── Step 1: Try backend-generated authorization URL (proper recurring) ──────
  try {
    const res = await subscriptionService.initiate(plan.id, email);
    if (res?.authorization_url) {
      // Paystack will handle recurring billing via plan_code
      // Store pending plan info for when customer returns
      sessionStorage.setItem('pending_sub', JSON.stringify({ plan_id: plan.id, plan_name: plan.name }));
      window.location.href = res.authorization_url;
      return; // page navigates away
    }
    // Backend returned success without redirect (e.g. already subscribed via token)
    if (res?.success) { onSuccess(res.reference || `BE-${Date.now()}`, plan); return; }
  } catch (err) {
    // Backend unavailable — fall through to inline
    console.warn('Backend initiate failed, trying inline:', err.message);
  }

  // ── Step 2: PaystackPop inline (no plan_code, one-time charge) ──────────────
  if (window.PaystackPop) {
    const ref = `SL-SUB-${plan.id}-${Date.now()}`;
    return new Promise((resolve) => {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email,
        amount: plan.amount * 100, // kobo
        currency: 'NGN',
        ref,
        // plan: plan.paystack_plan_code  ← backend should inject this if available
        metadata: { plan_id: plan.id, plan_name: plan.name, type: 'subscription' },
        callback: async (response) => {
          toast.info('Verifying payment…');
          try {
            // Verify with backend
            const verified = await subscriptionService.verify(response.reference);
            toast.success(verified?.message || 'Payment verified!');
            onSuccess(response.reference, plan);
          } catch {
            // If verify endpoint fails, still credit locally (demo/dev)
            onSuccess(response.reference, plan);
          }
          resolve();
        },
        onClose: () => { onClose && onClose(); resolve(); },
      });
      handler.openIframe();
    });
  }

  // ── Step 3: Demo fallback ──────────────────────────────────────────────────
  toast.info('Processing payment (demo mode)…');
  await new Promise(r => setTimeout(r, 1400));
  onSuccess(`DEMO-${Date.now()}`, plan);
}

// ─── Sub status badge ─────────────────────────────────────────────────────────
function SubStatusBadge({ status }) {
  const map = {
    active:    { cls: 'bg-success', label: 'Active' },
    paused:    { cls: 'bg-warning text-dark', label: 'Paused' },
    cancelled: { cls: 'bg-danger', label: 'Cancelled' },
    pending:   { cls: 'bg-secondary', label: 'Pending' },
    expired:   { cls: 'bg-secondary', label: 'Expired' },
  };
  const { cls, label } = map[status] || map.pending;
  return <span className={`badge ${cls}`} style={{ fontSize: 10 }}>{label}</span>;
}

// ─── Manage dropdown for a subscription ───────────────────────────────────────
function ManageDropdown({ sub, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
          style={{ position:'absolute', right:0, top:'calc(100% + 4px)', width:180, zIndex:100 }}>
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
      body: `Are you sure you want to cancel your "${sub?.plan_name}" subscription? Your remaining units will still be usable until the end of the current billing period.`,
      btnClass: 'btn-danger', btnLabel: 'Yes, Cancel',
    },
    pause: {
      title: 'Pause Subscription',
      body: `Your "${sub?.plan_name}" subscription will be paused. No new charges will be made and your units will remain available. You can resume anytime.`,
      btnClass: 'btn-warning', btnLabel: 'Pause Subscription',
    },
  };
  const info = MAP[action];
  if (!info) return null;
  return (
    <div className="modal show d-block" style={{ background:'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered">
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

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, activePlanIds, onSubscribe, loading }) {
  const isActive = activePlanIds.includes(plan.id);
  return (
    <div className={`bg-white rounded-3 border p-4 h-100 d-flex flex-column ${plan.popular ? 'border-primary border-2' : ''}`}>
      {plan.popular && <span className="badge bg-primary mb-2" style={{ width:'fit-content' }}>Most Popular</span>}
      <h5 className="fw-bold mb-1" style={{ fontFamily:'var(--font-display)' }}>{plan.name}</h5>
      <div className="fw-bold text-primary fs-3 mb-0">{formatNGN(plan.amount)}</div>
      <div className="text-muted small mb-3">/month · {plan.units} units</div>
      <p className="text-muted small flex-1 mb-3">{plan.description}</p>
      <ul className="list-unstyled small mb-4">
        {[`${plan.units} laundry units / month`,'Use across any service','Merge with other plans','Recurring auto-renewal',].map(f=>(
          <li key={f} className="mb-1"><i className="fas fa-check text-success me-2" />{f}</li>
        ))}
      </ul>
      <button
        className={`btn w-100 ${isActive ? 'btn-outline-success' : 'btn-primary'}`}
        onClick={() => onSubscribe(plan)}
        disabled={loading === plan.id}
      >
        {loading === plan.id
          ? <><span className="spinner-border spinner-border-sm me-2"/>Processing…</>
          : isActive
            ? <><i className="fas fa-plus me-2"/>Add More Units</>
            : <><i className="fas fa-credit-card me-2"/>Subscribe — {formatNGN(plan.amount)}/mo</>
        }
      </button>
      {isActive && (
        <div className="text-center mt-2 small text-success">
          <i className="fas fa-check-circle me-1"/>Active subscription
        </div>
      )}
    </div>
  );
}

// ─── Active subscription card ─────────────────────────────────────────────────
function SubscriptionCard({ sub, onAction }) {
  const pct = sub.units > 0 ? Math.min(100, Math.round((sub.units_used / sub.units) * 100)) : 0;
  const bar = pct > 80 ? 'bg-danger' : pct > 60 ? 'bg-warning' : 'bg-success';
  return (
    <div className="bg-white rounded-3 border p-4 mb-3">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <div className="fw-semibold">{sub.plan_name}</div>
          <div className="text-muted small">
            Since {new Date(sub.subscribed_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}
            {sub.renews_at && ` · Renews ${new Date(sub.renews_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}`}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <SubStatusBadge status={sub.status} />
          {sub.status !== 'cancelled' && sub.status !== 'expired' && (
            <ManageDropdown sub={sub} onAction={onAction} />
          )}
        </div>
      </div>

      <div className="row g-2 mb-3 text-center">
        {[
          { label:'Total Units', value:sub.units,           color:'text-dark' },
          { label:'Used',        value:sub.units_used,      color:'text-danger' },
          { label:'Remaining',   value:sub.units_remaining, color:'text-success' },
        ].map(s=>(
          <div key={s.label} className="col-4">
            <div className={`fw-bold fs-5 ${s.color}`}>{s.value}</div>
            <div className="text-muted" style={{fontSize:11}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="d-flex justify-content-between small mb-1">
          <span className="text-muted">Unit usage</span>
          <span className={pct>80?'text-danger fw-medium':'text-muted'}>{pct}%</span>
        </div>
        <div className="progress" style={{height:8,borderRadius:6}}>
          <div className={`progress-bar ${bar}`} style={{width:`${pct}%`,borderRadius:6,transition:'width 0.6s'}}/>
        </div>
        {sub.units_remaining <= 20 && sub.status === 'active' && (
          <div className="text-danger small mt-1">
            <i className="fas fa-exclamation-triangle me-1"/>Low units — consider adding another plan
          </div>
        )}
        {sub.status === 'paused' && (
          <div className="text-warning small mt-1">
            <i className="fas fa-pause-circle me-1"/>Paused — no new charges. Units still usable.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage log ────────────────────────────────────────────────────────────────
function UsageLog({ log, loading }) {
  if (loading) return <LoadingSpinner message="Loading usage history…"/>;
  if (log.length === 0) return (
    <EmptyState
      icon="fa-chart-bar"
      title="No usage records yet"
      message="Your unit consumption history appears here once orders start being processed."
    />
  );

  const totalDeducted = log.reduce((s,l) => s + (l.units_deducted||0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label:'Total Records', value:log.length,                                          color:'text-primary' },
          { label:'Units Consumed', value:totalDeducted,                                      color:'text-danger' },
          { label:'Orders Covered', value:log.filter(l=>l.order_id).length,                  color:'text-success' },
          { label:'Merged Deductions', value:log.filter(l=>l.merged).length,                 color:'text-warning' },
        ].map(s=>(
          <div key={s.label} className="col-6 col-sm-3">
            <div className="bg-white rounded-3 border p-3 text-center">
              <div className={`fw-bold fs-4 ${s.color}`}>{s.value}</div>
              <div className="text-muted small">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="d-flex flex-column gap-3 d-md-none">
        {log.map((entry,idx) => (
          <div key={entry.id} className="bg-white rounded-3 border p-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-medium small">{entry.order_id || '—'}</div>
                <div className="text-muted" style={{fontSize:11}}>
                  {new Date(entry.date).toLocaleString('en-NG',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
              <span className="badge bg-danger bg-opacity-15 text-danger fw-bold" style={{fontSize:13}}>
                −{entry.units_deducted}
              </span>
            </div>
            <div className="small text-muted mb-2">{entry.description}</div>
            {entry.merged && entry.breakdown && (
              <div className="bg-warning bg-opacity-10 rounded-2 p-2 mb-2">
                <div className="small fw-medium mb-1"><i className="fas fa-code-merge me-1 text-warning"/>Merged from:</div>
                {entry.breakdown.map((b,i)=>(
                  <div key={i} className="d-flex justify-content-between small">
                    <span className="text-muted">{b.plan}</span>
                    <span className="fw-medium">{b.units} units</span>
                  </div>
                ))}
              </div>
            )}
            <div className="d-flex justify-content-between align-items-center small border-top pt-2 mt-2">
              <span className="text-muted">Before: <strong>{entry.balance_before}</strong></span>
              <i className="fas fa-long-arrow-alt-right text-muted"/>
              <span className="text-muted">After: <strong className="text-success">{entry.balance_after}</strong></span>
            </div>
            {entry.staff && (
              <div className="text-muted mt-1" style={{fontSize:11}}>
                <i className="fas fa-user-circle me-1"/>Recorded by {entry.staff}
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
                {['#','Date & Time','Order','Description / Plan(s)','Units Used','Before','After'].map(h=>(
                  <th key={h} className={`small fw-medium text-muted py-2 ${h==='#'?'ps-4':''} ${h==='After'?'pe-4':''}`} style={{fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((entry,idx)=>(
                <tr key={entry.id}>
                  <td className="ps-4 text-muted small">{idx+1}</td>
                  <td className="small text-muted" style={{whiteSpace:'nowrap'}}>
                    {new Date(entry.date).toLocaleString('en-NG',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td className="small fw-medium">{entry.order_id||'—'}</td>
                  <td className="small" style={{maxWidth:260}}>
                    <div>{entry.description}</div>
                    {entry.merged && entry.breakdown && (
                      <div className="mt-1 d-flex flex-wrap gap-1">
                        {entry.breakdown.map((b,i)=>(
                          <span key={i} className="badge bg-warning bg-opacity-15 text-warning-emphasis" style={{fontSize:10}}>
                            <i className="fas fa-code-merge me-1"/>{b.plan}: {b.units}u
                          </span>
                        ))}
                      </div>
                    )}
                    {entry.staff && (
                      <div className="text-muted" style={{fontSize:10}}>
                        <i className="fas fa-user-circle me-1"/>Recorded by {entry.staff}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="badge bg-danger bg-opacity-15 text-danger fw-bold" style={{fontSize:13}}>
                      −{entry.units_deducted}
                    </span>
                  </td>
                  <td className="text-center small fw-medium text-muted">{entry.balance_before}</td>
                  <td className="pe-4 text-center small fw-bold text-success">{entry.balance_after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted small text-center mt-3 mb-0">
        <i className="fas fa-info-circle me-1"/>
        All deductions are recorded by SimplyLovely staff when your garments are received.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Subscriptions() {
  const { user } = useAuth();
  const toast = useToast();
  const { loadUsage } = useAppData();

  const [plans, setPlans]             = useState(MOCK_PLANS);
  const [subscriptions, setSubs]      = useState(MOCK_SUBSCRIPTIONS);
  const [usageLog, setUsageLog]       = useState(MOCK_MY_LOG);
  const [logLoading, setLogLoading]   = useState(false);
  const [paying, setPaying]           = useState(null);   // plan.id being processed
  const [confirm, setConfirm]         = useState(null);   // { action, sub }
  const [actioning, setActioning]     = useState(null);
  const [tab, setTab]                 = useState('plans');
  const [verifying, setVerifying]     = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [plansR, subsR] = await Promise.allSettled([planService.list(), subscriptionService.mySubscriptions()]);
      if (plansR.status==='fulfilled' && plansR.value?.plans) setPlans(plansR.value.plans);
      if (subsR.status==='fulfilled'  && subsR.value?.subscriptions) setSubs(subsR.value.subscriptions);
    } catch {}
  }, []);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const d = await usageService.list({ mine: 1 });
      if (d?.usage) setUsageLog(d.usage);
    } catch {}
    setLogLoading(false);
  }, []);

  // ── Handle Paystack return URL (?verify=1&reference=xxx or ?trxref=xxx) ────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('trxref');
    const shouldVerify = params.get('verify') === '1' || !!ref;
    if (ref && shouldVerify) {
      setVerifying(true);
      setTab('active');
      (async () => {
        try {
          const result = await subscriptionService.verify(ref);
          const pending = sessionStorage.getItem('pending_sub');
          const planInfo = pending ? JSON.parse(pending) : null;
          sessionStorage.removeItem('pending_sub');
          toast.success(result?.message || `🎉 Subscription activated! ${planInfo ? planInfo.plan_name + ' plan' : ''} is now active.`);
          await loadData();
          await loadUsage();
        } catch (err) {
          toast.error('Could not verify payment: ' + err.message + '. Please contact support if units were charged.');
        } finally {
          setVerifying(false);
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
    loadData();
  }, []);

  useEffect(() => { if (tab === 'log') loadLog(); }, [tab]);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const handleSubscribe = async (plan) => {
    setPaying(plan.id);
    try {
      await initiateSubscription({
        plan,
        email: user?.email || '',
        toast,
        onSuccess: async (ref, plan) => {
          const newSub = {
            id: Date.now(), plan_id: plan.id, plan_name: plan.name,
            units: plan.units, units_used: 0, units_remaining: plan.units,
            amount: plan.amount, status: 'active',
            subscribed_at: new Date().toISOString().split('T')[0],
            renews_at: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
            payment_ref: ref,
          };
          setSubs(prev => [...prev, newSub]);
          toast.success(`✅ Subscribed to ${plan.name}! ${plan.units} units added.`);
          await loadData();
          await loadUsage();
        },
        onClose: () => toast.info('Payment window closed.'),
      });
    } catch (err) {
      toast.error('Subscription failed: ' + err.message);
    } finally {
      setPaying(null);
    }
  };

  // ── Manage actions (pause/resume/cancel/manage_link) ──────────────────────
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
      // Resume doesn't need a confirm modal
      setActioning(sub.id);
      try {
        await subscriptionService.resume(sub.id);
        setSubs(prev => prev.map(s => s.id===sub.id ? {...s, status:'active'} : s));
        toast.success(`"${sub.plan_name}" subscription resumed.`);
      } catch {
        setSubs(prev => prev.map(s => s.id===sub.id ? {...s, status:'active'} : s));
        toast.success(`Subscription resumed (demo).`);
      } finally { setActioning(null); }
      return;
    }
    // cancel / pause → show confirm modal
    setConfirm({ action, sub });
  };

  const handleConfirmed = async () => {
    if (!confirm) return;
    const { action, sub } = confirm;
    setConfirm(null);
    setActioning(sub.id);
    try {
      if (action === 'cancel') {
        await subscriptionService.cancel(sub.id);
        setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:'cancelled'} : s));
        toast.success(`"${sub.plan_name}" subscription cancelled. Remaining units still usable.`);
      } else if (action === 'pause') {
        await subscriptionService.pause(sub.id);
        setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:'paused'} : s));
        toast.success(`"${sub.plan_name}" paused. No further charges.`);
      }
    } catch {
      // Demo: still update UI
      if (action === 'cancel') setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:'cancelled'} : s));
      if (action === 'pause')  setSubs(prev => prev.map(s => s.id===sub.id ? {...s,status:'paused'} : s));
      toast.success(`${action === 'cancel' ? 'Cancelled' : 'Paused'} (demo).`);
    } finally { setActioning(null); }
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const activeSubs     = subscriptions.filter(s => s.status === 'active');
  const activePlanIds  = activeSubs.map(s => s.plan_id);
  const totalUnits     = subscriptions.reduce((s,sub) => s + (sub.units||0), 0);
  const totalUsed      = subscriptions.reduce((s,sub) => s + (sub.units_used||0), 0);
  const totalRemaining = subscriptions.reduce((s,sub) => s + (sub.units_remaining||0), 0);

  return (
    <div>
      {/* Verifying overlay */}
      {verifying && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-3 p-4 text-center shadow-lg" style={{maxWidth:300}}>
            <div className="spinner-border text-primary mb-3" role="status"/>
            <div className="fw-semibold">Verifying Payment</div>
            <div className="text-muted small">Please wait while we confirm your subscription…</div>
          </div>
        </div>
      )}

      <SectionHeader
        title="My Subscriptions"
        subtitle="Subscribe to volume plans, track usage and manage your laundry units"
      />

      {/* Volume banner (only if has any sub) */}
      {subscriptions.length > 0 && (
        <div className="rounded-3 p-4 mb-4 text-white" style={{background:'linear-gradient(135deg,#1a56db 0%,#0ea5e9 100%)'}}>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="opacity-75 small fw-medium mb-1">Total Volume Balance</div>
              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="fw-bold" style={{fontSize:'2.5rem',lineHeight:1}}>{totalRemaining}</span>
                <span className="opacity-75">units remaining</span>
              </div>
              <div className="progress mb-1" style={{height:6,background:'rgba(255,255,255,0.3)',borderRadius:4}}>
                <div className="progress-bar bg-white"
                  style={{width:`${totalUnits ? Math.round((totalRemaining/totalUnits)*100) : 0}%`,borderRadius:4}}/>
              </div>
              <div className="opacity-75 small">{totalUsed} used · {totalUnits} total across all plans</div>
            </div>
            <div className="col-md-6">
              <div className="row g-2">
                {[
                  {label:'Active Plans',   value:activeSubs.length},
                  {label:'Total Units',    value:totalUnits},
                  {label:'Units Used',     value:totalUsed},
                  {label:'Usage Records',  value:usageLog.length},
                ].map(s=>(
                  <div key={s.label} className="col-6">
                    <div className="rounded-3 p-2 text-center" style={{background:'rgba(255,255,255,0.15)'}}>
                      <div className="fw-bold fs-5">{s.value}</div>
                      <div className="opacity-75" style={{fontSize:11}}>{s.label}</div>
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
        {[
          {key:'plans',  label:'Available Plans',           icon:'fa-layer-group'},
          {key:'active', label:`My Plans (${subscriptions.length})`, icon:'fa-check-circle'},
          {key:'log',    label:`Usage Log (${usageLog.length})`,     icon:'fa-chart-bar'},
        ].map(t=>(
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
              <i className={`fas ${t.icon} me-2 d-none d-sm-inline`}/>{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        <>
          <div className="alert alert-info small mb-4 d-flex gap-3 align-items-start">
            <i className="fas fa-code-merge text-info mt-1 flex-shrink-0"/>
            <div>
              <strong>Multi-plan merging supported.</strong> Subscribe to multiple plans — units pool together.
              When paying for an order you can split the deduction across plans.
              Plans auto-renew monthly via Paystack recurring billing.
            </div>
          </div>
          <div className="row g-4">
            {plans.map(plan=>(
              <div key={plan.id} className="col-md-4">
                <PlanCard plan={plan} activePlanIds={activePlanIds} onSubscribe={handleSubscribe} loading={paying}/>
              </div>
            ))}
          </div>
          {/* How it works */}
          <div className="bg-light rounded-3 p-4 mt-4">
            <h6 className="fw-semibold mb-3"><i className="fas fa-info-circle text-primary me-2"/>How subscriptions work</h6>
            <div className="row g-3">
              {[
                {step:'1',title:'Pick a Plan',  desc:'Subscribe to one or more plans. Units are pooled together.'},
                {step:'2',title:'Pay via Paystack',desc:'Card, transfer or USSD. Auto-renews monthly — cancel anytime.'},
                {step:'3',title:'Use for Orders', desc:'Select "Pay from Subscription" when creating an order. Split across plans.'},
                {step:'4',title:'Track Everything',desc:'Full log of every unit deduction with before/after balance.'},
              ].map(s=>(
                <div key={s.step} className="col-sm-6 col-lg-3">
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold flex-shrink-0"
                      style={{width:28,height:28,fontSize:12}}>{s.step}</div>
                    <div>
                      <div className="fw-medium small">{s.title}</div>
                      <div className="text-muted" style={{fontSize:11}}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── My Plans tab ── */}
      {tab === 'active' && (
        <>
          {subscriptions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-layer-group fa-3x d-block mb-3 opacity-25"/>
              <p className="mb-3">No subscriptions yet.</p>
              <button className="btn btn-primary" onClick={()=>setTab('plans')}>Browse Plans</button>
            </div>
          ) : (
            <>
              <p className="text-muted small mb-4">
                Units from all active plans pool together. Paused plans retain your units but stop billing.
                Cancelled plans remain usable until period end.
              </p>
              {subscriptions.map(sub=>(
                <div key={sub.id} style={{opacity: actioning===sub.id ? 0.6 : 1, transition:'opacity 0.2s'}}>
                  <SubscriptionCard sub={sub} onAction={handleAction}/>
                </div>
              ))}
              <div className="text-center mt-2">
                <button className="btn btn-outline-primary btn-sm" onClick={()=>setTab('plans')}>
                  <i className="fas fa-plus me-2"/>Add Another Plan
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Usage Log tab ── */}
      {tab === 'log' && (
        <>
          <p className="text-muted small mb-4">
            Every unit deduction recorded by SimplyLovely staff when your garments are received and processed.
          </p>
          <UsageLog log={usageLog} loading={logLoading}/>
        </>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          action={confirm.action}
          sub={confirm.sub}
          onConfirm={handleConfirmed}
          onClose={()=>setConfirm(null)}
        />
      )}
    </div>
  );
}
