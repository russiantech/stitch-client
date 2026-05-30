import React, { useState } from 'react';
import { SectionHeader, EmptyState } from '../../components/shared/index.jsx';
import { MOCK_INVENTORY } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

const CATEGORIES = ['Detergent', 'Chemical', 'Packaging', 'Fashion Material', 'Accessory', 'Equipment'];
const EMPTY_ITEM = { name: '', category: '', quantity: '', unit: 'pcs', reorder_level: '', status: 'In Stock' };

export default function Inventory() {
  const toast = useToast();
  const [items, setItems] = useState(MOCK_INVENTORY);
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);

  const getStatus = (qty, reorder) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= reorder) return 'Low Stock';
    return 'In Stock';
  };

  const filtered = items.filter(i => {
    const matchCat = !catFilter || i.category === catFilter;
    const matchStatus = !statusFilter || i.status === statusFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_ITEM); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.quantity || !form.category) return toast.error('Name, category and quantity are required');
    const status = getStatus(Number(form.quantity), Number(form.reorder_level || 0));
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...form, id: editItem.id, status } : i));
      toast.success('Item updated');
    } else {
      setItems(prev => [...prev, { ...form, id: Date.now(), status }]);
      toast.success('Item added');
    }
    setShowModal(false);
  };

  const deleteItem = (id) => {
    if (!window.confirm('Remove this item?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Item removed');
  };

  const adjustQty = (id, delta) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, i.quantity + delta);
      return { ...i, quantity: newQty, status: getStatus(newQty, i.reorder_level) };
    }));
  };

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const lowStockItems = items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');

  return (
    <div>
      <SectionHeader
        title="Inventory"
        subtitle="Track stock levels for laundry supplies and fashion materials"
        actions={
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <i className="fas fa-plus me-1" />Add Item
          </button>
        }
      />

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-label">Total Items</div>
            <div className="stat-value">{items.length}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-label text-success">In Stock</div>
            <div className="stat-value text-success">{items.filter(i => i.status === 'In Stock').length}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-label text-warning">Low Stock</div>
            <div className="stat-value text-warning">{items.filter(i => i.status === 'Low Stock').length}</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-label text-danger">Out of Stock</div>
            <div className="stat-value text-danger">{items.filter(i => i.status === 'Out of Stock').length}</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning d-flex align-items-start gap-3 mb-4">
          <i className="fas fa-exclamation-triangle mt-1" />
          <div>
            <div className="fw-semibold small mb-1">Low Stock Alert — {lowStockItems.length} item(s) need restocking</div>
            <div className="small">{lowStockItems.map(i => i.name).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3 border p-3 mb-4 d-flex flex-wrap gap-2 align-items-center">
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: 200 }}
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-select form-select-sm" style={{ maxWidth: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
        {(catFilter || statusFilter || search) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setCatFilter(''); setStatusFilter(''); setSearch(''); }}>Clear</button>
        )}
        <span className="ms-auto text-muted small">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Item Name</th>
                <th className="small fw-medium text-muted">Category</th>
                <th className="small fw-medium text-muted">Quantity</th>
                <th className="small fw-medium text-muted">Unit</th>
                <th className="small fw-medium text-muted">Reorder Level</th>
                <th className="small fw-medium text-muted">Status</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="fa-boxes-stacked" title="No inventory items" message="Add your first item to track stock levels" /></td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={item.status === 'Out of Stock' ? 'table-danger' : item.status === 'Low Stock' ? 'table-warning' : ''}>
                  <td className="ps-4 fw-medium small">{item.name}</td>
                  <td className="small text-muted">{item.category}</td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <button className="btn btn-xs btn-outline-secondary" style={{ width: 22, height: 22, padding: 0, fontSize: 12, lineHeight: 1 }}
                        onClick={() => adjustQty(item.id, -1)}>−</button>
                      <span className="fw-bold small mx-1" style={{ minWidth: 30, textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn btn-xs btn-outline-secondary" style={{ width: 22, height: 22, padding: 0, fontSize: 12, lineHeight: 1 }}
                        onClick={() => adjustQty(item.id, 1)}>+</button>
                    </div>
                  </td>
                  <td className="small text-muted">{item.unit}</td>
                  <td className="small">{item.reorder_level} {item.unit}</td>
                  <td>
                    <span className={`badge ${item.status === 'In Stock' ? 'bg-success' : item.status === 'Low Stock' ? 'bg-warning text-dark' : 'bg-danger'}`} style={{ fontSize: 10 }}>
                      {item.status}
                    </span>
                  </td>
                  <td className="pe-4">
                    <div className="d-flex gap-1">
                      <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => openEdit(item)}>
                        <i className="fas fa-edit" />
                      </button>
                      <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => deleteItem(item.id)}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">{editItem ? 'Edit Item' : 'Add Inventory Item'}</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-medium">Item Name *</label>
                  <input className="form-control" value={form.name} onChange={f('name')} placeholder="e.g. Ariel Detergent" />
                </div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label small fw-medium">Category *</label>
                    <select className="form-select" value={form.category} onChange={f('category')}>
                      <option value="">Select…</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small fw-medium">Unit</label>
                    <select className="form-select" value={form.unit} onChange={f('unit')}>
                      {['pcs', 'kg', 'L', 'yards', 'spools', 'sets', 'rolls', 'boxes'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row g-3 mt-1">
                  <div className="col-sm-6">
                    <label className="form-label small fw-medium">Quantity *</label>
                    <input type="number" className="form-control" value={form.quantity} onChange={f('quantity')} min="0" />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label small fw-medium">Reorder Level</label>
                    <input type="number" className="form-control" value={form.reorder_level} onChange={f('reorder_level')} min="0" placeholder="Alert when below this" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                  {editItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
