import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader, StatusBadge, EmptyState, LoadingSpinner } from '@/components/shared/index.tsx';
import { userService, orderService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import type { User, LaundryOrder, FashionOrder } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

function segmentFor(orderCount: number): { label: string; cls: string } {
  if (orderCount >= 8) return { label: 'VIP', cls: 'bg-warning text-dark' };
  if (orderCount >= 3) return { label: 'Regular', cls: 'bg-primary' };
  if (orderCount === 0) return { label: 'Inactive', cls: 'bg-secondary' };
  return { label: 'New', cls: 'bg-success' };
}

export default function CRM() {
  const toast = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [noteText, setNoteText] = useState('');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [customerOrders, setCustomerOrders] = useState<(LaundryOrder | FashionOrder)[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.list({ page_size: 100, search: search || undefined });
      setCustomers(data.items.filter(u => u.roles.includes('customer')));
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  /* const filtered = customers.filter(c => {
    const matchStatus = !statusFilter || (statusFilter === 'Active' ? c.is_active : !c.is_active);
    return matchStatus;
  }); */

  // filter logic
  const filtered = customers.filter(c => {
    const matchStatus = !statusFilter || (statusFilter === 'Active' ? c.status === 'active' : c.status !== 'active');
    return matchStatus;
  });

  const openCustomer = async (c: User) => {
    setSelected(c);
    setNoteText(notesMap[c.id] || '');
    setOrdersLoading(true);
    try {
      const term = c.phone || c.names;
      const data = await orderService.list({ search: term, page_size: 50 });
      setCustomerOrders(data.items);
    } catch (err) {
      toast.error(errMsg(err));
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const saveNote = () => {
    if (!selected) return;
    setNotesMap(prev => ({ ...prev, [selected.id]: noteText }));
    toast.success('Note saved on this device');
  };

  const totalSpent = customerOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const seg = segmentFor(customerOrders.length);

  return (
    <div>
      <SectionHeader
        title="CRM — Customers"
        subtitle="Customer profiles, order history and personal notes"
      />

      <div className="row g-3 mb-4" data-tour="tour-crm-stats">
        {[
          { label: 'Total Customers', value: customers.length, icon: 'fa-users', color: 'primary' },
          // { label: 'Active', value: customers.filter(c => c.is_active).length, icon: 'fa-user-check', color: 'success' },
          // { label: 'Inactive', value: customers.filter(c => !c.is_active).length, icon: 'fa-user-slash', color: 'secondary' },

          // stat cards
          { label: 'Active', value: customers.filter(c => c.status === 'active').length, icon: 'fa-user-check', color: 'success' },
          { label: 'Inactive', value: customers.filter(c => c.status !== 'active').length, icon: 'fa-user-slash', color: 'secondary' },

          { label: 'New (30d)', value: customers.filter(c => Date.now() - new Date(c.created_at).getTime() < 30 * 86400000).length, icon: 'fa-user-plus', color: 'info' },
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

      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: 240 }}
          placeholder="Search name, email or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {(search || statusFilter) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear</button>
        )}
        <span className="ms-auto text-muted small">{filtered.length} customers</span>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden" data-tour="tour-crm-table">
        {loading ? <LoadingSpinner /> : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4 small fw-medium text-muted">Customer</th>
                  <th className="small fw-medium text-muted">Phone</th>
                  <th className="small fw-medium text-muted">Status</th>
                  <th className="small fw-medium text-muted">Joined</th>
                  <th className="small fw-medium text-muted pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon="fa-users" title="No customers found" /></td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openCustomer(c)}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary fw-bold flex-shrink-0"
                          style={{ width: 34, height: 34, fontSize: 13 }}>
                          {c.names.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-medium small">{c.names}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="small text-muted">{c.phone || '—'}</td>
                    <td>
                  <span className={`badge ${c.status === 'active' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                    </td>
                    <td className="small text-muted">{new Date(c.created_at).toLocaleDateString('en-NG')}</td>
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
        )}
      </div>

      {selected && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-end">
            <div className="modal-content">
              <div className="modal-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold bg-primary text-white"
                    style={{ width: 38, height: 38, fontSize: 15, flexShrink: 0 }}>
                    {selected.names.charAt(0)}
                  </div>
                  <div>
                    <h6 className="modal-title fw-semibold mb-0">{selected.names}</h6>
                    {!ordersLoading && <span className={`badge ${seg.cls}`} style={{ fontSize: 10 }}>{seg.label} Customer</span>}
                  </div>
                </div>
                <button className="btn-close" onClick={() => setSelected(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  {[
                    { label: 'Email', value: selected.email, icon: 'fa-envelope' },
                    { label: 'Phone', value: selected.phone || '—', icon: 'fa-phone' },
                    { label: 'Total Orders', value: ordersLoading ? '…' : customerOrders.length, icon: 'fa-box' },
                    { label: 'Total Spent', value: ordersLoading ? '…' : formatNGN(totalSpent), icon: 'fa-naira-sign' },
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

                <div className="mb-4">
                  <h6 className="fw-semibold mb-3">Order History</h6>
                  {ordersLoading ? <LoadingSpinner /> : customerOrders.length === 0 ? (
                    <p className="text-muted small">No orders yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="small">Reference</th>
                            <th className="small">Status</th>
                            <th className="small text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrders.map(o => (
                            <tr key={o.id}>
                              <td className="small fw-medium">{o.reference}</td>
                              <td><StatusBadge status={o.status} /></td>
                              <td className="small text-end fw-medium">{formatNGN(o.total_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h6 className="fw-semibold mb-2">Customer Notes</h6>
                  <div className="alert alert-secondary small py-2 mb-2">
                    <i className="fas fa-info-circle me-2" />Saved on this device only.
                  </div>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
