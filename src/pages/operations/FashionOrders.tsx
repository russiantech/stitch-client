import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge, SectionHeader, OrderTimeline, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService } from '@/services/api.ts';
import { FASHION_STATUSES, formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { FashionOrder, FashionStatus } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
const STATUSES = FASHION_STATUSES as readonly FashionStatus[];

const MEASUREMENT_LABELS: Record<string, string> = {
  chest: 'Chest', waist: 'Waist', hips: 'Hips', shoulder: 'Shoulder', length: 'Length', sleeve: 'Sleeve', inseam: 'Inseam',
};

export default function FashionOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<FashionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FashionOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.list({ order_type: 'fashion', page_size: 100 });
      setOrders(data.items.filter((o): o is FashionOrder => !('garment_items' in o)));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    const matchStatus = filter ? o.status === filter : true;
    const q = search.toLowerCase();
    const matchSearch = search
      ? (o.customer_name || '').toLowerCase().includes(q) || o.reference.toLowerCase().includes(q) || (o.item_name || '').toLowerCase().includes(q)
      : true;
    return matchStatus && matchSearch;
  });

  const openOrder = (order: FashionOrder) => { setSelected(order); setShowModal(true); };

  const nextStatus = (current: string, direction: 'advance' | 'reverse'): FashionStatus => {
    const idx = STATUSES.indexOf(current as FashionStatus);
    const safeIdx = idx === -1 ? 0 : idx;
    return direction === 'advance'
      ? STATUSES[Math.min(safeIdx + 1, STATUSES.length - 1)]
      : STATUSES[Math.max(safeIdx - 1, 0)];
  };

  const changeStatus = useCallback(async (orderId: number, direction: 'advance' | 'reverse') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const next = nextStatus(order.status, direction);
    if (next === order.status) return;
    try {
      const updated = await orderService.updateStatus(orderId, next, undefined, direction === 'reverse');
      setOrders(prev => prev.map(o => o.id === orderId ? (updated as FashionOrder) : o));
      setSelected(prev => prev && prev.id === orderId ? (updated as FashionOrder) : prev);
      toast.success(`Stage ${direction === 'advance' ? 'advanced' : 'reversed'} to ${next}`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  }, [orders]);

  return (
    <div>
      <SectionHeader
        title="Fashion Orders"
        subtitle="Custom tailoring, alterations, bespoke designs and repairs"
      />

      <div className="d-flex flex-wrap gap-2 mb-3">
        {STATUSES.map(s => {
          const count = orders.filter(o => o.status === s).length;
          if (!count) return null;
          return (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(filter === s ? '' : s)}>
              {s} <span className="badge bg-white text-dark ms-1">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
          placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filter || search) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilter(''); setSearch(''); }}>Clear</button>
        )}
        <span className="text-muted small ms-auto align-self-center">{filtered.length} orders</span>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Order Ref</th>
                  <th className="small fw-medium text-muted">Customer</th>
                  <th className="small fw-medium text-muted">Service</th>
                  <th className="small fw-medium text-muted">Item</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted">Priority</th>
                  <th className="small fw-medium text-muted">Delivery</th>
                  <th className="small fw-medium text-muted text-end pe-4">Amount</th>
                  <th className="small fw-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon="fa-shirt" title="No fashion orders found" /></td></tr>
                ) : filtered.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => openOrder(order)}>
                    <td className="ps-4 fw-medium small">{order.reference}</td>
                    <td>
                      <div className="small fw-medium">{order.customer_name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{order.customer_phone}</div>
                    </td>
                    <td className="small text-muted">{order.service_type}</td>
                    <td className="small">{order.item_name}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <span className={`badge ${order.priority === 'Express' ? 'bg-danger' : 'bg-light text-muted border'}`} style={{ fontSize: 10 }}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="small text-muted">{order.fitting_date || '—'}</td>
                    <td className="text-end pe-4 fw-medium small">{formatNGN(order.total_amount)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-xs btn-outline-secondary"
                          style={{ fontSize: 11, padding: '2px 7px' }}
                          title="Reverse stage"
                          onClick={() => changeStatus(order.id, 'reverse')}
                          disabled={order.status === STATUSES[0]}
                        ><i className="fas fa-arrow-left" /></button>
                        <button
                          className="btn btn-xs btn-outline-primary"
                          style={{ fontSize: 11, padding: '2px 7px' }}
                          title="Advance stage"
                          onClick={() => changeStatus(order.id, 'advance')}
                          disabled={order.status === 'Completed'}
                        ><i className="fas fa-arrow-right" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">{selected.reference} — {selected.item_name}</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Customer</div>
                      <div className="fw-medium">{selected.customer_name || '—'}</div>
                      <div className="text-muted small">{selected.customer_phone}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Service Type</div>
                      <div className="fw-medium">{selected.service_type}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Item / Garment</div>
                      <div className="fw-medium">{selected.item_name}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Fitting Date</div>
                      <div className="fw-medium">{selected.fitting_date || '—'}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Amount</div>
                      <div className="fw-bold text-primary fs-5">{formatNGN(selected.total_amount)}</div>
                    </div>
                    {selected.design_notes && (
                      <div className="alert alert-info py-2 small mb-3">
                        <i className="fas fa-info-circle me-2" />{selected.design_notes}
                      </div>
                    )}
                    {selected.measurements && Object.keys(selected.measurements).length > 0 && (
                      <div className="mb-3">
                        <div className="text-muted small mb-2">Measurements</div>
                        <div className="row g-2">
                          {Object.entries(selected.measurements)
                            .filter(([, v]) => v != null)
                            .map(([k, v]) => (
                              <div key={k} className="col-6">
                                <div className="bg-light rounded-2 p-2 text-center">
                                  <div className="fw-bold">{v}"</div>
                                  <div className="text-muted" style={{ fontSize: 11 }}>{MEASUREMENT_LABELS[k] || k}</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    <div className="d-flex gap-2 mt-3">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => changeStatus(selected.id, 'reverse')}
                        disabled={selected.status === STATUSES[0]}
                      ><i className="fas fa-arrow-left me-1" />Reverse</button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => changeStatus(selected.id, 'advance')}
                        disabled={selected.status === 'Completed'}
                      ><i className="fas fa-arrow-right me-1" />Advance</button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-2">Fashion Workflow Progress</div>
                    <OrderTimeline statuses={STATUSES as unknown as string[]} currentStatus={selected.status} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
