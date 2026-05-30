import React, { useState, useCallback } from 'react';
import { StatusBadge, SectionHeader, OrderTimeline, EmptyState } from '../../components/shared/index.jsx';
import { orderService } from '../../services/api.js';
import { MOCK_LAUNDRY_ORDERS, LAUNDRY_STATUSES, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function LaundryOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState(MOCK_LAUNDRY_ORDERS);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = orders.filter(o => {
    const matchStatus = filter ? o.status === filter : true;
    const matchSearch = search
      ? o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  const openOrder = (order) => { setSelected(order); setShowModal(true); };

  const changeStatus = useCallback(async (orderId, direction) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = LAUNDRY_STATUSES.indexOf(o.status);
      const next = direction === 'advance'
        ? LAUNDRY_STATUSES[Math.min(idx + 1, LAUNDRY_STATUSES.length - 1)]
        : LAUNDRY_STATUSES[Math.max(idx - 1, 0)];
      if (next === o.status) return o;
      return { ...o, status: next };
    }));
    if (selected?.id === orderId) {
      setSelected(prev => {
        const idx = LAUNDRY_STATUSES.indexOf(prev.status);
        const next = direction === 'advance'
          ? LAUNDRY_STATUSES[Math.min(idx + 1, LAUNDRY_STATUSES.length - 1)]
          : LAUNDRY_STATUSES[Math.max(idx - 1, 0)];
        return { ...prev, status: next };
      });
    }
    try {
      const o = orders.find(x => x.id === orderId);
      const idx = LAUNDRY_STATUSES.indexOf(o.status);
      const next = direction === 'advance'
        ? LAUNDRY_STATUSES[Math.min(idx + 1, LAUNDRY_STATUSES.length - 1)]
        : LAUNDRY_STATUSES[Math.max(idx - 1, 0)];
      await orderService.updateStatus(orderId, next);
    } catch {}
    toast.success(`Status ${direction === 'advance' ? 'advanced' : 'reversed'}`);
  }, [orders, selected]);

  return (
    <div>
      <SectionHeader
        title="Laundry Orders"
        subtitle="Manage and track all laundry service orders"
        actions={<button className="btn btn-primary btn-sm"><i className="fas fa-plus me-1" />New Order</button>}
      />

      {/* Status chips */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {LAUNDRY_STATUSES.map(s => {
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
        <input className="form-control form-control-sm" style={{ maxWidth: 220 }} placeholder="Search order or customer…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {LAUNDRY_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(filter || search) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setFilter(''); setSearch(''); }}>Clear</button>
        )}
        <span className="text-muted small ms-auto">{filtered.length} orders</span>
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
                <th className="small fw-medium text-muted">Items</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted">Priority</th>
                <th className="small fw-medium text-muted">Payment</th>
                <th className="small fw-medium text-muted">Due</th>
                <th className="small fw-medium text-muted text-end pe-4">Amount</th>
                <th className="small fw-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon="fa-box-open" title="No orders found" /></td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => openOrder(order)}>
                  <td className="ps-4 fw-medium small">{order.id}</td>
                  <td>
                    <div className="small fw-medium">{order.customer}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{order.phone}</div>
                  </td>
                  <td className="small text-muted">{order.service}</td>
                  <td className="small">{order.items}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    <span className={`badge ${order.priority === 'Express' ? 'bg-danger' : 'bg-light text-muted border'}`} style={{ fontSize: 10 }}>
                      {order.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`} style={{ fontSize: 10 }}>
                      {order.payment_method === 'subscription' ? 'Sub' : 'Direct'}
                    </span>
                  </td>
                  <td className="small text-muted">{order.delivery}</td>
                  <td className="text-end pe-4 fw-medium small">{formatNGN(order.amount)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-xs btn-outline-secondary"
                        style={{ fontSize: 11, padding: '2px 7px' }}
                        title="Reverse status"
                        onClick={() => changeStatus(order.id, 'reverse')}
                        disabled={order.status === LAUNDRY_STATUSES[0]}
                      ><i className="fas fa-arrow-left" /></button>
                      <button
                        className="btn btn-xs btn-outline-primary"
                        style={{ fontSize: 11, padding: '2px 7px' }}
                        title="Advance status"
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
                <h6 className="modal-title fw-semibold">Order {selected.id}</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="mb-3"><div className="text-muted small mb-1">Customer</div>
                      <div className="fw-medium">{selected.customer}</div>
                      <div className="text-muted small">{selected.phone}</div>
                    </div>
                    <div className="mb-3"><div className="text-muted small mb-1">Service</div><div className="fw-medium">{selected.service}</div></div>
                    <div className="mb-3"><div className="text-muted small mb-1">Items</div><div className="fw-medium">{selected.items} garments</div></div>
                    <div className="mb-3"><div className="text-muted small mb-1">Address</div><div className="small">{selected.address}</div></div>
                    <div className="mb-3">
                      <div className="text-muted small mb-1">Payment</div>
                      <span className={`badge ${selected.payment_method === 'subscription' ? 'bg-primary' : 'bg-success'}`}>
                        {selected.payment_method === 'subscription' ? 'Subscription' : 'Direct / Paystack'}
                      </span>
                    </div>
                    <div className="mb-4"><div className="text-muted small mb-1">Amount</div>
                      <div className="fw-bold text-primary fs-5">{formatNGN(selected.amount)}</div>
                    </div>
                    {selected.notes && (
                      <div className="alert alert-warning py-2 small mb-3">
                        <i className="fas fa-sticky-note me-2" />{selected.notes}
                      </div>
                    )}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => changeStatus(selected.id, 'reverse')}
                        disabled={selected.status === LAUNDRY_STATUSES[0]}
                      ><i className="fas fa-arrow-left me-1" />Reverse</button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => changeStatus(selected.id, 'advance')}
                        disabled={selected.status === 'Completed'}
                      ><i className="fas fa-arrow-right me-1" />Advance</button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted small mb-2">Order Progress</div>
                    <OrderTimeline statuses={LAUNDRY_STATUSES} currentStatus={selected.status} />
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
