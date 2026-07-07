import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatusBadge, EmptyState } from '@/components/shared/index.tsx';
import { subscriptionService, planService, orderService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import { useAppData } from '@/context/AppDataContext.tsx';
import type { Plan, Subscription, LaundryOrder, FashionOrder } from '@/types/index.ts';

const isLaundry = (o: LaundryOrder | FashionOrder): o is LaundryOrder => 'garment_items' in o;

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { usageData } = useAppData();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recentOrders, setRecentOrders] = useState<(LaundryOrder | FashionOrder)[]>([]);

  useEffect(() => {
    planService.list().then(setPlans).catch(() => { /* ignore */ });
    subscriptionService.mySubscriptions()
      .then(subs => setSubscriptions(subs.filter(s => s.status === 'active')))
      .catch(() => { /* ignore */ });
    orderService.list({ page_size: 3 })
      .then(d => setRecentOrders(d.items))
      .catch(() => { /* ignore */ });
  }, []);

  const totalUnits = usageData.total_units || subscriptions.reduce((s, sub) => s + (sub.units || 0), 0);
  const totalUsed = usageData.units_used || subscriptions.reduce((s, sub) => s + (sub.units_used || 0), 0);
  const totalLeft = usageData.remaining_units || subscriptions.reduce((s, sub) => s + (sub.units_remaining || 0), 0);
  const usagePct = totalUnits > 0 ? Math.min(100, Math.round((totalUsed / totalUnits) * 100)) : 0;
  const progressColor = usagePct > 80 ? 'bg-danger' : usagePct > 60 ? 'bg-warning' : 'bg-primary';

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Good day, {user?.names?.split(' ')[0] || 'there'} 👋
        </h4>
        <p className="text-muted mb-0 small">Here's an overview of your laundry & fashion services.</p>
      </div>

      {/* <div className="row g-3 mb-4">
        {[
          { to: '/orders/new', icon: 'fa-soap', title: 'Laundry Order', sub: 'Schedule pickup', color: 'primary' },
          { to: '/fashion/new', icon: 'fa-shirt', title: 'Fashion Request', sub: 'Tailoring & sewing', color: 'warning' },
          { to: '/subscriptions', icon: 'fa-layer-group', title: 'Subscribe', sub: 'Volume plans', color: 'success' },
          { to: '/orders', icon: 'fa-box', title: 'Track Orders', sub: 'View all orders', color: 'info' },
        ].map(a => (
          <div key={a.to} className="col-6 col-lg-3">
            <Link to={a.to} className="text-decoration-none">
              <div className="stat-card d-flex align-items-center gap-3 h-100">
                <div className={`stat-icon bg-${a.color} bg-opacity-10 flex-shrink-0`} style={{ width: 44, height: 44 }}>
                  <i className={`fas ${a.icon} text-${a.color} fs-6`} />
                </div>
                <div className="min-w-0">
                  <div className="fw-medium small text-truncate">{a.title}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{a.sub}</div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div> */}

      <div className="row g-2 g-md-3 mb-4">
  {[
    { to: '/orders/new', icon: 'fa-soap', title: 'Laundry', sub: 'Schedule pickup', color: 'primary' },
    { to: '/fashion/new', icon: 'fa-shirt', title: 'Fashion', sub: 'Tailoring', color: 'warning' },
    { to: '/subscriptions', icon: 'fa-layer-group', title: 'Subscribe', sub: 'Volume plans', color: 'success' },
    { to: '/orders', icon: 'fa-box', title: 'Track', sub: 'View orders', color: 'info' },
  ].map(a => (
    <div key={a.to} className="col-6 col-lg-3">
      <Link to={a.to} className="text-decoration-none">
        <div className="stat-card d-flex align-items-center gap-2 gap-md-3 h-100 p-2 p-md-3">
          <div
            className={`stat-icon bg-${a.color} bg-opacity-10 flex-shrink-0 d-flex align-items-center justify-content-center rounded-2`}
            style={{ width: 'clamp(32px, 9vw, 44px)', height: 'clamp(32px, 9vw, 44px)' }}
          >
            <i className={`fas ${a.icon} text-${a.color}`} style={{ fontSize: 'clamp(0.7rem, 2.2vw, 1rem)' }} />
          </div>
          <div className="min-w-0 overflow-hidden">
            <div
              className="fw-medium text-truncate"
              style={{ fontSize: 'clamp(11px, 3vw, 14px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {a.title}
            </div>
            <div
              className="text-muted text-truncate"
              style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {a.sub}
            </div>
          </div>
        </div>
      </Link>
    </div>
  ))}
</div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard label="Total Units Available" value={totalLeft}
            icon="fa-gauge" iconBg="bg-primary"
            change={`${totalUsed} used of ${totalUnits}`} changeType="positive" />
        </div>

        <div className="col-md-4">
          <StatCard label="Loyalty Points" value={(user?.loyalty_points ?? 0).toLocaleString()}
            icon="fa-star" iconBg="bg-warning" change="Redeemable for discounts" changeType="positive" />
        </div>

        <div className="col-md-4">
          <StatCard label="Active Orders" value={recentOrders.filter(o => o.status !== 'Completed').length}
            icon="fa-box" iconBg="bg-success" />
        </div>
      </div>

      {subscriptions.length > 0 ? (
        <div className="bg-white rounded-3 border p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <h6 className="fw-semibold mb-0">Subscription Volume</h6>
              <span className="text-muted small">{subscriptions.length} active plan(s)</span>
            </div>
            <div className="d-flex gap-2">
              <span className="badge bg-info">{usagePct}% used</span>
              <Link to="/subscriptions" className="btn btn-outline-primary btn-sm" style={{ fontSize: 11 }}>Manage</Link>
            </div>
          </div>
          <div className="progress mb-2" style={{ height: 10, borderRadius: 8 }}>
            <div className={`progress-bar ${progressColor}`} style={{ width: `${usagePct}%`, borderRadius: 8, transition: 'width 0.6s' }} />
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">{totalUsed} units used</span>
            <span className="text-muted small">{totalLeft} units remaining</span>
          </div>
          {subscriptions.map(sub => (
            <div key={sub.id} className="d-flex align-items-center gap-2 mt-2 pt-2 border-top">
              <div className="flex-1 min-w-0">
                <div className="fw-medium" style={{ fontSize: 12 }}>{sub.plan_name}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>Renews {sub.renews_at ? new Date(sub.renews_at).toLocaleDateString('en-NG') : '—'}</div>
              </div>
              <div className="text-end">
                <div className="fw-bold small">{sub.units_remaining}/{sub.units}</div>
                <div className="text-muted" style={{ fontSize: 10 }}>units left</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-4 mb-4 d-flex align-items-center gap-3">
          <i className="fas fa-layer-group text-primary fs-3" />
          <div className="flex-1">
            <div className="fw-semibold">No active subscriptions</div>
            <div className="text-muted small">Subscribe to a volume plan to simplify payments for laundry orders.</div>
          </div>
          <Link to="/subscriptions" className="btn btn-primary btn-sm flex-shrink-0">Browse Plans</Link>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="bg-white rounded-3 border overflow-hidden">
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <h6 className="fw-semibold mb-0">Recent Orders</h6>
              <Link to="/orders" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <EmptyState icon="fa-box-open" title="No orders yet" message="Create your first laundry order" />
            ) : (
              <div className="table-responsive">
                <table className="table mb-0">
                  <tbody>
                    {recentOrders.map(order => {
                      const laundry = isLaundry(order);
                      return (
                        <tr key={order.id}>
                          <td className="ps-3 pe-2" style={{ width: 40 }}>
                            <i className={`fas ${laundry ? 'fa-soap' : 'fa-shirt'} text-primary`} />
                          </td>
                          <td>
                            <div className="fw-medium small">{order.reference}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {laundry ? `${order.garment_count ?? order.garment_items.length} items` : order.item_name}
                            </div>
                          </td>
                          <td><StatusBadge status={order.status} /></td>
                          <td className="text-end pe-3">
                            <div className="fw-medium small">{formatNGN(order.total_amount)}</div>
                            <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`} style={{ fontSize: 9 }}>
                              {order.payment_method === 'subscription' ? 'Sub' : 'Direct'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="bg-white rounded-3 border overflow-hidden">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-semibold mb-0">Service Plans</h6>
              <Link to="/subscriptions" className="btn btn-sm btn-outline-success">Subscribe</Link>
            </div>
            <div className="p-3 d-flex flex-column gap-2">
              {plans.map(plan => (
                <div key={plan.id} className={`p-3 rounded-3 border ${plan.is_popular ? 'border-primary border-opacity-50 bg-primary bg-opacity-10' : ''}`}>
                  <div className="d-flex align-items-start justify-content-between">
                    <div>
                      <div className="fw-semibold small">
                        {plan.name}
                        {plan.is_popular && <span className="badge bg-primary ms-2" style={{ fontSize: 9 }}>Popular</span>}
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{plan.units} units/{plan.interval}</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-primary">{formatNGN(plan.amount)}</div>
                      <div className="text-muted" style={{ fontSize: 10 }}>/{plan.interval}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
