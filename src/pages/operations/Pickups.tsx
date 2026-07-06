import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService, userService } from '@/services/api.ts';
import { formatDate } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { LaundryOrder, User } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

export default function Pickups() {
  const toast = useToast();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [assigned, setAssigned] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [receivedRes, sortedRes] = await Promise.all([
        orderService.list({ order_type: 'laundry', status: 'Received', page_size: 100 }),
        orderService.list({ order_type: 'laundry', status: 'Sorted', page_size: 100 }),
      ]);
      setOrders([...receivedRes.items, ...sortedRes.items].filter((o): o is LaundryOrder => 'garment_items' in o));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    userService.list({ page_size: 100 })
      .then(d => setDrivers(d.items.filter(u => u.roles.includes('driver'))))
      .catch(() => { /* ignore */ });
  }, [load]);

  const assignDriver = async (orderId: number, driverId: string) => {
    setAssigned(prev => ({ ...prev, [orderId]: driverId }));
    const driver = drivers.find(d => d.id === driverId);
    try {
      await orderService.update(orderId, { assigned_driver_id: driverId || null });
      toast.success(`${driver?.names || 'Driver'} assigned to order #${orderId}`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const confirmPickup = async (orderId: number) => {
    try {
      await orderService.updateStatus(orderId, 'Sorted', 'Picked up from customer');
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success(`Pickup confirmed for order #${orderId}`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Pending Pickups"
        subtitle="Orders awaiting collection from customers"
      />

      <div className="row g-3 mb-4">
        {drivers.length === 0 ? (
          <div className="col-12 text-muted small">No drivers on staff yet.</div>
        ) : drivers.map(d => (
          <div key={d.id} className="col-md-6">
            <div className="bg-white rounded-3 border p-3 d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 bg-primary"
                style={{ width: 38, height: 38, fontSize: 14 }}>
                {d.names.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="fw-medium small">{d.names}</div>
                <div className="text-muted" style={{ fontSize: 11 }}>{d.phone || d.email}</div>
              </div>
              <span className={`badge ${d.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                {d.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-card-header p-3 border-bottom">
          <h6 className="mb-0 fw-semibold">Orders Awaiting Pickup ({orders.length})</h6>
        </div>
        {loading ? <LoadingSpinner /> : (
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
                    <td className="ps-4 fw-medium small">{order.reference}</td>
                    <td>
                      <div className="small fw-medium">{order.customer_name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{order.customer_phone}</div>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: 200 }}>{order.delivery_address}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="small text-muted">{formatDate(order.pickup_date)}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: 160 }}
                        value={assigned[order.id] || ''}
                        onChange={e => assignDriver(order.id, e.target.value)}
                      >
                        <option value="">Assign driver…</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.names}</option>
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
        )}
      </div>
    </div>
  );
}
