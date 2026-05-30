import React from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatusBadge, SectionHeader } from '../../components/shared/index.jsx';
import { MOCK_ANALYTICS, MOCK_LAUNDRY_ORDERS, MOCK_FASHION_ORDERS, MOCK_STAFF, formatNGN } from '../../services/mockData.js';

export default function OpsDashboard() {
  const urgent = MOCK_LAUNDRY_ORDERS.filter(o => o.priority === 'Express' && o.status !== 'Completed');

  return (
    <div>
      <SectionHeader
        title="Operations Dashboard"
        subtitle="Live overview of laundry and fashion operations"
        actions={
          <button className="btn btn-sm btn-primary">
            <i className="fas fa-refresh me-1" />Refresh
          </button>
        }
      />

      {/* KPI Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Revenue (Month)" value={formatNGN(MOCK_ANALYTICS.revenue.this_month)} icon="fa-naira-sign" iconBg="bg-success" change="+35.7% vs last month" changeType="positive" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Active Orders" value={MOCK_ANALYTICS.orders.pending} icon="fa-box" iconBg="bg-warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Laundry Orders" value={MOCK_ANALYTICS.orders.laundry} icon="fa-soap" iconBg="bg-primary" change="This month" changeType="positive" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Fashion Orders" value={MOCK_ANALYTICS.orders.fashion} icon="fa-shirt" iconBg="bg-info" />
        </div>
      </div>

      {/* Quick Nav */}
      <div className="row g-3 mb-4">
        {[
          { to: '/ops/laundry', icon: 'fa-soap', label: 'Laundry Orders', count: MOCK_LAUNDRY_ORDERS.length, color: 'primary' },
          { to: '/ops/fashion', icon: 'fa-shirt', label: 'Fashion Orders', count: MOCK_FASHION_ORDERS.length, color: 'info' },
          { to: '/ops/pickups', icon: 'fa-truck-pickup', label: 'Pending Pickups', count: 5, color: 'warning' },
          { to: '/ops/deliveries', icon: 'fa-truck', label: 'Pending Deliveries', count: 8, color: 'success' },
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
        {/* Urgent Orders */}
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border overflow-hidden">
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <h6 className="fw-semibold mb-0">
                <i className="fas fa-bolt text-warning me-2" />Urgent / Express
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
                    <th className="small fw-medium text-muted pe-3">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {urgent.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted py-3 small">No urgent orders</td></tr>
                  ) : urgent.map(o => (
                    <tr key={o.id}>
                      <td className="ps-3 fw-medium small">{o.id}</td>
                      <td className="small">{o.customer}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="pe-3 small text-muted">{o.delivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Staff Overview */}
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border overflow-hidden">
            <div className="p-3 border-bottom">
              <h6 className="fw-semibold mb-0"><i className="fas fa-users text-primary me-2" />Staff Today</h6>
            </div>
            <div className="p-3 d-flex flex-column gap-2">
              {MOCK_STAFF.map(s => (
                <div key={s.id} className="d-flex align-items-center gap-3 p-2 rounded-2 bg-light">
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold" style={{ width: 36, height: 36, flexShrink: 0, fontSize: 13 }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="fw-medium small">{s.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{s.role}</div>
                  </div>
                  <div className="text-end">
                    <div className="fw-semibold small">{s.completed_today}/{s.tasks}</div>
                    <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: 10 }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Laundry */}
        <div className="col-12">
          <div className="bg-white rounded-3 border overflow-hidden">
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
                    <th className="ps-3 small fw-medium text-muted">Order ID</th>
                    <th className="small fw-medium text-muted">Customer</th>
                    <th className="small fw-medium text-muted">Service</th>
                    <th className="small fw-medium text-muted">Status</th>
                    <th className="small fw-medium text-muted">Priority</th>
                    <th className="small fw-medium text-muted pe-3 text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LAUNDRY_ORDERS.map(order => (
                    <tr key={order.id}>
                      <td className="ps-3 fw-medium small">{order.id}</td>
                      <td className="small">{order.customer}</td>
                      <td className="small text-muted">{order.service}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>
                        <span className={`badge ${order.priority === 'Express' ? 'bg-danger' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ fontSize: 10 }}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="pe-3 text-end fw-medium small">{formatNGN(order.amount)}</td>
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
