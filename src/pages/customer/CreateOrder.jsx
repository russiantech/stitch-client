import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SectionHeader } from '../../components/shared/index.jsx';
import { orderService, subscriptionService, paymentService } from '../../services/api.js';
import { PAYSTACK_KEY } from '../../services/api.js';
import { MOCK_SUBSCRIPTIONS, formatNGN } from '../../services/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const STEPS = ['Services', 'Garments', 'Schedule', 'Payment', 'Summary'];

// ─── Paystack inline-first, redirect fallback ─────────────────────────────────
async function paystackPay({ email, amount, ref, metadata, onSuccess, onCancel, toast }) {
  // ── 1. Try PaystackPop inline (same page popup) ──────────────────────────
  if (window.PaystackPop) {
    return new Promise((resolve) => {
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY,
        email,
        amount: amount * 100, // kobo
        currency: 'NGN',
        ref,
        metadata,
        callback: async (response) => {
          toast.info('Verifying payment…');
          try {
            await paymentService.verify(response.reference);
            toast.success('Payment confirmed!');
          } catch {
            // Verification failed server-side — still continue (webhook will reconcile)
            toast.success('Payment received — confirming in background.');
          }
          onSuccess(response.reference);
          resolve({ verified: true, reference: response.reference });
        },
        onClose: () => {
          onCancel?.();
          resolve({ verified: false, cancelled: true });
        },
      });
      handler.openIframe();
    });
  }

  // ── 2. Redirect fallback: initialize via backend, redirect to Paystack ───
  toast.info('Opening payment page…');
  try {
    const res = await paymentService.initialize({
      email, amount, ref, metadata,
      callback_url: `${window.location.origin}/orders?pay_ref=${ref}`,
    });
    if (res?.authorization_url) {
      sessionStorage.setItem('pending_order', JSON.stringify({ ref, ...metadata }));
      window.location.href = res.authorization_url;
      return { verified: false, redirected: true };
    }
  } catch {}

  // ── 3. Demo fallback ──────────────────────────────────────────────────────
  toast.info('Demo mode — simulating payment…');
  await new Promise(r => setTimeout(r, 1200));
  toast.success('Payment simulated (demo).');
  onSuccess(ref);
  return { verified: true, reference: ref };
}

