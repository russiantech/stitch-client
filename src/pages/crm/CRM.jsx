import React, { useState } from 'react';
import { SectionHeader, StatusBadge, EmptyState } from '../../components/shared/index.jsx';
import { MOCK_LAUNDRY_ORDERS, MOCK_FASHION_ORDERS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Chiamaka Eze', email: 'chiamaka@gmail.com', phone: '08012345678', address: '14B Admiralty Way, Lekki', orders: 8, total_spent: 42000, loyalty_points: 420, vip: true, segment: 'VIP', last_order: '2025-05-24', notes: 'Prefers express service. Allergic to strong detergents.' },
  { id: 2, name: 'Emeka Nwosu', email: 'emeka@gmail.com', phone: '08023456789', address: '22 VGC Rd, VGC', orders: 5, total_spent: 31000, loyalty_points: 310, vip: false, segment: 'Regular', last_order: '2025-05-24', notes: '' },
  { id: 3, name: 'Bisi Adeyemi', email: 'bisi@gmail.com', phone: '08034567890', address: '5 Chevron Drive', orders: 12, total_spent: 87500, loyalty_points: 875, vip: true, segment: 'VIP', last_order: '2025-05-23', notes: 'Dry cleaning only customer. Has standing weekly order.' },
  { id: 4, name: 'Tunde Bakare', email: 'tunde@gmail.com', phone: '08045678901', address: '3 Graceland Estate', orders: 3, total_spent: 14500, loyalty_points: 145, vip: false, segment: 'New', last_order: '2025-05-22', notes: '' },
  { id: 5, name: 'Aisha Bello', email: 'aisha@gmail.com', phone: '08067890123', address: 'VI, Lagos', orders: 2, total_spent: 43000, loyalty_points: 430, vip: false, segment: 'Fashion', last_order: '2025-05-20', notes: 'Fashion orders only. Bespoke garments.' },
  { id: 6, name: 'Ngozi Obi', email: 'ngozi@gmail.com', phone: '08056789012', address: '7 Awoyaya, Ajah', orders: 1, total_spent: 1500, loyalty_points: 15, vip: false, segment: 'New', last_order: '2025-05-25', notes: '' },
];

const SEGMENT_COLORS = {
  VIP: 'bg-warning text-dark',
  Regular: 'bg-primary',
  New: 'bg-success',
  Fashion: 'bg-info',
  Inactive: 'bg-secondary',
};

