import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { LaundryOrder, FashionOrder } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const isLaundry = (o: LaundryOrder | FashionOrder): o is LaundryOrder => 'garment_items' in o;

export default function DriverPortal() {
  const toast = useToast();
  const [tab, setTab] = useState<'pickups' | 'deliveries'>('pickups');
  const [pickupList, setPickupList] = useState<LaundryOrder[]>([]);
  const [deliveryList, setDeliveryList] = useState<LaundryOrder[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pickupsRes, deliveriesRes, completedRes] = await Promise.all([
        orderService.list({ status: 'Received', order_type: 'laundry', page_size: 50 }),
        orderService.list({ status: 'Ready For Delivery', order_type: 'laundry', page_size: 50 }),
        orderService.list({ status: 'Delivered', order_type: 'laundry', page_size: 1 }),
      ]);
      setPickupList(pickupsRes.items.filter(isLaundry));
      setDeliveryList(deliveriesRes.items.filter(isLaundry));
      setCompletedCount(completedRes.pagination.total);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmPickup = async (id: number) => {
    try {
      await orderService.updateStatus(id, 'Sorted', 'Picked up by driver');
      setPickupList(prev => prev.filter(o => o.id !== id));
      toast.success('Pickup confirmed!');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const confirmDelivery = async (id: number) => {
    try {
      await orderService.updateStatus(id, 'Delivered', 'Delivered by driver');
      setDeliveryList(prev => prev.filter(o => o.id !== id));
      setCompletedCount(c => c + 1);
      toast.success('Delivery completed!');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const list = tab === 'pickups' ? pickupList : deliveryList;

  return (
    <div>
      <SectionHeader title="Driver Portal" subtitle="Your assigned pickups and deliveries" />

      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-warning">{pickupList.length}</div>
            <div className="stat-label">Pickups</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-primary">{deliveryList.length}</div>
            <div className="stat-label">Deliveries</div>
          </div>
        </div>
        <div className="col-4">
          <div className="stat-card text-center">
            <div className="stat-value text-success">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'pickups' ? 'active' : ''}`} onClick={() => setTab('pickups')}>
            <i className="fas fa-truck-pickup me-2" />Pickups ({pickupList.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'deliveries' ? 'active' : ''}`} onClick={() => setTab('deliveries')}>
            <i className="fas fa-truck me-2" />Deliveries ({deliveryList.length})
          </button>
        </li>
      </ul>

      {loading ? <LoadingSpinner /> : (
        <div className="d-flex flex-column gap-3">
          {list.map(order => (
            <div key={order.id} className="bg-white rounded-3 border p-4">
              <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                <div>
                  <div className="fw-bold">{order.reference}</div>
                  <StatusBadge status={order.status} />
                </div>
                {order.priority === 'Express' && (
                  <span className="badge bg-danger">Express</span>
                )}
              </div>
              <div className="row g-2 mb-3">
                <div className="col-sm-6">
                  <div className="text-muted small mb-1">Customer</div>
                  <div className="fw-medium small">{order.customer_name || '—'}</div>
                  {order.customer_phone && (
                    <a href={`tel:${order.customer_phone}`} className="text-primary small">
                      <i className="fas fa-phone me-1" />{order.customer_phone}
                    </a>
                  )}
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small mb-1">Address</div>
                  <div className="small">{order.delivery_address || '—'}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small mb-1">Garments</div>
                  <div className="small">{order.garment_count ?? order.garment_items.length} items</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small mb-1">Amount</div>
                  <div className="fw-bold text-primary small">{formatNGN(order.total_amount)}</div>
                </div>
              </div>
              {order.special_instructions && (
                <div className="alert alert-warning py-2 small mb-3">
                  <i className="fas fa-sticky-note me-2" />{order.special_instructions}
                </div>
              )}
              <div className="d-flex gap-2">
                {order.delivery_address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <i className="fas fa-map-marker-alt me-1" />Navigate
                  </a>
                )}
                <button
                  className={`btn btn-sm ${tab === 'pickups' ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => tab === 'pickups' ? confirmPickup(order.id) : confirmDelivery(order.id)}
                >
                  <i className="fas fa-check me-1" />
                  {tab === 'pickups' ? 'Confirm Pickup' : 'Mark Delivered'}
                </button>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className={`fas ${tab === 'pickups' ? 'fa-truck-pickup' : 'fa-truck'} fa-3x d-block mb-3 opacity-25`} />
              <p>No {tab} assigned to you</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
