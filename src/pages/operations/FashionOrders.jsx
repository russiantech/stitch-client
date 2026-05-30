import React, { useState, useCallback } from 'react';
import { StatusBadge, SectionHeader, OrderTimeline, EmptyState } from '../../components/shared/index.jsx';
import { orderService } from '../../services/api.js';
import { MOCK_FASHION_ORDERS, FASHION_STATUSES, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function FashionOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState(MOCK_FASHION_ORDERS);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = orders.filter(o => {
    const matchStatus = filter ? o.status === filter : true;
    const matchSearch = search
      ? o.customer.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.item.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  const openOrder = (order) => { setSelected(order); setShowModal(true); };

  const changeStatus = useCallback(async (orderId, direction) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = FASHION_STATUSES.indexOf(o.status);
      const next = direction === 'advance'
        ? FASHION_STATUSES[Math.min(idx + 1, FASHION_STATUSES.length - 1)]
        : FASHION_STATUSES[Math.max(idx - 1, 0)];
      return next === o.status ? o : { ...o, status: next };
    }));
    setSelected(prev => {
      if (!prev || prev.id !== orderId) return prev;
      const idx = FASHION_STATUSES.indexOf(prev.status);
      const next = direction === 'advance'
        ? FASHION_STATUSES[Math.min(idx + 1, FASHION_STATUSES.length - 1)]
        : FASHION_STATUSES[Math.max(idx - 1, 0)];
      return { ...prev, status: next };
    });
    try {
      const o = orders.find(x => x.id === orderId);
      const idx = FASHION_STATUSES.indexOf(o.status);
      const next = direction === 'advance'
        ? FASHION_STATUSES[Math.min(idx + 1, FASHION_STATUSES.length - 1)]
        : FASHION_STATUSES[Math.max(idx - 1, 0)];
      await orderService.updateStatus(orderId, next);
    } catch {}
    toast.success(`Status ${direction === 'advance' ? 'advanced' : 'reversed'}`);
  }, [orders]);

  const MEASUREMENT_LABELS = { chest: 'Chest', waist: 'Waist', hips: 'Hips', shoulder: 'Shoulder' };

  return (
    <div>
      <SectionHeader
        title="Fashion Orders"
        subtitle="Custom tailoring, alterations, bespoke designs and repairs"
        actions={<button className="btn btn-primary btn-sm"><i className="fas fa-plus me-1" />New Fashion Order</button>}
      />

      {/* Status chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {FASHION_STATUSES.map(s => {
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

      {/* Filters */}
      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input className="form-control form-control-sm" style={{ maxWidth: 220 }}
          placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {FASHION_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filter || search) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilter(''); setSearch(''); }}>Clear</button>
        )}
        <span className="text-muted small ms-auto align-self-center">{filtered.length} orders</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Order ID</th>
                <th className="small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Service</th>
                <th className="small fw-medium text-muted">Item</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted">Priority</th>
                <th className="small fw-medium text-muted">Due</th>
                <th className="small fw-medium text-muted text-end pe-4">Amount</th>
                <th className="small fw-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon="fa-shirt" title="No fashion orders found" /></td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => openOrder(order)}>
                  <td className="ps-4 fw-medium small">{order.id}</td>
                  <td>
                    <div className="small fw-medium">{order.customer}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{order.phone}</div>
                  </td>
                  <td className="small text-muted">{order.service}</td>
                  <td className="small">{order.item}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <span className={`badge ${order.priority === 'Express' ? 'bg-danger' : 'bg-light text-muted border'}`} style={{ fontSize: 10 }}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="small text-muted">{order.delivery}</td>
                  <td className="text-end pe-4 fw-medium small">{formatNGN(order.amount)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-xs btn-outline-secondary"
                        style={{ fontSize: 11, padding: '2px 7px' }}
                        title="Reverse stage"
                        onClick={() => changeStatus(order.id, 'reverse')}
                        disabled={order.status === FASHION_STATUSES[0]}
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
      </div>

      {/* Detail Modal */}
      {showModal && selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">{selected.id} — {selected.item}</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Customer</div>
                      <div className="fw-medium">{selected.customer}</div>
                      <div className="text-muted small">{selected.phone}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Service Type</div>
                      <div className="fw-medium">{selected.service}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Item / Garment</div>
                      <div className="fw-medium">{selected.item}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Delivery Date</div>
                      <div className="fw-medium">{selected.delivery}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Amount</div>
                      <div className="fw-bold text-primary fs-5">{formatNGN(selected.amount)}</div>
                    </div>
                    {selected.notes && (
                      <div className="alert alert-info py-2 small mb-3">
                        <i className="fas fa-info-circle me-2" />{selected.notes}
                      </div>
                    )}
                    {Object.keys(selected.measurements || {}).length > 0 && (
                      <div className="mb-3">
                        <div className="text-muted small mb-2">Measurements</div>
                        <div className="row g-2">
                          {Object.entries(selected.measurements).map(([k, v]) => (
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
                        disabled={selected.status === FASHION_STATUSES[0]}
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
                    <OrderTimeline statuses={FASHION_STATUSES} currentStatus={selected.status} />
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