export default function CRM() {
  const toast = useToast();
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState('');

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchSeg = !segmentFilter || c.segment === segmentFilter;
    return matchSearch && matchSeg;
  });

  const openCustomer = (c) => { setSelected(c); setNoteText(c.notes || ''); };

  const saveNote = () => {
    setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, notes: noteText } : c));
    setSelected(prev => ({ ...prev, notes: noteText }));
    toast.success('Note saved');
  };

  const customerOrders = selected
    ? [...MOCK_LAUNDRY_ORDERS.filter(o => o.customer === selected.name),
       ...MOCK_FASHION_ORDERS.filter(o => o.customer === selected.name)]
    : [];

  return (
    <div>
      <SectionHeader
        title="CRM — Customers"
        subtitle="Manage customer profiles, history, notes and loyalty"
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Customers', value: customers.length, icon: 'fa-users', color: 'primary' },
          { label: 'VIP Customers', value: customers.filter(c => c.vip).length, icon: 'fa-star', color: 'warning' },
          { label: 'New This Month', value: customers.filter(c => c.segment === 'New').length, icon: 'fa-user-plus', color: 'success' },
          { label: 'Total Revenue', value: formatNGN(customers.reduce((s, c) => s + c.total_spent, 0)), icon: 'fa-naira-sign', color: 'info' },
        ].map(s => (
          <div key={s.label} className="col-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-3">
                <div className={`stat-icon bg-${s.color} bg-opacity-10`} style={{ width: 40, height: 40 }}>
                  <i className={`fas ${s.icon} text-${s.color}`} />
                </div>
                <div>
                  <div className="stat-label">{s.label}</div>
                  <div className="fw-bold fs-5">{s.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: 240 }}
          placeholder="Search name, email or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 160 }}
          value={segmentFilter}
          onChange={e => setSegmentFilter(e.target.value)}
        >
          <option value="">All Segments</option>
          {['VIP', 'Regular', 'New', 'Fashion', 'Inactive'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {(search || segmentFilter) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setSearch(''); setSegmentFilter(''); }}>Clear</button>
        )}
        <span className="ms-auto text-muted small">{filtered.length} customers</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Customer</th>
                <th className="small fw-medium text-muted">Phone</th>
                <th className="small fw-medium text-muted">Segment</th>
                <th className="small fw-medium text-muted">Orders</th>
                <th className="small fw-medium text-muted">Total Spent</th>
                <th className="small fw-medium text-muted">Points</th>
                <th className="small fw-medium text-muted">Last Order</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="fa-users" title="No customers found" /></td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openCustomer(c)}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0 ${c.vip ? 'bg-warning text-dark' : 'bg-primary bg-opacity-10 text-primary'}`}
                        style={{ width: 34, height: 34, fontSize: 13 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-medium small d-flex align-items-center gap-1">
                          {c.name}
                          {c.vip && <i className="fas fa-star text-warning" style={{ fontSize: 10 }} />}
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="small text-muted">{c.phone}</td>
                  <td>
                    <span className={`badge ${SEGMENT_COLORS[c.segment] || 'bg-secondary'}`} style={{ fontSize: 10 }}>
                      {c.segment}
                    </span>
                  </td>
                  <td className="small fw-medium">{c.orders}</td>
                  <td className="small fw-medium text-primary">{formatNGN(c.total_spent)}</td>
                  <td className="small">{c.loyalty_points.toLocaleString()} pts</td>
                  <td className="small text-muted">{c.last_order}</td>
                  <td className="pe-4" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => openCustomer(c)}>
                      <i className="fas fa-eye" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer (modal) */}
      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-end">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center gap-2">
                  <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${selected.vip ? 'bg-warning text-dark' : 'bg-primary text-white'}`}
                    style={{ width: 38, height: 38, fontSize: 15, flexShrink: 0 }}>
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <h6 className="modal-title fw-semibold mb-0">{selected.name}</h6>
                    <div className="text-muted small">{selected.segment} Customer</div>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                {/* Info Grid */}
                <div className="row g-3 mb-4">
                  {[
                    { label: 'Email', value: selected.email, icon: 'fa-envelope' },
                    { label: 'Phone', value: selected.phone, icon: 'fa-phone' },
                    { label: 'Address', value: selected.address, icon: 'fa-map-marker-alt' },
                    { label: 'Loyalty Points', value: `${selected.loyalty_points.toLocaleString()} pts`, icon: 'fa-star' },
                    { label: 'Total Orders', value: selected.orders, icon: 'fa-box' },
                    { label: 'Total Spent', value: formatNGN(selected.total_spent), icon: 'fa-naira-sign' },
                  ].map(info => (
                    <div key={info.label} className="col-sm-6">
                      <div className="bg-light rounded-2 p-3 d-flex gap-2 align-items-start">
                        <i className={`fas ${info.icon} text-muted mt-1`} style={{ fontSize: 12, width: 14 }} />
                        <div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{info.label}</div>
                          <div className="fw-medium small">{info.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order History */}
                {customerOrders.length > 0 && (
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-3">Order History</h6>
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="small">Order ID</th>
                            <th className="small">Service</th>
                            <th className="small">Status</th>
                            <th className="small text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.map(o => (
                            <tr key={o.id}>
                              <td className="small fw-medium">{o.id}</td>
                              <td className="small text-muted">{o.service || o.item}</td>
                              <td><StatusBadge status={o.status} /></td>
                              <td className="small text-end fw-medium">{formatNGN(o.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <h6 className="fw-semibold mb-2">Customer Notes</h6>
                  <textarea
                    className="form-control form-control-sm mb-2"
                    rows={3}
                    placeholder="Add notes about this customer..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                  />
                  <button className="btn btn-sm btn-primary" onClick={saveNote}>
                    <i className="fas fa-save me-1" />Save Note
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-plus me-1" />Create Order for Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