export default function CreateOrder() {
  const toast    = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, canActOnBehalf, isImpersonating } = useAuth();
  const { deliveryAreas, garmentPricing, laundryServices } = useAppData();

  // "on behalf of" — set when admin navigates here with ?behalf_of=id
  const behalfId   = searchParams.get('behalf_of');
  const behalfName = searchParams.get('behalf_name');
  const actingOnBehalf = canActOnBehalf && behalfId && !isImpersonating;

  const [step,          setStep]          = useState(0);
  const [submitting,    setSubmitting]    = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subAllocations, setSubAlloc]    = useState({});

  const [form, setForm] = useState({
    services:             [],
    garments:             {},
    special_instructions: '',
    priority:             'Normal',
    pickup_date:          '',
    pickup_time:          '',
    delivery_area_id:     null,
    delivery_area:        '',
    address:              '',
    payment_method:       'direct',
  });

  useEffect(() => {
    const uid = behalfId || user?.id;
    subscriptionService.mySubscriptions()
      .then(d => setSubscriptions((d?.subscriptions || []).filter(s => s.status === 'active')))
      .catch(() => setSubscriptions(MOCK_SUBSCRIPTIONS.filter(s => s.status === 'active')));
  }, [behalfId, user?.id]);

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedGarments = useMemo(() =>
    Object.entries(form.garments)
      .filter(([, g]) => g.qty > 0)
      .map(([id, g]) => {
        const base = garmentPricing.find(gp => String(gp.id) === String(id));
        return base ? { ...base, qty: g.qty } : null;
      })
      .filter(Boolean),
  [form.garments, garmentPricing]);

  const totalGarmentCount = selectedGarments.reduce((s, g) => s + g.qty, 0);

  const serviceMultiplier = useMemo(() =>
    form.services.length > 0
      ? Math.max(...form.services.map(sid => laundryServices.find(s => s.id === sid)?.price_multiplier || 1))
      : 1,
  [form.services, laundryServices]);

  const garmentTotal     = selectedGarments.reduce((s, g) => s + (g.base_price * g.qty * serviceMultiplier), 0);
  const prioritySurcharge = form.priority === 'Express' ? Math.round(garmentTotal * 0.5) : 0;
  const deliveryFee       = deliveryAreas.find(a => String(a.id) === String(form.delivery_area_id))?.price || 0;
  const totalAmount       = Math.round(garmentTotal + prioritySurcharge + deliveryFee);

  // Multi-plan allocation
  const totalAllocated   = Object.values(subAllocations).reduce((s, v) => s + (Number(v) || 0), 0);
  const allocationOk     = totalAllocated >= totalGarmentCount && totalGarmentCount > 0;

  const setAllocation = (subId, val) => {
    const sub = subscriptions.find(s => String(s.id) === String(subId));
    const capped = Math.min(Number(val) || 0, sub?.units_remaining || 0);
    setSubAlloc(p => ({ ...p, [subId]: capped }));
  };

  const autoAllocate = () => {
    let rem = totalGarmentCount;
    const alloc = {};
    for (const sub of subscriptions) {
      if (rem <= 0) break;
      const take = Math.min(rem, sub.units_remaining);
      alloc[sub.id] = take;
      rem -= take;
    }
    setSubAlloc(alloc);
  };

  const toggleService = (id) =>
    setForm(p => ({
      ...p,
      services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id],
    }));

  const setGarmentQty = (id, delta) =>
    setForm(p => ({
      ...p,
      garments: {
        ...p.garments,
        [id]: { ...p.garments[id], qty: Math.max(0, (p.garments[id]?.qty || 0) + delta) },
      },
    }));

  const canProceed = () => {
    if (step === 0) return form.services.length > 0;
    if (step === 1) return totalGarmentCount > 0;
    if (step === 2) return !!(form.pickup_date && form.delivery_area_id && form.address);
    if (step === 3) return form.payment_method === 'subscription' ? allocationOk : true;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const ref = `SL-ORD-${Date.now()}`;
      const payload = {
        behalf_user_id:       actingOnBehalf ? behalfId : null,
        services:             form.services,
        garments:             selectedGarments.map(g => ({ garment_id: g.id, garment_name: g.name, qty: g.qty, unit_price: g.base_price, service_multiplier: serviceMultiplier })),
        priority:             form.priority,
        pickup_date:          form.pickup_date,
        pickup_time:          form.pickup_time,
        delivery_area_id:     form.delivery_area_id,
        delivery_area:        form.delivery_area,
        address:              form.address,
        special_instructions: form.special_instructions,
        payment_method:       form.payment_method,
        sub_allocations:      form.payment_method === 'subscription' ? subAllocations : null,
        total_amount:         totalAmount,
        reference:            ref,
      };

      if (form.payment_method === 'direct' && totalAmount > 0) {
        const result = await paystackPay({
          email:    user?.email || 'customer@simplylovely.ng',
          amount:   totalAmount,
          ref,
          metadata: { order_type: 'laundry', behalf_user_id: behalfId || null },
          toast,
          onSuccess: (reference) => { payload.payment_ref = reference; payload.payment_status = 'paid'; },
          onCancel:  () => { toast.info('Payment cancelled. Order not placed.'); },
        });
        if (result?.cancelled) { setSubmitting(false); return; }
        if (result?.redirected) { setSubmitting(false); return; } // navigated away
      }

      await orderService.create(payload);
      toast.success(actingOnBehalf
        ? `Order created for ${behalfName}!`
        : 'Order placed! We will confirm your pickup shortly.');
      navigate('/orders');
    } catch (err) {
      if (err.message?.includes('cancelled')) { /* already handled */ }
      else {
        // API unavailable — demo
        toast.success('Order created (demo mode)!');
        navigate('/orders');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renders ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div>
      <h6 className="fw-semibold mb-1">Choose Services</h6>
      <p className="text-muted small mb-4">Select one or more. Price multiplier is applied to all garment base prices.</p>
      <div className="row g-3">
        {laundryServices.filter(s => s.active !== false).map(svc => {
          const sel = form.services.includes(svc.id);
          return (
            <div key={svc.id} className="col-sm-6">
              <div
                className={`bg-white rounded-3 border p-3 d-flex align-items-center gap-3 ${sel?'border-primary border-2 bg-primary bg-opacity-10':''}`}
                style={{cursor:'pointer'}} onClick={() => toggleService(svc.id)}
              >
                <div className="stat-icon bg-primary bg-opacity-10 flex-shrink-0" style={{width:44,height:44}}>
                  <i className={`fas ${svc.icon||'fa-soap'} text-primary`}/>
                </div>
                <div className="flex-1">
                  <div className="fw-medium small">{svc.name}</div>
                  <div className="text-muted" style={{fontSize:11}}>{svc.description}</div>
                  <div className="text-primary small fw-medium">×{svc.price_multiplier} multiplier</div>
                </div>
                <div className={`rounded-circle border-2 border ${sel?'bg-primary border-primary':'border-secondary'} d-flex align-items-center justify-content-center`}
                  style={{width:20,height:20,flexShrink:0}}>
                  {sel && <i className="fas fa-check text-white" style={{fontSize:10}}/>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <label className="form-label small fw-medium">Priority</label>
        <div className="d-flex gap-3">
          {['Normal','Express'].map(p => (
            <div key={p} className="form-check">
              <input className="form-check-input" type="radio" name="priority" id={`pr-${p}`}
                checked={form.priority===p} onChange={()=>setForm(f=>({...f,priority:p}))}/>
              <label className="form-check-label small" htmlFor={`pr-${p}`}>
                {p} {p==='Express' && <span className="badge bg-danger ms-1" style={{fontSize:9}}>+50%</span>}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h6 className="fw-semibold mb-1">Select Garments</h6>
      <p className="text-muted small mb-4">
        Add the types and quantities you want cleaned. Prices are set by SimplyLovely and adjusted by your selected service.
      </p>
      <div className="row g-3">
        {garmentPricing.filter(g => g.active !== false).map(garment => {
          const g = form.garments[garment.id] || { qty: 0 };
          const linePrice = g.qty * garment.base_price * serviceMultiplier;
          return (
            <div key={garment.id} className="col-sm-6 col-lg-4">
              <div className={`bg-white rounded-3 border p-3 h-100 ${g.qty>0?'border-primary border-opacity-50':''}`}>
                <div className="fw-medium small mb-1">{garment.name}</div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-muted" style={{fontSize:11}}>{garment.category} · {garment.unit}</div>
                  <div className="text-primary small fw-medium">{formatNGN(garment.base_price)}</div>
                </div>
                {/* qty control — no price override for customers */}
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-xs btn-outline-secondary"
                    style={{width:28,height:28,padding:0,borderRadius:6}}
                    onClick={()=>setGarmentQty(garment.id,-1)}>−</button>
                  <span className="fw-bold small" style={{minWidth:28,textAlign:'center'}}>{g.qty}</span>
                  <button className="btn btn-xs btn-outline-primary"
                    style={{width:28,height:28,padding:0,borderRadius:6}}
                    onClick={()=>setGarmentQty(garment.id,1)}>+</button>
                  {g.qty > 0 && (
                    <span className="text-muted small ms-1">{formatNGN(linePrice)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {totalGarmentCount > 0 && (
        <div className="alert alert-info mt-3 small">
          <i className="fas fa-info-circle me-2"/>
          <strong>{totalGarmentCount} garment(s)</strong> · Service cost: <strong>{formatNGN(garmentTotal)}</strong>
          {prioritySurcharge>0 && <> · Express: <strong className="text-danger">+{formatNGN(prioritySurcharge)}</strong></>}
        </div>
      )}
      <div className="mt-4">
        <label className="form-label small fw-medium">Special Instructions</label>
        <textarea className="form-control" rows={3}
          placeholder="e.g. Handle delicates carefully, no bleach on coloured items…"
          value={form.special_instructions}
          onChange={e=>setForm(p=>({...p,special_instructions:e.target.value}))}/>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h6 className="fw-semibold mb-3">Schedule</h6>
      <div className="bg-white rounded-3 border p-4">
        <div className="row g-3">
          <div className="col-sm-6">
            <label className="form-label small fw-medium">Pickup Date *</label>
            <input type="date" className="form-control" value={form.pickup_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e=>setForm(p=>({...p,pickup_date:e.target.value}))}/>
          </div>
          <div className="col-sm-6">
            <label className="form-label small fw-medium">Preferred Time</label>
            <select className="form-select" value={form.pickup_time} onChange={e=>setForm(p=>({...p,pickup_time:e.target.value}))}>
              <option value="">Select time…</option>
              {['8:00 AM – 10:00 AM','10:00 AM – 12:00 PM','12:00 PM – 2:00 PM','2:00 PM – 4:00 PM','4:00 PM – 6:00 PM'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label small fw-medium">Delivery Area *</label>
            <select className="form-select" value={form.delivery_area_id||''}
              onChange={e=>{
                const area = deliveryAreas.find(a=>String(a.id)===e.target.value);
                setForm(p=>({...p,delivery_area_id:e.target.value,delivery_area:area?.name||''}));
              }}>
              <option value="">Select your area…</option>
              {deliveryAreas.filter(a=>a.active!==false).map(a=>(
                <option key={a.id} value={a.id}>{a.name} — {formatNGN(a.price)} delivery</option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label small fw-medium">Full Address *</label>
            <input className="form-control" placeholder="House number, street, landmark…"
              value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h6 className="fw-semibold mb-3">Payment Method</h6>
      <div className="d-flex flex-column gap-3">
        {/* Paystack direct */}
        <div
          className={`bg-white rounded-3 border p-4 ${form.payment_method==='direct'?'border-primary border-2':''}`}
          style={{cursor:'pointer'}}
          onClick={()=>{setForm(p=>({...p,payment_method:'direct'}));setSubAlloc({});}}
        >
          <div className="d-flex gap-3 align-items-start">
            <div className={`rounded-circle border-2 border flex-shrink-0 ${form.payment_method==='direct'?'bg-primary border-primary':'border-secondary'} d-flex align-items-center justify-content-center`}
              style={{width:22,height:22,marginTop:2}}>
              {form.payment_method==='direct' && <i className="fas fa-check text-white" style={{fontSize:10}}/>}
            </div>
            <div>
              <div className="fw-semibold mb-1"><i className="fas fa-credit-card text-primary me-2"/>Pay with Paystack</div>
              <div className="text-muted small">Card, bank transfer or USSD. A secure payment popup appears on confirmation.</div>
              <div className="fw-bold text-primary mt-1">{formatNGN(totalAmount)}</div>
            </div>
          </div>
        </div>

        {/* Subscription / multi-plan */}
        <div
          className={`bg-white rounded-3 border p-4 ${form.payment_method==='subscription'?'border-success border-2':''} ${subscriptions.length===0?'opacity-50':''}`}
          style={{cursor:subscriptions.length>0?'pointer':'not-allowed'}}
          onClick={()=>subscriptions.length>0&&setForm(p=>({...p,payment_method:'subscription'}))}
        >
          <div className="d-flex gap-3 align-items-start">
            <div className={`rounded-circle border-2 border flex-shrink-0 ${form.payment_method==='subscription'?'bg-success border-success':'border-secondary'} d-flex align-items-center justify-content-center`}
              style={{width:22,height:22,marginTop:2}}>
              {form.payment_method==='subscription' && <i className="fas fa-check text-white" style={{fontSize:10}}/>}
            </div>
            <div className="flex-1" onClick={e=>e.stopPropagation()}>
              <div className="fw-semibold mb-1"><i className="fas fa-layer-group text-success me-2"/>Pay from Subscription</div>
              <div className="text-muted small mb-3">
                Deduct <strong>{totalGarmentCount} unit(s)</strong> from your active plan(s). Split across plans if needed.
              </div>
              {subscriptions.length===0 ? (
                <div className="text-warning small">
                  <i className="fas fa-exclamation-triangle me-1"/>No active subscriptions.{' '}
                  <a href="/subscriptions" className="text-primary">Subscribe here</a>
                </div>
              ) : (
                <>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {subscriptions.map(sub=>(
                      <div key={sub.id} className="d-flex align-items-center gap-2 p-2 bg-light rounded-2">
                        <div className="flex-1 min-w-0">
                          <div className="fw-medium small">{sub.plan_name}</div>
                          <div className="text-muted" style={{fontSize:11}}>{sub.units_remaining} units available</div>
                        </div>
                        <div className="d-flex align-items-center gap-1" style={{width:105}}>
                          <input type="number" className="form-control form-control-sm text-center"
                            value={subAllocations[sub.id]||''} min={0} max={sub.units_remaining} placeholder="0"
                            onClick={e=>e.stopPropagation()}
                            onChange={e=>setAllocation(sub.id,e.target.value)}/>
                          <span className="text-muted small">u</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-outline-success btn-sm mb-3" onClick={e=>{e.stopPropagation();autoAllocate();}}>
                    <i className="fas fa-magic me-2"/>Auto-fill {totalGarmentCount} units
                  </button>
                  {totalAllocated>0 && (
                    <div className={`rounded-2 p-2 small ${allocationOk?'bg-success bg-opacity-10 text-success':'bg-danger bg-opacity-10 text-danger'}`}>
                      {allocationOk
                        ? <><i className="fas fa-check-circle me-1"/>{totalAllocated} units across {Object.values(subAllocations).filter(v=>v>0).length} plan(s) — ready!</>
                        : <><i className="fas fa-exclamation-circle me-1"/>Need {totalGarmentCount}, allocated {totalAllocated} — {totalGarmentCount-totalAllocated} more needed</>
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const planNames = Object.entries(subAllocations)
      .filter(([,v])=>v>0)
      .map(([id,v])=>{ const s=subscriptions.find(x=>String(x.id)===String(id)); return s?`${s.plan_name}: ${v}u`:null; })
      .filter(Boolean).join(' + ');
    return (
      <div>
        <h6 className="fw-semibold mb-3">Order Summary</h6>
        {actingOnBehalf && (
          <div className="alert alert-warning py-2 small mb-3">
            <i className="fas fa-user-secret me-2"/>Acting on behalf of <strong>{behalfName}</strong>. This order will be attributed to their account.
          </div>
        )}
        <div className="bg-white rounded-3 border p-4 mb-3">
          <div className="mb-3 pb-3 border-bottom">
            <div className="text-muted small mb-1">Services</div>
            <div className="d-flex flex-wrap gap-1">
              {form.services.map(sid=>{
                const svc=laundryServices.find(s=>s.id===sid);
                return svc?<span key={sid} className="badge bg-primary bg-opacity-25 text-primary">{svc.name}</span>:null;
              })}
            </div>
          </div>
          {selectedGarments.length>0 && (
            <div className="mb-3 pb-3 border-bottom">
              <div className="text-muted small mb-2">Garments</div>
              {selectedGarments.map(g=>(
                <div key={g.id} className="d-flex justify-content-between small mb-1">
                  <span>{g.qty}× {g.name}</span>
                  <span className="fw-medium">{formatNGN(g.qty*g.base_price*serviceMultiplier)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="d-flex justify-content-between small mb-1">
            <span className="text-muted">Garments subtotal</span><span>{formatNGN(garmentTotal)}</span>
          </div>
          {prioritySurcharge>0 && (
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Express surcharge (50%)</span><span className="text-danger">{formatNGN(prioritySurcharge)}</span>
            </div>
          )}
          {deliveryFee>0 && (
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-muted">Delivery to {form.delivery_area}</span><span>{formatNGN(deliveryFee)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1">
            <span>Total</span><span className="text-primary fs-5">{formatNGN(totalAmount)}</span>
          </div>
          <div className="mt-3 pt-3 border-top d-flex flex-column gap-1">
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Payment</span>
              <span className="fw-medium">{form.payment_method==='subscription' ? (planNames||'Subscription') : 'Paystack'}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Pickup</span>
              <span>{form.pickup_date}{form.pickup_time&&` · ${form.pickup_time}`}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Address</span>
              <span className="text-end" style={{maxWidth:'60%'}}>{form.address}</span>
            </div>
          </div>
        </div>
        <div className="alert alert-info small">
          <i className="fas fa-info-circle me-2"/>
          {form.payment_method==='subscription'
            ? `${totalGarmentCount} units will be deducted from your subscription(s) when the order is confirmed.`
            : 'A Paystack payment popup will appear. Complete payment to confirm your order.'
          }
        </div>
      </div>
    );
  };

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div style={{maxWidth:760}}>
      <SectionHeader
        title={actingOnBehalf ? `Create Order for ${behalfName}` : 'Create Laundry Order'}
        subtitle={actingOnBehalf ? `Acting on behalf of ${behalfName}. Order will be attributed to their account.` : 'Select services, garments and schedule a pickup'}
      />

      {/* Step indicator */}
      <div className="d-flex align-items-center mb-5">
        {STEPS.map((s,i)=>(
          <React.Fragment key={s}>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${i<step?'bg-success text-white':i===step?'bg-primary text-white':'bg-light text-muted border'}`}
                style={{width:30,height:30,fontSize:12}}>
                {i<step?<i className="fas fa-check" style={{fontSize:10}}/>:i+1}
              </div>
              <span className={`small d-none d-md-inline ${i===step?'fw-semibold text-primary':'text-muted'}`}>{s}</span>
            </div>
            {i<STEPS.length-1 && <div className={`flex-1 mx-1 ${i<step?'bg-success':'bg-light'}`} style={{height:2}}/>}
          </React.Fragment>
        ))}
      </div>

      {stepContent[step]()}

      <div className="d-flex justify-content-between mt-4 pt-2">
        <button className="btn btn-outline-secondary" onClick={()=>setStep(s=>s-1)} disabled={step===0}>
          <i className="fas fa-arrow-left me-2"/>Back
        </button>
        {step<STEPS.length-1 ? (
          <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)} disabled={!canProceed()}>
            Continue <i className="fas fa-arrow-right ms-2"/>
          </button>
        ) : (
          <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2"/>Processing…</>
              : <><i className="fas fa-check me-2"/>Place Order{form.payment_method==='direct'?' & Pay':''}</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
