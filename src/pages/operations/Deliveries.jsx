import React, { useState } from 'react';
import { SectionHeader, StatusBadge } from '../../components/shared/index.jsx';
import { MOCK_LAUNDRY_ORDERS, MOCK_DRIVERS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Deliveries() {
  const toast = useToast();
  const readyOrders = MOCK_LAUNDRY_ORDERS.filter(o => o.status === 'Ready For Delivery' || o.status === 'Out For Delivery');
  const [orders, setOrders] = useState(readyOrders);
  const [assigned, setAssigned] = useState({});

  const assignDriver = (orderId, driverId) => {
    setAssigned(prev => ({ ...prev, [orderId]: driverId }));
    const driver = MOCK_DRIVERS.find(d => String(d.id) === driverId);
    toast.success(`${driver?.name || 'Driver'} assigned to ${orderId}`);
  };

  const markDelivered = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Delivered' } : o
    ));
    toast.success(`Order ${orderId} marked as delivered`);
  };

  const markOutForDelivery = (orderId) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Out For Delivery' } : o
    ));
    toast.success(`Order ${orderId} is out for delivery`);
  };

  return (
    <div>
      <SectionHeader
        title="Deliveries"
        subtitle="Orders ready for dispatch and active deliveries"
      />

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Ready for Dispatch</div>
            <div className="stat-value text-primary">{orders.filter(o => o.status === 'Ready For Delivery').length}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Out for Delivery</div>
            <div className="stat-value text-warning">{orders.filter(o => o.status === 'Out For Delivery').length}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Delivered Today</div>
            <div className="stat-value text-success">4</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Active Drivers</div>
            <div className="stat-value">{MOCK_DRIVERS.length}</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Delivery Queue</h6>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Address</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted">Due Date</th>
                <th className="small fw-medium text-muted text-end">Amount</th>
                <th className="small fw-medium text-muted">Assign Driver</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted small">
                    <i className="fas fa-truck d-block fs-3 mb-2 opacity-25" />
                    No pending deliveries
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td className="ps-4 fw-medium small">{order.id}</td>
                  <td>
                    <div className="small fw-medium">{order.customer}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{order.phone}</div>
                  </td>
                  <td className="small text-muted" style={{ maxWidth: 180 }}>{order.address}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="small text-muted">{order.delivery}</td>
                  <td className="text-end fw-medium small">{formatNGN(order.amount)}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      style={{ maxWidth: 160 }}
                      value={assigned[order.id] || ''}
                      onChange={e => assignDriver(order.id, e.target.value)}
                    >
                      <option value="">Assign driver…</option>
                      {MOCK_DRIVERS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="pe-4">
                    <div className="d-flex gap-1">
                      {order.status === 'Ready For Delivery' && (
                        <button
                          className="btn btn-xs btn-outline-warning"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => markOutForDelivery(order.id)}
                        >
                          <i className="fas fa-truck me-1" />Dispatch
                        </button>
                      )}
                      {order.status === 'Out For Delivery' && (
                        <button
                          className="btn btn-xs btn-success"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => markDelivered(order.id)}
                        >
                          <i className="fas fa-check me-1" />Delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
