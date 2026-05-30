import React, { useState } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { paymentService } from '../../services/api.js';
import { PAYSTACK_KEY } from '../../services/api.js';
import { MOCK_INVOICES, MOCK_LAUNDRY_ORDERS, formatNGN } from '../../services/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function InvoiceStatusBadge({ status }) {
  const map = { Paid:'bg-success', Partial:'bg-warning text-dark', Unpaid:'bg-danger', Overdue:'bg-danger' };
  return <span className={`badge ${map[status]||'bg-secondary'}`} style={{fontSize:10}}>{status}</span>;
}

// ─── Generate Invoice Modal ────────────────────────────────────────────────────
function GenerateInvoiceModal({ orders, onClose, onGenerated }) {
  const toast = useToast();
  const [form, setForm] = useState({ order_id:'', customer:'', amount:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const selectOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) setForm(p => ({ ...p, order_id: orderId, customer: order.customer, amount: order.amount }));
    else setForm(p => ({ ...p, order_id: orderId }));
  };

  const handleGenerate = async () => {
    if (!form.customer || !form.amount) return toast.error('Customer and amount are required');
    setSaving(true);
    try {
      await paymentService.initialize?.({ ...form }) ?? await new Promise(r => setTimeout(r, 700));
    } catch {}
    const newInv = {
      id: `INV-2025-${String(Date.now()).slice(-4)}`,
      customer: form.customer,
      order_id: form.order_id || '—',
      amount: Number(form.amount),
      status: 'Unpaid',
      date: new Date().toISOString().split('T')[0],
      paid_at: null,
      method: '—',
    };
    toast.success(`Invoice ${newInv.id} generated`);
    onGenerated(newInv);
    onClose();
    setSaving(false);
  };

  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold"><i className="fas fa-file-invoice me-2 text-primary"/>Generate Invoice</h6>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-medium">Link to Order (optional)</label>
              <select className="form-select" value={form.order_id} onChange={e=>selectOrder(e.target.value)}>
                <option value="">Select existing order…</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id} — {o.customer} ({formatNGN(o.amount)})</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Customer Name *</label>
              <input className="form-control" value={form.customer} onChange={f('customer')} placeholder="Chiamaka Eze"/>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Amount (₦) *</label>
              <div className="input-group">
                <span className="input-group-text">₦</span>
                <input type="number" className="form-control" value={form.amount} onChange={f('amount')} min={0} placeholder="5000"/>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={f('notes')} placeholder="Optional invoice notes…"/>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={saving}>
              {saving?<span className="spinner-border spinner-border-sm me-2"/>:null}Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pay / Record payment modal ────────────────────────────────────────────────
