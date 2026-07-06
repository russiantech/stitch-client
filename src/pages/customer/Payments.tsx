import React, { useState, useEffect } from 'react';
import { SectionHeader, LoadingSpinner, EmptyState } from '@/components/shared/index.tsx';
import { orderService, subscriptionService } from '@/services/api.ts';
import { formatNGN, formatDate } from '@/services/mockData.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import type { LaundryOrder, FashionOrder, Subscription } from '@/types/index.ts';

function PayStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-success', pending: 'bg-warning text-dark', failed: 'bg-danger',
    abandoned: 'bg-secondary', refunded: 'bg-info text-dark',
  };
  return <span className={`badge ${map[status] || 'bg-secondary'}`} style={{ fontSize: 10 }}>{status}</span>;
}

export default function Payments() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<(LaundryOrder | FashionOrder)[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      orderService.list({ page_size: 100 }),
      subscriptionService.mySubscriptions(),
    ]).then(([ordersRes, subsRes]) => {
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.items);
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value);
    }).finally(() => setLoading(false));
  }, []);

  const directOrders = orders.filter(o => o.payment_method !== 'subscription');
  const totalPaid = directOrders.filter(o => o.payment_status === 'success').reduce((s, o) => s + o.total_amount, 0);
  const totalOutstanding = directOrders.filter(o => o.payment_status === 'pending').reduce((s, o) => s + o.total_amount, 0);

  if (loading) return <LoadingSpinner message="Loading payment history…" />;

  return (
    <div>
      <SectionHeader title="Payments" subtitle="Your order payment history and subscription billing" />

      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-success">Total Paid</div>
            <div className="stat-value text-success">{formatNGN(totalPaid)}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-warning">Outstanding</div>
            <div className="stat-value text-warning">{formatNGN(totalOutstanding)}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Direct Payments</div>
            <div className="stat-value">{directOrders.length}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label text-primary">Loyalty Points</div>
            <div className="stat-value text-primary">{(user?.loyalty_points ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden mb-4">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Order Payments</h6>
        </div>
        {directOrders.length === 0 ? (
          <EmptyState icon="fa-receipt" title="No direct payments yet" message="Payments for subscription-covered orders don't appear here." />
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Order</th>
                  <th className="small fw-medium text-muted">Date</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted text-end pe-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {directOrders.map(o => (
                  <tr key={o.id}>
                    <td className="ps-4 fw-medium small">{o.reference}</td>
                    <td className="small text-muted">{formatDate(o.created_at)}</td>
                    <td><PayStatusBadge status={o.payment_status} /></td>
                    <td className="text-end pe-4 fw-medium small">{formatNGN(o.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Subscription Billing</h6>
        </div>
        {subscriptions.length === 0 ? (
          <EmptyState icon="fa-layer-group" title="No subscriptions" message="Subscribe to a plan to see billing history here." />
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Plan</th>
                  <th className="small fw-medium text-muted">Reference</th>
                  <th className="small fw-medium text-muted">Subscribed</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted text-end pe-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id}>
                    <td className="ps-4 fw-medium small">{s.plan_name}</td>
                    <td className="small text-muted">{s.payment_reference || '—'}</td>
                    <td className="small text-muted">{formatDate(s.subscribed_at)}</td>
                    <td><span className={`badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>{s.status}</span></td>
                    <td className="text-end pe-4 fw-medium small">{s.amount != null ? formatNGN(s.amount) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
