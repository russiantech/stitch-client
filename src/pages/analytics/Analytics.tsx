import React, { useState, useEffect } from 'react';
import { SectionHeader, LoadingSpinner } from '@/components/shared/index.tsx';
import { analyticsService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { DashboardKPIs, RevenueChartPoint, SubscriptionAnalytics } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

function BarChart({ data, maxValue, color = 'bg-primary' }: { data: { label: string; value: number }[]; maxValue: number; color?: string }) {
  return (
    <div className="d-flex align-items-end gap-2" style={{ height: 120 }}>
      {data.map((item, i) => (
        <div key={i} className="d-flex flex-column align-items-center flex-1">
          <div
            className={`w-100 rounded-top ${color}`}
            style={{ height: `${maxValue ? (item.value / maxValue) * 100 : 0}%`, minHeight: 4, transition: 'height 0.5s ease' }}
          />
          <div className="text-muted mt-1" style={{ fontSize: 10 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function DonutRing({ percentage, color = 'var(--primary)', size = 80 }: { percentage: number; color?: string; size?: number }) {
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

export default function Analytics() {
  const toast = useToast();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartPoint[]>([]);
  const [subAnalytics, setSubAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      analyticsService.dashboard(period),
      analyticsService.revenue(6),
      analyticsService.subscriptions(),
    ]).then(([dashRes, revRes, subRes]) => {
      if (dashRes.status === 'fulfilled') setKpis(dashRes.value);
      else toast.error(errMsg(dashRes.reason));
      if (revRes.status === 'fulfilled') setRevenueChart(revRes.value.chart);
      if (subRes.status === 'fulfilled') setSubAnalytics(subRes.value);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading || !kpis) return <LoadingSpinner message="Loading analytics…" />;

  const revenueData = revenueChart.map(p => ({ label: p.label, value: p.revenue }));
  const orderData = revenueChart.map(p => ({ label: p.label, value: p.orders }));
  const maxRevenue = Math.max(...revenueData.map(d => d.value), 1);
  const maxOrders = Math.max(...orderData.map(d => d.value), 1);
  const orderMixTotal = kpis.orders.laundry + kpis.orders.fashion;

  return (
    <div>
      <SectionHeader
        title="Analytics & Reports"
        subtitle="Business performance, revenue and operational metrics"
        actions={
          <div className="btn-group btn-group-sm">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      <div className="row g-3 mb-4" data-tour="tour-analytics-kpis">
        {[
          { label: 'Total Revenue', value: formatNGN(kpis.revenue.total), change: `${kpis.revenue.growth >= 0 ? '+' : ''}${kpis.revenue.growth}%`, icon: 'fa-naira-sign', color: 'success' },
          { label: 'Total Orders', value: kpis.orders.total, change: `${kpis.orders.this_period} this period`, icon: 'fa-box', color: 'dark' },
          { label: 'Total Customers', value: kpis.customers.total, change: `+${kpis.customers.new_period} new`, icon: 'fa-users', color: 'info' },
          { label: 'Completed Orders', value: kpis.deliveries.completed, change: `${kpis.deliveries.delivered} delivered`, icon: 'fa-truck', color: 'warning' },
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

      <div className="row g-4 mb-4" data-tour="tour-analytics-charts">
        <div className="col-lg-6">
          <div className="bg-white rounded-3 border p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h6 className="fw-semibold mb-0">Monthly Revenue</h6>
                <div className="text-muted small">Last 6 months</div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-primary">{formatNGN(kpis.revenue.this_period)}</div>
                <div className="text-success small">{kpis.revenue.growth >= 0 ? '+' : ''}{kpis.revenue.growth}% vs last period</div>
              </div>
            </div>
            <BarChart data={revenueData} maxValue={maxRevenue} color="bg-primary" />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white rounded-3 border p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h6 className="fw-semibold mb-0">Monthly Orders</h6>
                <div className="text-muted small">Last 6 months</div>
              </div>
              <div className="text-end">
                <div className="fw-bold text-info">{kpis.orders.this_period}</div>
                <div className="text-success small">This period</div>
              </div>
            </div>
            <BarChart data={orderData} maxValue={maxOrders} color="bg-info" />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4" data-tour="tour-analytics-order-mix">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Order Mix</h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'Laundry', value: kpis.orders.laundry, color: 'var(--primary)' },
                { label: 'Fashion', value: kpis.orders.fashion, color: '#0dcaf0' },
              ].map(item => {
                const pct = orderMixTotal > 0 ? Math.round((item.value / orderMixTotal) * 100) : 0;
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

        <div className="col-lg-4" data-tour="tour-analytics-delivery-perf">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Delivery Performance</h6>
            <div className="d-flex flex-column gap-3">
              {[
                { label: 'Delivered', value: kpis.deliveries.delivered, color: 'bg-success' },
                { label: 'Completed', value: kpis.deliveries.completed, color: 'bg-primary' },
                { label: 'Pending Orders', value: kpis.orders.pending, color: 'bg-warning' },
              ].map(d => {
                const total = Math.max(kpis.deliveries.delivered + kpis.deliveries.completed + kpis.orders.pending, 1);
                return (
                  <div key={d.label}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{d.label}</span>
                      <span className="fw-medium">{d.value}</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div className={`progress-bar ${d.color}`} style={{ width: `${(d.value / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-lg-4" data-tour="tour-analytics-sub-perf">
          <div className="bg-white rounded-3 border p-4">
            <h6 className="fw-semibold mb-4">Subscription Performance</h6>
            <div className="d-flex flex-column gap-3">
              {subAnalytics ? [
                { label: 'Active Plans', value: subAnalytics.active, icon: 'fa-check-circle', color: 'success' },
                { label: 'Paused', value: subAnalytics.paused, icon: 'fa-pause-circle', color: 'warning' },
                { label: 'Cancelled', value: subAnalytics.cancelled, icon: 'fa-times-circle', color: 'secondary' },
                { label: 'Sub Revenue', value: formatNGN(subAnalytics.total_subscription_revenue), icon: 'fa-naira-sign', color: 'primary' },
              ].map(c => (
                <div key={c.label} className="d-flex align-items-center justify-content-between p-2 bg-light rounded-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fas ${c.icon} text-${c.color} small`} />
                    <span className="small">{c.label}</span>
                  </div>
                  <span className="fw-bold small">{c.value}</span>
                </div>
              )) : <div className="text-muted small">Not available</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 border p-4">
        <h6 className="fw-semibold mb-4">Order Status Breakdown</h6>
        <div className="row g-3">
          {Object.entries(kpis.status_breakdown).map(([status, count]) => (
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