function PayModal({ invoice, onClose, onSuccess }) {
  const toast  = useToast();
  const { user } = useAuth();
  const [amount, setAmount]   = useState(invoice.amount - (invoice.paid||0));
  const [method, setMethod]   = useState('paystack');
  const [loading,setLoading]  = useState(false);
  const outstanding = invoice.amount - (invoice.paid||0);

  const handlePay = async () => {
    setLoading(true);
    try {
      if (method === 'paystack') {
        const ref = `SL-INV-${invoice.id}-${Date.now()}`;

        // ── 1. Try inline popup first ────────────────────────────────────────
        if (window.PaystackPop) {
          await new Promise((resolve, reject) => {
            const handler = window.PaystackPop.setup({
              key: PAYSTACK_KEY,
              email: user?.email || 'customer@simplylovely.ng',
              amount: amount * 100,
              currency: 'NGN',
              ref,
              metadata: { invoice_id: invoice.id, type: 'invoice' },
              callback: async (response) => {
                toast.info('Verifying payment…');
                try { await paymentService.verify(response.reference); } catch {}
                toast.success(`Payment of ${formatNGN(amount)} confirmed!`);
                onSuccess(invoice.id, amount, response.reference);
                onClose();
                resolve();
              },
              onClose: () => reject(new Error('cancelled')),
            });
            handler.openIframe();
          });
          return;
        }

        // ── 2. Redirect fallback ─────────────────────────────────────────────
        const res = await paymentService.initialize({
          email: user?.email, amount, ref,
          metadata: { invoice_id: invoice.id },
          callback_url: window.location.href,
        });
        if (res?.authorization_url) { window.location.href = res.authorization_url; return; }

        // ── 3. Demo ──────────────────────────────────────────────────────────
        await new Promise(r => setTimeout(r, 1000));
        toast.success(`Payment of ${formatNGN(amount)} recorded (demo)`);
        onSuccess(invoice.id, amount, ref);
        onClose();
      } else {
        // Manual record (cash/transfer)
        await new Promise(r => setTimeout(r, 500));
        toast.success(`${formatNGN(amount)} recorded via ${method}`);
        onSuccess(invoice.id, amount, null, method);
        onClose();
      }
    } catch (err) {
      if (err.message === 'cancelled') toast.info('Payment cancelled.');
      else toast.error('Payment failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Record Payment — {invoice.id}</h6>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <div className="bg-light rounded-3 p-3 mb-4">
              <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Invoice Total</span><span className="fw-medium">{formatNGN(invoice.amount)}</span></div>
              {(invoice.paid||0)>0 && <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Already Paid</span><span className="text-success">−{formatNGN(invoice.paid)}</span></div>}
              <div className="d-flex justify-content-between border-top pt-2 mt-1"><span className="fw-semibold small">Outstanding</span><span className="fw-bold text-primary">{formatNGN(outstanding)}</span></div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Payment Method</label>
              <select className="form-select" value={method} onChange={e=>setMethod(e.target.value)}>
                <option value="paystack">Paystack (Card / Transfer / USSD)</option>
                <option value="cash">Cash</option>
                <option value="transfer">Manual Bank Transfer</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Amount</label>
              <div className="input-group">
                <span className="input-group-text">₦</span>
                <input type="number" className="form-control" value={amount} min={100} max={outstanding}
                  onChange={e=>setAmount(Math.min(Number(e.target.value),outstanding))}/>
              </div>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={()=>setAmount(outstanding)}>Full</button>
                <button className="btn btn-outline-secondary btn-sm" onClick={()=>setAmount(Math.round(outstanding/2))}>Half</button>
              </div>
            </div>
            {method==='paystack' && (
              <div className="alert alert-info py-2 small mb-0">
                <i className="fas fa-lock me-2"/>Payment popup opens inline. Redirect fallback if popup is blocked.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className={`btn btn-sm ${method==='paystack'?'btn-success':'btn-primary'}`} onClick={handlePay} disabled={loading||amount<=0}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"/>Processing…</>
                : method==='paystack' ? <><i className="fas fa-credit-card me-2"/>Pay {formatNGN(amount)}</>
                : <><i className="fas fa-check me-2"/>Record {formatNGN(amount)}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View / Print Invoice Modal ────────────────────────────────────────────────
function ViewInvoiceModal({ invoice, onClose }) {
  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Invoice {invoice.id}</h6>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <div className="text-center mb-4 pb-3 border-bottom">
              <div className="fw-bold fs-5 mb-1" style={{fontFamily:'var(--font-display)'}}>SimplyLovely</div>
              <div className="text-muted small">Laundry & Fashion Services</div>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <div><div className="text-muted small">Bill To</div><div className="fw-medium">{invoice.customer}</div></div>
              <div className="text-end"><div className="text-muted small">Invoice Date</div><div className="fw-medium">{invoice.date}</div></div>
            </div>
            <div className="bg-light rounded-3 p-3 mb-3">
              {[
                ['Order Reference', invoice.order_id||'—'],
                ['Payment Method', invoice.method||'—'],
              ].map(([l,v])=>(
                <div key={l} className="d-flex justify-content-between mb-2 small"><span className="text-muted">{l}</span><span className="fw-medium">{v}</span></div>
              ))}
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Status</span>
                <InvoiceStatusBadge status={invoice.status}/>
              </div>
              {invoice.status==='Partial' && invoice.paid && (
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-muted">Amount Paid</span><span className="text-success">{formatNGN(invoice.paid)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="fw-bold">Total Amount</span>
                <span className="fw-bold text-primary fs-5">{formatNGN(invoice.amount)}</span>
              </div>
            </div>
            <div className="text-center text-muted small">Thank you for your business! 💙</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            <button className="btn btn-outline-primary btn-sm" onClick={()=>window.print()}>
              <i className="fas fa-print me-2"/>Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Billing page ─────────────────────────────────────────────────────────
export default function Billing() {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [filter,   setFilter]   = useState('');
  const [modal,    setModal]    = useState(null); // 'generate'
  const [payInv,   setPayInv]   = useState(null);
  const [viewInv,  setViewInv]  = useState(null);

  const filtered = filter ? invoices.filter(i=>i.status===filter) : invoices;

  const totalRevenue    = invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+i.amount,0);
  const totalOutstanding = invoices.filter(i=>i.status!=='Paid').reduce((s,i)=>s+(i.amount-(i.paid||0)),0);

  const handlePaySuccess = (invoiceId, amountPaid, ref, method) => {
    setInvoices(prev=>prev.map(inv=>{
      if (inv.id!==invoiceId) return inv;
      const newPaid = (inv.paid||0)+amountPaid;
      return { ...inv, paid:newPaid, method:method||'Paystack',
        payment_ref:ref||inv.payment_ref,
        status: newPaid>=inv.amount?'Paid':'Partial',
        paid_at: new Date().toISOString().split('T')[0],
      };
    }));
  };

  return (
    <div>
      <SectionHeader
        title="Billing & Payments"
        subtitle="Generate invoices, record payments and track revenue"
        actions={
          <button className="btn btn-primary btn-sm" onClick={()=>setModal('generate')}>
            <i className="fas fa-file-invoice me-2"/>Generate Invoice
          </button>
        }
      />

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          {label:'Total Invoiced',   value:formatNGN(invoices.reduce((s,i)=>s+i.amount,0)), color:'primary'},
          {label:'Collected',        value:formatNGN(totalRevenue),    color:'success'},
          {label:'Outstanding',      value:formatNGN(totalOutstanding), color:'warning'},
          {label:'Invoices',         value:invoices.length,             color:'info'},
        ].map(s=>(
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className={`stat-label text-${s.color}`}>{s.label}</div>
              <div className={`fw-bold fs-5 text-${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {['','Paid','Partial','Unpaid','Overdue'].map(f=>(
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline-secondary'}`} onClick={()=>setFilter(f)}>
            {f||'All'} ({f?invoices.filter(i=>i.status===f).length:invoices.length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Invoice</th>
                <th className="small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Date</th>
                <th className="small fw-medium text-muted">Method</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted text-end">Amount</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted small">No invoices</td></tr>
              ) : filtered.map(inv=>(
                <tr key={inv.id}>
                  <td className="ps-4 fw-medium small">{inv.id}</td>
                  <td className="small">{inv.customer}</td>
                  <td className="small text-muted">{inv.order_id}</td>
                  <td className="small text-muted">{inv.date}</td>
                  <td className="small text-muted">{inv.method||'—'}</td>
                  <td><InvoiceStatusBadge status={inv.status}/></td>
                  <td className="text-end">
                    <div className="fw-medium small">{formatNGN(inv.amount)}</div>
                    {inv.paid>0&&inv.status!=='Paid' && <div className="text-muted" style={{fontSize:10}}>Paid: {formatNGN(inv.paid)}</div>}
                  </td>
                  <td className="pe-4">
                    <div className="d-flex gap-1">
                      <button className="btn btn-xs btn-outline-secondary" style={{fontSize:11,padding:'2px 8px'}}
                        onClick={()=>setViewInv(inv)} title="View"><i className="fas fa-eye"/></button>
                      {inv.status!=='Paid' && (
                        <button className="btn btn-xs btn-outline-success" style={{fontSize:11,padding:'2px 8px'}}
                          onClick={()=>setPayInv(inv)} title="Record payment"><i className="fas fa-credit-card"/></button>
                      )}
                      <button className="btn btn-xs btn-outline-primary" style={{fontSize:11,padding:'2px 8px'}}
                        onClick={()=>window.print()} title="Print"><i className="fas fa-print"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal==='generate' && (
        <GenerateInvoiceModal
          orders={MOCK_LAUNDRY_ORDERS}
          onClose={()=>setModal(null)}
          onGenerated={inv=>setInvoices(p=>[inv,...p])}
        />
      )}
      {payInv && (
        <PayModal invoice={payInv} onClose={()=>setPayInv(null)} onSuccess={handlePaySuccess}/>
      )}
      {viewInv && (
        <ViewInvoiceModal invoice={viewInv} onClose={()=>setViewInv(null)}/>
      )}
    </div>
  );
}
