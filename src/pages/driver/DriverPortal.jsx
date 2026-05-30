import React, { useState } from 'react';
import { SectionHeader, StatusBadge } from '../../components/shared/index.jsx';
import { MOCK_LAUNDRY_ORDERS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function DriverPortal() {
  const toast = useToast();
  const [tab, setTab] = useState('pickups');

  const pickups = MOCK_LAUNDRY_ORDERS.filter(o => o.status === 'Received' || o.status === 'Sorted').slice(0, 3);
  const deliveries = MOCK_LAUNDRY_ORDERS.filter(o => o.status === 'Ready For Delivery' || o.status === 'Out For Delivery').slice(0, 3);

  const [pickupList, setPickupList] = useState(pickups);
  const [deliveryList, setDeliveryList] = useState(deliveries);

  const confirmPickup = (id) => {
    setPickupList(prev => prev.filter(o => o.id !== id));
    toast.success('Pickup confirmed!');
  };

  const confirmDelivery = (id) => {
    setDeliveryList(prev => prev.filter(o => o.id !== id));
    toast.success('Delivery completed!');
  };

  return (
    <div>
      <SectionHeader title="Driver Portal" subtitle="Your assigned pickups and deliveries" />

      {/* Stats */}
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
            <div className="stat-value text-success">4</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      <div className="d-flex flex-column gap-3">
        {(tab === 'pickups' ? pickupList : deliveryList).map(order => (
          <div key={order.id} className="bg-white rounded-3 border p-4">
            <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
              <div>
                <div className="fw-bold">{order.id}</div>
                <StatusBadge status={order.status} />
              </div>
              {order.priority === 'Express' && (
                <span className="badge bg-danger">Express</span>
              )}
            </div>
            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <div className="text-muted small mb-1">Customer</div>
                <div className="fw-medium small">{order.customer}</div>
                <a href={`tel:${order.phone}`} className="text-primary small">
                  <i className="fas fa-phone me-1" />{order.phone}
                </a>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small mb-1">Address</div>
                <div className="small">{order.address}</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small mb-1">Service</div>
                <div className="small">{order.service} · {order.items} items</div>
              </div>
              <div className="col-sm-6">
                <div className="text-muted small mb-1">Amount</div>
                <div className="fw-bold text-primary small">{formatNGN(order.amount)}</div>
              </div>
            </div>
            {order.notes && (
              <div className="alert alert-warning py-2 small mb-3">
                <i className="fas fa-sticky-note me-2" />{order.notes}
              </div>
            )}
            <div className="d-flex gap-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(order.address)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-secondary btn-sm"
              >
                <i className="fas fa-map-marker-alt me-1" />Navigate
              </a>
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

        {(tab === 'pickups' ? pickupList : deliveryList).length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className={`fas ${tab === 'pickups' ? 'fa-truck-pickup' : 'fa-truck'} fa-3x d-block mb-3 opacity-25`} />
            <p>No {tab} assigned to you</p>
          </div>
        )}
      </div>
    </div>
  );
}
