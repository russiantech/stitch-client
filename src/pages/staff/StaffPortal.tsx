import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService } from '@/services/api.ts';
import { LAUNDRY_STATUSES } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { LaundryOrder, LaundryStatus } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
const STATUSES = LAUNDRY_STATUSES as readonly LaundryStatus[];
const ACTIVE_STAGES: LaundryStatus[] = ['Sorted', 'Washing', 'Drying', 'Ironing', 'Folding', 'Packing'];

export default function StaffPortal() {
  const toast = useToast();
  const [inProgress, setInProgress] = useState<LaundryOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(ACTIVE_STAGES.map(s => orderService.list({ order_type: 'laundry', status: s, page_size: 50 })));
      const all = results.flatMap(r => r.items).filter((o): o is LaundryOrder => 'garment_items' in o);
      setInProgress(all);

      const [receivedRes, completedRes] = await Promise.all([
        orderService.list({ order_type: 'laundry', status: 'Received', page_size: 1 }),
        orderService.list({ order_type: 'laundry', status: 'Completed', page_size: 1 }),
      ]);
      setPendingCount(receivedRes.pagination.total);
      setCompletedTodayCount(completedRes.pagination.total);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const advanceStage = async (order: LaundryOrder) => {
    const idx = STATUSES.indexOf(order.status as LaundryStatus);
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    if (next === order.status) return;
    try {
      await orderService.updateStatus(order.id, next);
      toast.success(`Order #${order.id} moved to ${next}`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <SectionHeader title="Staff Portal" subtitle="Live laundry production queue" />

      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-warning">{pendingCount}</div>
            <div className="stat-label">Awaiting Pickup</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-primary">{inProgress.length}</div>
            <div className="stat-label">In Production</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-success">{completedTodayCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden mb-4">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Production Queue — advance each order's stage as work progresses</h6>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="p-3 d-flex flex-column gap-3">
            {inProgress.length === 0 ? (
              <div className="text-center text-muted small py-3">Nothing in production right now.</div>
            ) : inProgress.map(order => (
              <div key={order.id} className="border rounded-3 p-3">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <div className="fw-medium small">{order.reference}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{order.customer_name} · {order.garment_count ?? order.garment_items.length} items</div>
                  </div>
                  <div className="d-flex gap-1 align-items-center">
                    {order.priority === 'Express' && <span className="badge bg-danger" style={{ fontSize: 9 }}>Express</span>}
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => advanceStage(order)}>
                    <i className="fas fa-arrow-right me-1" />Advance to next stage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Laundry Production Queue</h6>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Order</th>
                  <th className="small fw-medium text-muted">Customer</th>
                  <th className="small fw-medium text-muted">Items</th>
                  <th className="small fw-medium text-muted">Current Stage</th>
                  <th className="small fw-medium text-muted pe-4">Priority</th>
                </tr>
              </thead>
              <tbody>
                {inProgress.map(o => (
                  <tr key={o.id}>
                    <td className="ps-4 fw-medium small">{o.reference}</td>
                    <td className="small text-muted">{o.customer_name || '—'}</td>
                    <td className="small">{o.garment_count ?? o.garment_items.length}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="pe-4">
                      <span className={`badge ${o.priority === 'Express' ? 'bg-danger' : 'bg-light text-muted border'}`} style={{ fontSize: 10 }}>
                        {o.priority}
                      </span>
                    </td>
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
