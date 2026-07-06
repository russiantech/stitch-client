// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { SectionHeader, StatusBadge, OrderTimeline, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
// import { orderService } from '@/services/api.ts';
// import { LAUNDRY_STATUSES, FASHION_STATUSES, formatNGN, formatDate } from '@/services/mockData.ts';
// import { useToast } from '@/context/ToastContext.tsx';
// import type { LaundryOrder, FashionOrder, AnyOrder } from '@/types/index.ts';

// const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
// const isLaundry = (o: AnyOrder): o is LaundryOrder => 'garment_items' in o;

// function MiniProgress({ statuses, currentStatus }: { statuses: readonly string[]; currentStatus: string }) {
//   const currentIdx = statuses.indexOf(currentStatus);
//   const pct = Math.round((Math.max(currentIdx, 0) / (statuses.length - 1)) * 100);
//   return (
//     <div>
//       <div className="d-flex justify-content-between mb-1">
//         <span className="text-muted" style={{ fontSize: 11 }}>{currentStatus}</span>
//         <span className="text-muted" style={{ fontSize: 11 }}>{pct}%</span>
//       </div>
//       <div className="progress" style={{ height: 5, borderRadius: 4 }}>
//         <div className="progress-bar bg-primary" style={{ width: `${pct}%`, borderRadius: 4, transition: 'width 0.4s' }} />
//       </div>
//     </div>
//   );
// }

// function DetailContent({ order, statuses }: { order: AnyOrder; statuses: readonly string[] }) {
//   const laundry = isLaundry(order);
//   return (
//     <>
//       <div className="mb-3">
//         <div className="text-muted small mb-1">{laundry ? 'Garments' : 'Item'}</div>
//         <div className="fw-medium">{laundry ? `${order.garment_count ?? order.garment_items.length} items` : order.item_name}</div>
//       </div>
//       {laundry && order.delivery_address && (
//         <div className="mb-3">
//           <div className="text-muted small mb-1">Delivery Address</div>
//           <div className="small">{order.delivery_address}</div>
//         </div>
//       )}
//       {!laundry && order.delivery_address && (
//         <div className="mb-3">
//           <div className="text-muted small mb-1">Consultation Address</div>
//           <div className="small">{order.delivery_address}</div>
//         </div>
//       )}
//       {laundry && order.pickup_date && (
//         <div className="mb-3">
//           <div className="text-muted small mb-1">Pickup Date</div>
//           <div className="fw-medium">{formatDate(order.pickup_date)}{order.pickup_time && ` · ${order.pickup_time}`}</div>
//         </div>
//       )}
//       {!laundry && order.fitting_date && (
//         <div className="mb-3">
//           <div className="text-muted small mb-1">Fitting Date</div>
//           <div className="fw-medium">{formatDate(order.fitting_date)}</div>
//         </div>
//       )}
//       <div className="mb-3">
//         <div className="text-muted small mb-1">Payment</div>
//         <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary' : 'bg-success'}`}>
//           {order.payment_method === 'subscription' ? 'Subscription' : 'Direct / Paystack'}
//         </span>
//       </div>
//       <div className="mb-4">
//         <div className="text-muted small mb-1">Amount</div>
//         <div className="fw-bold text-primary fs-5">{formatNGN(order.total_amount)}</div>
//       </div>
//       {laundry && order.special_instructions && (
//         <div className="alert alert-light border py-2 mb-4 small">{order.special_instructions}</div>
//       )}
//       {!laundry && order.design_notes && (
//         <div className="alert alert-light border py-2 mb-4 small">{order.design_notes}</div>
//       )}
//       <h6 className="fw-semibold mb-3">Order Timeline</h6>
//       <OrderTimeline statuses={statuses as string[]} currentStatus={order.status} />
//     </>
//   );
// }

