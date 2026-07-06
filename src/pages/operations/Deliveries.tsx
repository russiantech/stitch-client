import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService, userService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { LaundryOrder, User } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

export default function Deliveries() {
  const toast = useToast();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [assigned, setAssigned] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [deliveredToday, setDeliveredToday] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [readyRes, outRes, deliveredRes] = await Promise.all([
        orderService.list({ order_type: 'laundry', status: 'Ready For Delivery', page_size: 100 }),
        orderService.list({ order_type: 'laundry', status: 'Out For Delivery', page_size: 100 }),
        orderService.list({ order_type: 'laundry', status: 'Delivered', page_size: 1 }),
      ]);
      setOrders([...readyRes.items, ...outRes.items].filter((o): o is LaundryOrder => 'garment_items' in o));
      setDeliveredToday(deliveredRes.pagination.total);
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

  const markDelivered = async (orderId: number) => {
    try {
      const updated = await orderService.updateStatus(orderId, 'Delivered');
      setOrders(prev => prev.map(o => o.id === orderId ? (updated as LaundryOrder) : o));
      setDeliveredToday(c => c + 1);
      toast.success(`Order #${orderId} marked as delivered`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const markOutForDelivery = async (orderId: number) => {
    try {
      const updated = await orderService.updateStatus(orderId, 'Out For Delivery');
      setOrders(prev => prev.map(o => o.id === orderId ? (updated as LaundryOrder) : o));
      toast.success(`Order #${orderId} is out for delivery`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Deliveries"
        subtitle="Orders ready for dispatch and active deliveries"
      />

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
            <div className="stat-label">Delivered (Total)</div>
            <div className="stat-value text-success">{deliveredToday}</div>
          </div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="stat-card">
            <div className="stat-label">Active Drivers</div>
            <div className="stat-value">{drivers.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom">
          <h6 className="fw-semibold mb-0">Delivery Queue</h6>
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
                  <th className="small fw-medium text-muted">Pickup</th>
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
                    <td className="ps-4 fw-medium small">{order.reference}</td>
                    <td>
                      <div className="small fw-medium">{order.customer_name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{order.customer_phone}</div>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: 180 }}>{order.delivery_address}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="small text-muted">{order.pickup_date || '—'}</td>
                    <td className="text-end fw-medium small">{formatNGN(order.total_amount)}</td>
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
        )}
      </div>
    </div>
  );
}
