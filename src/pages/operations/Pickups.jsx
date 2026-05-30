import React, { useState } from 'react';
import { SectionHeader, StatusBadge } from '../../components/shared/index.jsx';
import { MOCK_LAUNDRY_ORDERS, MOCK_DRIVERS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Pickups() {
  const toast = useToast();
  const [orders, setOrders] = useState(MOCK_LAUNDRY_ORDERS.filter(o => o.status === 'Received' || o.status === 'Sorted'));
  const [assigned, setAssigned] = useState({});

  const assignDriver = (orderId, driverId) => {
    setAssigned(prev => ({ ...prev, [orderId]: driverId }));
    toast.success(`Driver assigned to order ${orderId}`);
  };

  const confirmPickup = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast.success(`Pickup confirmed for order ${orderId}`);
  };

  return (
    <div>
      <SectionHeader
        title="Pending Pickups"
        subtitle="Orders awaiting collection from customers"
      />

      {/* Driver Availability */}
      <div className="row g-3 mb-4">
        {MOCK_DRIVERS.map(d => (
          <div key={d.id} className="col-md-6">
            <div className="bg-white rounded-3 border p-3 d-flex align-items-center gap-3">
              <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 ${d.status === 'Available' ? 'bg-success' : 'bg-warning'}`}
                style={{ width: 38, height: 38, fontSize: 14 }}>
                {d.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="fw-medium small">{d.name}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{d.vehicle}</div>
              </div>
              <div className="text-end">
                <span className={`badge ${d.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: 10 }}>
                  {d.status}
                </span>
                <div className="text-muted" style={{ fontSize: 10 }}>{d.current_area}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Pickup Orders */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-card-header p-3 border-bottom">
          <h6 className="mb-0 fw-semibold">Orders Awaiting Pickup ({orders.length})</h6>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Order</th>
                <th className="small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Address</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted">Pickup Date</th>
                <th className="small fw-medium text-muted">Assign Driver</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted small">
                    <i className="fas fa-check-circle text-success d-block fs-3 mb-2" />
                    All pickups are cleared!
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td className="ps-4 fw-medium small">{order.id}</td>
                  <td>
                    <div className="small fw-medium">{order.customer}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{order.phone}</div>
                  </td>
                  <td className="small text-muted" style={{ maxWidth: 200 }}>{order.address}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td className="small text-muted">{order.pickup}</td>
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
                    <button
                      className="btn btn-sm btn-success"
                      style={{ fontSize: 11 }}
                      onClick={() => confirmPickup(order.id)}
                    >
                      <i className="fas fa-check me-1" />Confirm Pickup
                    </button>
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
