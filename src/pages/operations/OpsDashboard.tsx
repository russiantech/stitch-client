// src/pages/operations/OpsDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatusBadge, SectionHeader, LoadingSpinner } from '@/components/shared/index.tsx';
import { analyticsService, orderService, userService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { DashboardKPIs, LaundryOrder, FashionOrder, User } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
const isLaundry = (o: LaundryOrder | FashionOrder): o is LaundryOrder => 'garment_items' in o;

export default function OpsDashboard() {
  const toast = useToast();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [urgent, setUrgent] = useState<(LaundryOrder | FashionOrder)[]>([]);
  const [latest, setLatest] = useState<(LaundryOrder | FashionOrder)[]>([]);
  const [pendingPickups, setPendingPickups] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, urgentRes, latestRes, pickupsRes, deliveriesRes] = await Promise.all([
        analyticsService.dashboard('month'),
        orderService.list({ priority: 'Urgent', page_size: 20 }),
        orderService.list({ page_size: 10 }),
        orderService.list({ status: 'Received', page_size: 1 }),
        orderService.list({ status: 'Ready For Delivery', page_size: 1 }),
      ]);
      setKpis(dashRes);
      setUrgent(urgentRes.items.filter(o => o.status !== 'Completed'));
      setLatest(latestRes.items);
      setPendingPickups(pickupsRes.pagination.total);
      setPendingDeliveries(deliveriesRes.pagination.total);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    userService.list({ page_size: 100 })
      .then(d => setStaff(d.items.filter(u => u.roles.some(r => ['staff', 'manager'].includes(r)))))
      .catch(() => { /* ignore */ });
  }, [load]);

  if (loading || !kpis) return <LoadingSpinner message="Loading operations dashboard…" />;

  return (
    <div>
      <SectionHeader
        title="Operations Dashboard"
        subtitle="Live overview of laundry and fashion operations"
        actions={
          <button className="btn btn-sm btn-primary" onClick={load}>
            <i className="fas fa-refresh me-1" />Refresh
          </button>
        }
      />

      <div className="row g-3 mb-4" data-tour="tour-ops-kpis">
        <div className="col-6 col-lg-3">
          <StatCard label="Revenue (Period)" value={formatNGN(kpis.revenue.this_period)} icon="fa-naira-sign" iconBg="bg-success"
            change={`${kpis.revenue.growth >= 0 ? '+' : ''}${kpis.revenue.growth}% vs last period`} changeType={kpis.revenue.growth >= 0 ? 'positive' : 'negative'} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Active Orders" value={kpis.orders.pending} icon="fa-box" iconBg="bg-warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Laundry Orders" value={kpis.orders.laundry} icon="fa-soap" iconBg="bg-primary" change="Total" changeType="positive" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Fashion Orders" value={kpis.orders.fashion} icon="fa-shirt" iconBg="bg-info" />
        </div>
      </div>

      <div className="row g-3 mb-4" data-tour="tour-ops-quick-nav">
        {[
          { to: '/ops/laundry', icon: 'fa-soap', label: 'Laundry Orders', count: kpis.orders.laundry, color: 'primary' },
          { to: '/ops/fashion', icon: 'fa-shirt', label: 'Fashion Orders', count: kpis.orders.fashion, color: 'info' },
          { to: '/ops/pickups', icon: 'fa-truck-pickup', label: 'Pending Pickups', count: pendingPickups, color: 'warning' },
          { to: '/ops/deliveries', icon: 'fa-truck', label: 'Pending Deliveries', count: pendingDeliveries, color: 'success' },
        ].map(item => (
          <div key={item.to} className="col-6 col-lg-3">
            <Link to={item.to} className="text-decoration-none">
              <div className="stat-card h-100 text-center py-4">
                <div className={`stat-icon bg-${item.color} bg-opacity-10 mx-auto mb-2`} style={{ width: 52, height: 52 }}>
                  <i className={`fas ${item.icon} text-${item.color} fs-5`} />
                </div>
                <div className="fw-bold fs-4">{item.count}</div>
                <div className="text-muted small">{item.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border overflow-hidden" data-tour="tour-ops-urgent">
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <h6 className="fw-semibold mb-0">
                <i className="fas fa-bolt text-warning me-2" />Urgent Orders
              </h6>
              <span className="badge bg-warning text-dark">{urgent.length}</span>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="small fw-medium text-muted ps-3">Order</th>
                    <th className="small fw-medium text-muted">Customer</th>
                    <th className="small fw-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {urgent.length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-muted py-3 small">No urgent orders</td></tr>
                  ) : urgent.map(o => (
                    <tr key={o.id}>
                      <td className="ps-3 fw-medium small">{o.reference}</td>
                      <td className="small">{o.customer_name || '—'}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white rounded-3 border overflow-hidden" data-tour="tour-ops-staff">
            <div className="p-3 border-bottom">
              <h6 className="fw-semibold mb-0"><i className="fas fa-users text-primary me-2" />Staff On Team</h6>
            </div>
            <div className="p-3 d-flex flex-column gap-2">
              {staff.length === 0 ? (
                <div className="text-muted small text-center py-2">No staff members yet.</div>
              ) : staff.map(s => (
                <div key={s.id} className="d-flex align-items-center gap-3 p-2 rounded-2 bg-light">
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold" style={{ width: 36, height: 36, flexShrink: 0, fontSize: 13 }}>
                    {s.names.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="fw-medium small">{s.names}</div>
                    <div className="text-muted text-capitalize" style={{ fontSize: 11 }}>{s.roles.join(', ')}</div>
                  </div>
                  <span className={`badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                    {s.status === 'active' ? 'Active' : s.status === 'pending' ? 'Pending' : s.status === 'suspended' ? 'Suspended' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="bg-white rounded-3 border overflow-hidden" data-tour="tour-ops-latest-orders">
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <h6 className="fw-semibold mb-0">Latest Orders</h6>
              <div className="d-flex gap-2">
                <Link to="/ops/laundry" className="btn btn-sm btn-outline-primary">Laundry</Link>
                <Link to="/ops/fashion" className="btn btn-sm btn-outline-info">Fashion</Link>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3 small fw-medium text-muted">Order Ref</th>
                    <th className="small fw-medium text-muted">Customer</th>
                    <th className="small fw-medium text-muted">Type</th>
                    <th className="small fw-medium text-muted">Status</th>
                    <th className="small fw-medium text-muted">Priority</th>
                    <th className="small fw-medium text-muted pe-3 text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map(order => (
                    <tr key={order.id}>
                      <td className="ps-3 fw-medium small">{order.reference}</td>
                      <td className="small">{order.customer_name || '—'}</td>
                      <td className="small text-muted">{isLaundry(order) ? 'Laundry' : 'Fashion'}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <span className={`badge ${order.priority === 'Express' ? 'bg-danger' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ fontSize: 10 }}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="pe-3 text-end fw-medium small">{formatNGN(order.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
