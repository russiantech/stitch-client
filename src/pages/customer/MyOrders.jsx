import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, StatusBadge, OrderTimeline, EmptyState } from '../../components/shared/index.jsx';
import { orderService } from '../../services/api.js';
import { MOCK_LAUNDRY_ORDERS, MOCK_FASHION_ORDERS, LAUNDRY_STATUSES, FASHION_STATUSES, formatNGN } from '../../services/mockData.js';

function MiniProgress({ statuses, currentStatus }) {
  const currentIdx = statuses.indexOf(currentStatus);
  const pct = Math.round(((currentIdx) / (statuses.length - 1)) * 100);
  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <span className="text-muted" style={{ fontSize: 11 }}>{currentStatus}</span>
        <span className="text-muted" style={{ fontSize: 11 }}>{pct}%</span>
      </div>
      <div className="progress" style={{ height: 5, borderRadius: 4 }}>
        <div className="progress-bar bg-primary" style={{ width: `${pct}%`, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [tab, setTab] = useState('laundry');
  const [laundryOrders, setLaundryOrders] = useState(MOCK_LAUNDRY_ORDERS);
  const [fashionOrders, setFashionOrders] = useState(MOCK_FASHION_ORDERS);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const drawerRef = useRef();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const orders = tab === 'laundry' ? laundryOrders : fashionOrders;
  const statuses = tab === 'laundry' ? LAUNDRY_STATUSES : FASHION_STATUSES;

  const openOrder = (order) => {
    setSelected(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 300);
  };

  return (
    <div style={{ position: 'relative' }}>
      <SectionHeader
        title="My Orders"
        subtitle="Track and manage your laundry and fashion orders"
        actions={<Link to="/orders/new" className="btn btn-primary btn-sm"><i className="fas fa-plus me-1" />New Order</Link>}
      />

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'laundry' ? 'active' : ''}`}
            onClick={() => { setTab('laundry'); closeDrawer(); }}>
            <i className="fas fa-soap me-2" />Laundry ({laundryOrders.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'fashion' ? 'active' : ''}`}
            onClick={() => { setTab('fashion'); closeDrawer(); }}>
            <i className="fas fa-shirt me-2" />Fashion ({fashionOrders.length})
          </button>
        </li>
      </ul>

      {/* Desktop: side-by-side. Mobile: list + slide-in drawer */}
      <div className="row g-4" style={{ position: 'relative' }}>
        {/* Orders list */}
        <div className={selected && !isMobile ? 'col-lg-7' : 'col-12'}>
          {orders.length === 0 ? (
            <EmptyState icon="fa-box-open" title="No orders yet" message="Create your first order to get started" />
          ) : (
            <div className="d-flex flex-column gap-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className={`bg-white rounded-3 border p-4 ${selected?.id === order.id ? 'border-primary border-2' : ''}`}
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => openOrder(order)}
                >
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                    <div>
                      <div className="fw-bold">{order.id}</div>
                      <div className="text-muted small">{order.service || order.item} · {order.created_at}</div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <StatusBadge status={order.status} />
                      {order.priority === 'Express' && (
                        <span className="badge bg-danger" style={{ fontSize: 9 }}>Express</span>
                      )}
                    </div>
                  </div>
                  <MiniProgress statuses={statuses} currentStatus={order.status} />
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted small">
                      <i className="fas fa-calendar me-1" />Due: {order.delivery}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`} style={{ fontSize: 10 }}>
                        {order.payment_method === 'subscription' ? 'Subscription' : 'Direct'}
                      </span>
                      <div className="fw-bold text-primary">{formatNGN(order.amount)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop detail panel */}
        {selected && !isMobile && drawerOpen && (
          <div className="col-lg-5">
            <div className="bg-white rounded-3 border p-4" style={{ position: 'sticky', top: 76 }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h6 className="fw-bold mb-1">{selected.id}</h6>
                  <StatusBadge status={selected.status} />
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
                  <i className="fas fa-times" />
                </button>
              </div>
              <DetailContent order={selected} statuses={statuses} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: slide-in drawer from right */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
              onClick={closeDrawer}
            />
          )}
          {/* Drawer */}
          <div
            ref={drawerRef}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(360px, 92vw)',
              background: '#fff',
              zIndex: 1041,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {selected && (
              <>
                <div className="d-flex align-items-center justify-content-between p-4 border-bottom flex-shrink-0">
                  <div>
                    <h6 className="fw-bold mb-1">{selected.id}</h6>
                    <StatusBadge status={selected.status} />
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <DetailContent order={selected} statuses={statuses} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailContent({ order, statuses }) {
  if (!order) return null;
  return (
    <>
      <div className="mb-3">
        <div className="text-muted small mb-1">Service</div>
        <div className="fw-medium">{order.service || order.item}</div>
      </div>
      {order.address && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Pickup Address</div>
          <div className="small">{order.address}</div>
        </div>
      )}
      {order.delivery && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Expected Delivery</div>
          <div className="fw-medium">{order.delivery}</div>
        </div>
      )}
      <div className="mb-3">
        <div className="text-muted small mb-1">Payment</div>
        <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary' : 'bg-success'}`}>
          {order.payment_method === 'subscription' ? 'Subscription' : 'Direct / Paystack'}
        </span>
      </div>
      <div className="mb-4">
        <div className="text-muted small mb-1">Amount</div>
        <div className="fw-bold text-primary fs-5">{formatNGN(order.amount)}</div>
      </div>
      {order.notes && (
        <div className="alert alert-light border py-2 mb-4 small">{order.notes}</div>
      )}
      <h6 className="fw-semibold mb-3">Order Timeline</h6>
      <OrderTimeline statuses={statuses} currentStatus={order.status} />
    </>
  );
}