// export default function MyOrders() {
//   const toast = useToast();
//   const [tab, setTab] = useState<'laundry' | 'fashion'>('laundry');
//   const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>([]);
//   const [fashionOrders, setFashionOrders] = useState<FashionOrder[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selected, setSelected] = useState<AnyOrder | null>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < 992);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [l, f] = await Promise.all([
//         orderService.list({ order_type: 'laundry', page_size: 100 }),
//         orderService.list({ order_type: 'fashion', page_size: 100 }),
//       ]);
//       setLaundryOrders(l.items.filter(isLaundry));
//       setFashionOrders(f.items.filter((o): o is FashionOrder => !isLaundry(o)));
//     } catch (err) {
//       toast.error(errMsg(err));
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   const orders: AnyOrder[] = tab === 'laundry' ? laundryOrders : fashionOrders;
//   const statuses = tab === 'laundry' ? LAUNDRY_STATUSES : FASHION_STATUSES;

//   const openOrder = (order: AnyOrder) => { setSelected(order); setDrawerOpen(true); };
//   const closeDrawer = () => { setDrawerOpen(false); setTimeout(() => setSelected(null), 300); };

//   return (
//     <div style={{ position: 'relative' }}>
//       <SectionHeader
//         title="My Orders"
//         subtitle="Track and manage your laundry and fashion orders"
//         actions={<Link to="/orders/new" className="btn btn-primary btn-sm"><i className="fas fa-plus me-1" />New Order</Link>}
//       />

//       <ul className="nav nav-tabs mb-4">
//         <li className="nav-item">
//           <button className={`nav-link ${tab === 'laundry' ? 'active' : ''}`}
//             onClick={() => { setTab('laundry'); closeDrawer(); }}>
//             <i className="fas fa-soap me-2" />Laundry ({laundryOrders.length})
//           </button>
//         </li>
//         <li className="nav-item">
//           <button className={`nav-link ${tab === 'fashion' ? 'active' : ''}`}
//             onClick={() => { setTab('fashion'); closeDrawer(); }}>
//             <i className="fas fa-shirt me-2" />Fashion ({fashionOrders.length})
//           </button>
//         </li>
//       </ul>

//       <div className="row g-4" style={{ position: 'relative' }}>
//         <div className={selected && !isMobile ? 'col-lg-7' : 'col-12'}>
//           {loading ? <LoadingSpinner /> : orders.length === 0 ? (
//             <EmptyState icon="fa-box-open" title="No orders yet" message="Create your first order to get started" />
//           ) : (
//             <div className="d-flex flex-column gap-3">
//               {orders.map(order => {
//                 const laundry = isLaundry(order);
//                 return (
//                   <div
//                     key={order.id}
//                     className={`bg-white rounded-3 border p-4 ${selected?.id === order.id ? 'border-primary border-2' : ''}`}
//                     style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
//                     onClick={() => openOrder(order)}
//                   >
//                     <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
//                       <div>
//                         <div className="fw-bold">{order.reference}</div>
//                         <div className="text-muted small">
//                           {laundry ? `${order.garment_count ?? order.garment_items.length} items` : order.item_name} · {formatDate(order.created_at)}
//                         </div>
//                       </div>
//                       <div className="d-flex flex-column align-items-end gap-1">
//                         <StatusBadge status={order.status} />
//                         {order.priority === 'Express' && (
//                           <span className="badge bg-danger" style={{ fontSize: 9 }}>Express</span>
//                         )}
//                       </div>
//                     </div>
//                     <MiniProgress statuses={statuses} currentStatus={order.status} />
//                     <div className="d-flex justify-content-between align-items-center mt-3">
//                       <div className="text-muted small">
//                         <i className="fas fa-calendar me-1" />
//                         {laundry ? `Pickup: ${formatDate(order.pickup_date)}` : `Fitting: ${formatDate(order.fitting_date)}`}
//                       </div>
//                       <div className="d-flex align-items-center gap-2">
//                         <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`} style={{ fontSize: 10 }}>
//                           {order.payment_method === 'subscription' ? 'Subscription' : 'Direct'}
//                         </span>
//                         <div className="fw-bold text-primary">{formatNGN(order.total_amount)}</div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {selected && !isMobile && drawerOpen && (
//           <div className="col-lg-5">
//             <div className="bg-white rounded-3 border p-4" style={{ position: 'sticky', top: 76 }}>
//               <div className="d-flex justify-content-between align-items-start mb-4">
//                 <div>
//                   <h6 className="fw-bold mb-1">{selected.reference}</h6>
//                   <StatusBadge status={selected.status} />
//                 </div>
//                 <button className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
//                   <i className="fas fa-times" />
//                 </button>
//               </div>
//               <DetailContent order={selected} statuses={statuses} />
//             </div>
//           </div>
//         )}
//       </div>

