import React, { useState } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { MOCK_ANALYTICS, MOCK_LAUNDRY_ORDERS, MOCK_FASHION_ORDERS, formatNGN } from '../../services/mockData.js';

// Simple bar using CSS only (no chart library)
function BarChart({ data, maxValue, color = 'bg-primary' }) {
  return (
    <div className="d-flex align-items-end gap-2" style={{ height: 120 }}>
      {data.map((item, i) => (
        <div key={i} className="d-flex flex-column align-items-center flex-1">
          <div
            className={`w-100 rounded-top ${color}`}
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: 4, transition: 'height 0.5s ease' }}
          />
          <div className="text-muted mt-1" style={{ fontSize: 10 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutRing({ percentage, color = '#0d6efd', size = 80 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f0f1f3" strokeWidth="10" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill="#212529">{percentage}%</text>
    </svg>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const REVENUE_DATA = [
  { label: 'Jan', value: 180000 },
  { label: 'Feb', value: 210000 },
  { label: 'Mar', value: 195000 },
  { label: 'Apr', value: 240000 },
  { label: 'May', value: 285000 },
  { label: 'Jun', value: 0 },
];
const ORDER_DATA = [
  { label: 'Jan', value: 52 },
  { label: 'Feb', value: 68 },
  { label: 'Mar', value: 61 },
  { label: 'Apr', value: 74 },
  { label: 'May', value: 87 },
  { label: 'Jun', value: 0 },
];

export default function Analytics() {
  const [period, setPeriod] = useState('month');

  const allOrders = [...MOCK_LAUNDRY_ORDERS, ...MOCK_FASHION_ORDERS];
  const statusBreakdown = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <SectionHeader
        title="Analytics & Reports"
        subtitle="Business performance, revenue and operational metrics"
        actions={
          <div className="d-flex gap-2">
            <div className="btn-group btn-group-sm">
              {['week', 'month', 'quarter'].map(p => (
                <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button className="btn btn-outline-secondary btn-sm">
              <i className="fas fa-download me-1" />Export
            </button>
          </div>
        }
      />

      {/* Top KPIs */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Revenue', value: formatNGN(MOCK_ANALYTICS.revenue.total), change: '+35.7%', icon: 'fa-naira-sign', color: 'success' },
          { label: 'Total Orders', value: MOCK_ANALYTICS.orders.total, change: '+22%', icon: 'fa-box', color: 'primary' },
          { label: 'Total Customers', value: MOCK_ANALYTICS.customers.total, change: '+18 new', icon: 'fa-users', color: 'info' },
          { label: 'On-Time Delivery', value: `${MOCK_ANALYTICS.deliveries.on_time_rate}%`, change: 'This month', icon: 'fa-truck', color: 'warning' },
        ].map(kpi => (
          <div key={kpi.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="stat-label">{kpi.label}</div>
                  <div className="stat-value">{kpi.value}</div>
                  <div className="stat-change text-success">
                    <i className="fas fa-arrow-up me-1" />{kpi.change}
                  </div>
                </div>
                <div className={`stat-icon bg-${kpi.color} bg-opacity-10`} style={{ width: 44, height: 44 }}>
                  <i className={`fas ${kpi.icon} text-${kpi.color}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* Revenue Chart */}
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h6 className="fw-semibold mb-0">Monthly Revenue</h6>
                <div className="text-muted small">Jan — Jun 2025</div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-primary">{formatNGN(MOCK_ANALYTICS.revenue.this_month)}</div>
                <div className="text-success small">+35.7% vs last month</div>
              </div>
            </div>
            <BarChart data={REVENUE_DATA} maxValue={300000} color="bg-primary" />
          </div>
        </div>

        {/* Orders Chart */}
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h6 className="fw-semibold mb-0">Monthly Orders</h6>
                <div className="text-muted small">Jan — Jun 2025</div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-info">{MOCK_ANALYTICS.orders.this_month}</div>
                <div className="text-success small">This month</div>
              </div>
            </div>
            <BarChart data={ORDER_DATA} maxValue={100} color="bg-info" />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Order Mix */}
        <div className="col-lg-4">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Order Mix</h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'Laundry', value: MOCK_ANALYTICS.orders.laundry, total: MOCK_ANALYTICS.orders.total, color: '#0d6efd' },
                { label: 'Fashion', value: MOCK_ANALYTICS.orders.fashion, total: MOCK_ANALYTICS.orders.total, color: '#0dcaf0' },
              ].map(item => {
                const pct = Math.round((item.value / item.total) * 100);
                return (
                  <div key={item.label} className="d-flex align-items-center gap-3">
                    <DonutRing percentage={pct} color={item.color} size={64} />
                    <div>
                      <div className="fw-semibold">{item.label}</div>
                      <div className="text-muted small">{item.value} orders ({pct}%)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delivery Stats */}
        <div className="col-lg-4">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Delivery Performance</h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'Completed', value: MOCK_ANALYTICS.deliveries.completed, color: 'bg-success' },
                { label: 'Pending', value: MOCK_ANALYTICS.deliveries.pending, color: 'bg-warning' },
                { label: 'Failed', value: MOCK_ANALYTICS.deliveries.failed, color: 'bg-danger' },
              ].map(d => (
                <div key={d.label}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span>{d.label}</span>
                    <span className="fw-medium">{d.value}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }}>
                    <div
                      className={`progress-bar ${d.color}`}
                      style={{ width: `${(d.value / (MOCK_ANALYTICS.deliveries.completed + MOCK_ANALYTICS.deliveries.pending + MOCK_ANALYTICS.deliveries.failed)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="bg-light rounded-2 p-2 text-center mt-2">
                <div className="fw-bold text-success fs-5">{MOCK_ANALYTICS.deliveries.on_time_rate}%</div>
                <div className="text-muted small">On-Time Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="col-lg-4">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Customer Segments</h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'Total', value: MOCK_ANALYTICS.customers.total, icon: 'fa-users', color: 'primary' },
                { label: 'New This Month', value: MOCK_ANALYTICS.customers.new_this_month, icon: 'fa-user-plus', color: 'success' },
                { label: 'Returning', value: MOCK_ANALYTICS.customers.returning, icon: 'fa-redo', color: 'info' },
                { label: 'VIP', value: MOCK_ANALYTICS.customers.vip, icon: 'fa-star', color: 'warning' },
              ].map(c => (
                <div key={c.label} className="d-flex align-items-center justify-content-between p-2 bg-light rounded-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fas ${c.icon} text-${c.color} small`} />
                    <span className="small">{c.label}</span>
                  </div>
                  <span className="fw-bold small">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-3 border p-4">
        <h6 className="fw-semibold mb-4">Order Status Breakdown</h6>
        <div className="row g-3">
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} className="col-6 col-sm-4 col-lg-2">
              <div className="text-center p-3 bg-light rounded-3">
                <div className="fw-bold fs-5">{count}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
