import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, LoadingSpinner, EmptyState } from '@/components/shared/index.tsx';
import { paymentService } from '@/services/api.ts';
import { formatNGN, formatDate } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { Payment, PaymentStatus, PaymentPurpose } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

function StatusBadge({ status }: { status: PaymentStatus }) {
  const MAP: Record<PaymentStatus, string> = {
    success: 'bg-success', pending: 'bg-warning text-dark', failed: 'bg-danger',
    abandoned: 'bg-secondary', refunded: 'bg-info text-dark', reversed: 'bg-secondary',
  };
  return <span className={`badge ${MAP[status] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{status}</span>;
}

// ─── Generate Invoice Modal ────────────────────────────────────────────────────
function GenerateInvoiceModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: (p: Payment) => void }) {
  const toast = useToast();
  const [customerName, setCustomerName] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!customerName.trim() || !amount) return toast.error('Customer and amount are required');
    setSaving(true);
    try {
      const inv = await paymentService.createInvoice({
        customer_name: customerName.trim(),
        order_reference: orderReference || undefined,
        amount: Number(amount),
        notes: notes || undefined,
      });
      toast.success(`Invoice ${inv.reference} generated`);
      onGenerated({
        id: inv.id, reference: inv.reference, provider: 'manual', purpose: 'invoice',
        status: (inv.status as PaymentStatus) || 'pending', currency: 'NGN', amount: inv.amount,
        amount_paid: null, channel: null, paid_at: null, created_at: `${inv.date}T00:00:00Z`,
      });
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
            <h6 className="modal-title fw-semibold"><i className="fas fa-file-invoice me-2 text-primary" />Generate Invoice</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-medium">Order Reference (optional)</label>
              <input className="form-control" value={orderReference} onChange={e => setOrderReference(e.target.value)} placeholder="e.g. ST-ORD-1234" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Customer Name *</label>
              <input className="form-control" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Chiamaka Eze" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Amount (₦) *</label>
              <div className="input-group">
                <span className="input-group-text">₦</span>
                <input type="number" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} min={0} placeholder="5000" />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Notes</label>
              <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional invoice notes…" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}Generate Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Verify pending Paystack payment ────────────────────────────────────────────
function VerifyModal({ payment, onClose, onVerified }: { payment: Payment; onClose: () => void; onVerified: (p: Payment) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const updated = await paymentService.verify(payment.reference);
      toast.success(updated.status === 'success' ? 'Payment confirmed!' : `Payment status: ${updated.status}`);
      onVerified(updated);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Verify Payment — {payment.reference}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="bg-light rounded-3 p-3 mb-3">
              <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Amount</span><span className="fw-medium">{formatNGN(payment.amount)}</span></div>
              <div className="d-flex justify-content-between mb-1 small"><span className="text-muted">Provider</span><span className="fw-medium">{payment.provider}</span></div>
              <div className="d-flex justify-content-between small"><span className="text-muted">Current Status</span><StatusBadge status={payment.status} /></div>
            </div>
            {payment.provider === 'paystack' ? (
              <p className="text-muted small mb-0">
                <i className="fas fa-info-circle me-1" />Re-checks this transaction's status directly with Paystack.
              </p>
            ) : (
              <div className="alert alert-warning py-2 small mb-0">
                <i className="fas fa-exclamation-triangle me-1" />This is a {payment.provider} payment — Paystack verification does not apply.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            {payment.provider === 'paystack' && (
              <button className="btn btn-primary btn-sm" onClick={handleVerify} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fas fa-sync me-2" />}
                Verify Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── View Payment Modal ────────────────────────────────────────────────────────
function ViewPaymentModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Payment {payment.reference}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="text-center mb-4 pb-3 border-bottom">
              <div className="fw-bold fs-5 mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Stitch</div>
              <div className="text-muted small">Laundry & Fashion Services</div>
            </div>
            <div className="bg-light rounded-3 p-3 mb-3">
              {[
                ['Purpose', payment.purpose],
                ['Provider', payment.provider],
                ['Channel', payment.channel || '—'],
                ['Created', formatDate(payment.created_at)],
                ['Paid At', payment.paid_at ? formatDate(payment.paid_at) : '—'],
              ].map(([l, v]) => (
                <div key={l} className="d-flex justify-content-between mb-2 small"><span className="text-muted">{l}</span><span className="fw-medium text-capitalize">{v}</span></div>
              ))}
              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Status</span>
                <StatusBadge status={payment.status} />
              </div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="fw-bold">Amount</span>
                <span className="fw-bold text-primary fs-5">{formatNGN(payment.amount)}</span>
              </div>
              {payment.amount_paid != null && (
                <div className="d-flex justify-content-between small mt-1">
                  <span className="text-muted">Amount Paid</span><span className="text-success">{formatNGN(payment.amount_paid)}</span>
                </div>
              )}
            </div>
            <div className="text-center text-muted small">Thank you for your business! 💙</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            <button className="btn btn-outline-primary btn-sm" onClick={() => window.print()}>
              <i className="fas fa-print me-2" />Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Billing page ─────────────────────────────────────────────────────────
export default function Billing() {
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [purposeFilter, setPurposeFilter] = useState<PaymentPurpose | ''>('');
  const [modal, setModal] = useState<null | 'generate'>(null);
  const [verifyPay, setVerifyPay] = useState<Payment | null>(null);
  const [viewPay, setViewPay] = useState<Payment | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const d = await paymentService.list({
        page_size: 100,
        status: statusFilter || undefined,
        purpose: purposeFilter || undefined,
      });
      setPayments(d.items);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, purposeFilter]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const totalCollected = payments.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount_paid || p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  const updatePayment = (updated: Payment) => setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));

  return (
    <div>
      <SectionHeader
        title="Billing & Payments"
        subtitle="Generate invoices, verify payments and track revenue"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal('generate')}>
            <i className="fas fa-file-invoice me-2" />Generate Invoice
          </button>
        }
      />

      <div className="row g-3 mb-4">
        {[
          { label: 'Total Payments', value: payments.length, color: 'primary' },
          { label: 'Collected', value: formatNGN(totalCollected), color: 'success' },
          { label: 'Pending', value: formatNGN(totalPending), color: 'warning' },
          { label: 'Invoices', value: payments.filter(p => p.purpose === 'invoice').length, color: 'info' },
        ].map(s => (
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className={`stat-label text-${s.color}`}>{s.label}</div>
              <div className={`fw-bold fs-5 text-${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {(['', 'pending', 'success', 'failed', 'abandoned', 'refunded'] as const).map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setStatusFilter(s)}>
            {s || 'All statuses'}
          </button>
        ))}
      </div>
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {(['', 'order', 'subscription', 'invoice', 'top_up'] as const).map(p => (
          <button key={p} className={`btn btn-sm ${purposeFilter === p ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setPurposeFilter(p)}>
            {p || 'All types'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Reference</th>
                  <th className="small fw-medium text-muted">Purpose</th>
                  <th className="small fw-medium text-muted">Provider</th>
                  <th className="small fw-medium text-muted">Date</th>
                  <th className="small fw-medium text-muted">Channel</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted text-end">Amount</th>
                  <th className="small fw-medium text-muted pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon="fa-receipt" title="No payments found" /></td></tr>
                ) : payments.map(pay => (
                  <tr key={pay.id}>
                    <td className="ps-4 fw-medium small">{pay.reference}</td>
                    <td className="small text-capitalize">{pay.purpose}</td>
                    <td className="small text-muted text-capitalize">{pay.provider}</td>
                    <td className="small text-muted">{formatDate(pay.created_at)}</td>
                    <td className="small text-muted text-capitalize">{pay.channel || '—'}</td>
                    <td><StatusBadge status={pay.status} /></td>
                    <td className="text-end">
                      <div className="fw-medium small">{formatNGN(pay.amount)}</div>
                      {pay.amount_paid != null && pay.status !== 'success' && <div className="text-muted" style={{ fontSize: 10 }}>Paid: {formatNGN(pay.amount_paid)}</div>}
                    </td>
                    <td className="pe-4">
                      <div className="d-flex gap-1">
                        <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => setViewPay(pay)} title="View"><i className="fas fa-eye" /></button>
                        {pay.status === 'pending' && (
                          <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }}
                            onClick={() => setVerifyPay(pay)} title="Verify payment"><i className="fas fa-sync" /></button>
                        )}
                        <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => window.print()} title="Print"><i className="fas fa-print" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'generate' && (
        <GenerateInvoiceModal onClose={() => setModal(null)} onGenerated={inv => setPayments(p => [inv, ...p])} />
      )}
      {verifyPay && (
        <VerifyModal payment={verifyPay} onClose={() => setVerifyPay(null)} onVerified={updatePayment} />
      )}
      {viewPay && (
        <ViewPaymentModal payment={viewPay} onClose={() => setViewPay(null)} />
      )}
    </div>
  );
}