//       {isMobile && (
//         <>
//           {drawerOpen && (
//             <div
//               style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
//               onClick={closeDrawer}
//             />
//           )}
//           <div
//             style={{
//               position: 'fixed', top: 0, right: 0, bottom: 0,
//               width: 'min(360px, 92vw)', background: '#fff', zIndex: 1041,
//               boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
//               display: 'flex', flexDirection: 'column',
//               transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
//               transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
//             }}
//           >
//             {selected && (
//               <>
//                 <div className="d-flex align-items-center justify-content-between p-4 border-bottom flex-shrink-0">
//                   <div>
//                     <h6 className="fw-bold mb-1">{selected.reference}</h6>
//                     <StatusBadge status={selected.status} />
//                   </div>
//                   <button className="btn btn-sm btn-outline-secondary" onClick={closeDrawer}>
//                     <i className="fas fa-times" />
//                   </button>
//                 </div>
//                 <div className="flex-1 overflow-y-auto p-4">
//                   <DetailContent order={selected} statuses={statuses} />
//                 </div>
//               </>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }






// v2
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, StatusBadge, OrderTimeline, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
import { orderService } from '@/services/api.ts';
import { LAUNDRY_STATUSES, FASHION_STATUSES, formatNGN, formatDate } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { LaundryOrder, FashionOrder, AnyOrder } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');
const isLaundry = (o: AnyOrder): o is LaundryOrder => 'garment_items' in o;

function MiniProgress({ statuses, currentStatus }: { statuses: readonly string[]; currentStatus: string }) {
  const currentIdx = statuses.indexOf(currentStatus);
  const pct = Math.round((Math.max(currentIdx, 0) / (statuses.length - 1)) * 100);
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

function DetailContent({ order, statuses }: { order: AnyOrder; statuses: readonly string[] }) {
  const laundry = isLaundry(order);
  return (
    <>
      <div className="mb-3">
        <div className="text-muted small mb-1">{laundry ? 'Garments' : 'Item'}</div>
        <div className="fw-medium">{laundry ? `${order.garment_count ?? order.garment_items.length} items` : order.item_name}</div>
      </div>
      {laundry && order.delivery_address && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Delivery Address</div>
          <div className="small">{order.delivery_address}</div>
        </div>
      )}
      {!laundry && order.delivery_address && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Consultation Address</div>
          <div className="small">{order.delivery_address}</div>
        </div>
      )}
      {laundry && order.pickup_date && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Pickup Date</div>
          <div className="fw-medium">{formatDate(order.pickup_date)}{order.pickup_time && ` · ${order.pickup_time}`}</div>
        </div>
      )}
      {!laundry && order.fitting_date && (
        <div className="mb-3">
          <div className="text-muted small mb-1">Fitting Date</div>
          <div className="fw-medium">{formatDate(order.fitting_date)}</div>
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
        <div className="fw-bold text-primary fs-5">{formatNGN(order.total_amount)}</div>
      </div>
      {laundry && order.special_instructions && (
        <div className="alert alert-light border py-2 mb-4 small">{order.special_instructions}</div>
      )}
      {!laundry && order.design_notes && (
        <div className="alert alert-light border py-2 mb-4 small">{order.design_notes}</div>
      )}
      <h6 className="fw-semibold mb-3">Order Timeline</h6>
      <OrderTimeline statuses={statuses as string[]} currentStatus={order.status} />
    </>
  );
}

export default function MyOrders() {
  const toast = useToast();
  const [tab, setTab] = useState<'laundry' | 'fashion'>('laundry');
  const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>([]);
  const [fashionOrders, setFashionOrders] = useState<FashionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnyOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  const drawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, f] = await Promise.all([
        orderService.list({ order_type: 'laundry', page_size: 100 }),
        orderService.list({ order_type: 'fashion', page_size: 100 }),
      ]);
      setLaundryOrders(l.items.filter(isLaundry));
      setFashionOrders(f.items.filter((o): o is FashionOrder => !isLaundry(o)));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const orders: AnyOrder[] = tab === 'laundry' ? laundryOrders : fashionOrders;
  const statuses = tab === 'laundry' ? LAUNDRY_STATUSES : FASHION_STATUSES;

  const clearDrawerTimeout = () => {
    if (drawerTimeoutRef.current) {
      clearTimeout(drawerTimeoutRef.current);
      drawerTimeoutRef.current = null;
    }
  };

  const openOrder = (order: AnyOrder) => {
    clearDrawerTimeout();
    setSelected(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    clearDrawerTimeout();
    drawerTimeoutRef.current = setTimeout(() => setSelected(null), 300);
  };

  const switchTab = (newTab: 'laundry' | 'fashion') => {
    setTab(newTab);
    // Immediately clear selection so the layout resets and no stale order lingers
    clearDrawerTimeout();
    setDrawerOpen(false);
    setSelected(null);
  };

  // const openOrder = (order: AnyOrder) => {
  //   clearDrawerTimeout();
  //   setSelected(order);
  //   setDrawerOpen(true);
  // };

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
            onClick={() => switchTab('laundry')}>
            <i className="fas fa-soap me-2" />Laundry ({laundryOrders.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'fashion' ? 'active' : ''}`}
            onClick={() => switchTab('fashion')}>
            <i className="fas fa-shirt me-2" />Fashion ({fashionOrders.length})
          </button>
        </li>
      </ul>

      <div className="row g-4" style={{ position: 'relative' }}>
        <div className={selected && !isMobile ? 'col-lg-7' : 'col-12'}>
          {loading ? <LoadingSpinner /> : orders.length === 0 ? (
            <EmptyState icon="fa-box-open" title="No orders yet" message="Create your first order to get started" />
          ) : (
            <div className="d-flex flex-column gap-3">
              {orders.map(order => {
                const laundry = isLaundry(order);
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3 border p-4 ${selected?.id === order.id ? 'border-primary border-2' : ''}`}
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => openOrder(order)}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <div>
                        <div className="fw-bold">{order.reference}</div>
                        <div className="text-muted small">
                          {laundry ? `${order.garment_count ?? order.garment_items.length} items` : order.item_name} · {formatDate(order.created_at)}
                        </div>
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
                        <i className="fas fa-calendar me-1" />
                        {laundry ? `Pickup: ${formatDate(order.pickup_date)}` : `Fitting: ${formatDate(order.fitting_date)}`}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${order.payment_method === 'subscription' ? 'bg-primary bg-opacity-25 text-primary' : 'bg-success bg-opacity-25 text-success'}`} style={{ fontSize: 10 }}>
                          {order.payment_method === 'subscription' ? 'Subscription' : 'Direct'}
                        </span>
                        <div className="fw-bold text-primary">{formatNGN(order.total_amount)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected && !isMobile && drawerOpen && (
          <div className="col-lg-5">
            <div className="bg-white rounded-3 border p-4" style={{ position: 'sticky', top: 76 }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h6 className="fw-bold mb-1">{selected.reference}</h6>
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

      {isMobile && (
        <>
          {drawerOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
              onClick={closeDrawer}
            />
          )}
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(360px, 92vw)', background: '#fff', zIndex: 1041,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {selected && (
              <>
                <div className="d-flex align-items-center justify-content-between p-4 border-bottom flex-shrink-0">
                  <div>
                    <h6 className="fw-bold mb-1">{selected.reference}</h6>
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

