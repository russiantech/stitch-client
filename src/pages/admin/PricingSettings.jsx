import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { pricingService } from '../../services/api.js';
import { MOCK_GARMENT_PRICING, MOCK_LAUNDRY_SERVICES, MOCK_DELIVERY_AREAS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const GARMENT_CATEGORIES = ['Tops', 'Bottoms', 'Full outfits', 'Outerwear', 'Innerwear', 'Household', 'Native Wear', 'Other'];

// ─── Editable table row ────────────────────────────────────────────────────────
function EditableRow({ item, fields, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...item });

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  const f = k => e => setForm(p => ({
    ...p,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  if (!editing) {
    return (
      <tr>
        {fields.map(field => (
          <td key={field.key} className="small py-2 px-3">
            {field.type === 'currency' ? formatNGN(item[field.key])
              : field.type === 'boolean'
                ? <span className={`badge ${item[field.key] ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                    {item[field.key] ? 'Active' : 'Inactive'}
                  </span>
                : String(item[field.key] ?? '—')}
          </td>
        ))}
        <td className="py-2 px-3">
          <div className="d-flex gap-1">
            <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditing(true)}>
              <i className="fas fa-edit" />
            </button>
            <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onDelete(item.id)}>
              <i className="fas fa-trash" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="table-warning">
      {fields.map(field => (
        <td key={field.key} className="py-1 px-2">
          {field.type === 'select'
            ? <select className="form-select form-select-sm" value={form[field.key]} onChange={f(field.key)}>
                {field.options.map(o => <option key={o}>{o}</option>)}
              </select>
            : field.type === 'boolean'
              ? <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={form[field.key]} onChange={f(field.key)} />
                </div>
              : <input
                  type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
                  className="form-control form-control-sm"
                  value={form[field.key]}
                  onChange={f(field.key)}
                  min={0}
                  step={field.type === 'currency' ? 50 : 1}
                />
          }
        </td>
      ))}
      <td className="py-1 px-2">
        <div className="d-flex gap-1">
          <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleSave}>
            <i className="fas fa-check" />
          </button>
          <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditing(false)}>
            <i className="fas fa-times" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Add Row Form ──────────────────────────────────────────────────────────────
function AddRowForm({ fields, onAdd, onCancel }) {
  const init = Object.fromEntries(fields.map(f => [f.key, f.default ?? '']));
  const [form, setForm] = useState(init);
  const ff = k => e => setForm(p => ({
    ...p,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));
  return (
    <tr className="table-success">
      {fields.map(field => (
        <td key={field.key} className="py-1 px-2">
          {field.type === 'select'
            ? <select className="form-select form-select-sm" value={form[field.key]} onChange={ff(field.key)}>
                <option value="">Select…</option>
                {field.options.map(o => <option key={o}>{o}</option>)}
              </select>
            : field.type === 'boolean'
              ? <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={form[field.key]} onChange={ff(field.key)} />
                </div>
              : <input
                  type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
                  className="form-control form-control-sm"
                  value={form[field.key]}
                  onChange={ff(field.key)}
                  placeholder={field.placeholder || field.key}
                  min={0}
                />
          }
        </td>
      ))}
      <td className="py-1 px-2">
        <div className="d-flex gap-1">
          <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onAdd({ ...form, id: Date.now(), active: form.active !== false })}>
            <i className="fas fa-plus" />
          </button>
          <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={onCancel}>
            <i className="fas fa-times" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Pricing Table Section ─────────────────────────────────────────────────────
function PricingTable({ title, items, setItems, fields, createFn, updateFn, deleteFn }) {
  const toast = useToast();
  const { loadPricing } = useAppData();
  const [showAdd, setShowAdd] = useState(false);

  const handleSave = async (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    try {
      await updateFn(updated.id, updated);
      toast.success('Updated successfully');
    } catch { toast.success('Updated (demo)'); }
    loadPricing();
  };

  const handleAdd = async (newItem) => {
    setItems(prev => [...prev, newItem]);
    try {
      await createFn(newItem);
      toast.success('Added successfully');
    } catch { toast.success('Added (demo)'); }
    setShowAdd(false);
    loadPricing();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try { await deleteFn(id); } catch {}
    toast.success('Deleted');
    loadPricing();
  };

  return (
    <div className="bg-white rounded-3 border overflow-hidden mb-4">
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <h6 className="fw-semibold mb-0">{title}</h6>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'} me-1`} />
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>
      <div className="table-responsive">
        <table className="table mb-0">
          <thead>
            <tr>
              {fields.map(f => (
                <th key={f.key} className="ps-3 py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>
                  {f.label}
                </th>
              ))}
              <th className="py-2 small fw-medium text-muted" style={{ fontSize: 11 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <AddRowForm fields={fields} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
            )}
            {items.map(item => (
              <EditableRow
                key={item.id}
                item={item}
                fields={fields}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Pricing Settings Page ────────────────────────────────────────────────
export default function PricingSettings() {
  const [garments, setGarments] = useState(MOCK_GARMENT_PRICING);
  const [services, setServices] = useState(MOCK_LAUNDRY_SERVICES);
  const [areas, setAreas] = useState(MOCK_DELIVERY_AREAS);
  const [tab, setTab] = useState('garments');

  useEffect(() => {
    Promise.allSettled([
      pricingService.garments().then(d => d?.garments && setGarments(d.garments)),
      pricingService.services().then(d => d?.services && setServices(d.services)),
      pricingService.areas().then(d => d?.areas && setAreas(d.areas)),
    ]).catch(() => {});
  }, []);

  const garmentFields = [
    { key: 'name', label: 'Garment Name', type: 'text', placeholder: 'e.g. Shirts' },
    { key: 'category', label: 'Category', type: 'select', options: GARMENT_CATEGORIES, default: 'Tops' },
    { key: 'base_price', label: 'Base Price (₦)', type: 'currency' },
    { key: 'unit', label: 'Unit', type: 'text', default: 'per piece' },
    { key: 'active', label: 'Active', type: 'boolean', default: true },
  ];

  const serviceFields = [
    { key: 'name', label: 'Service Name', type: 'text', placeholder: 'e.g. Express Wash' },
    { key: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
    { key: 'price_multiplier', label: 'Price Multiplier', type: 'number' },
    { key: 'active', label: 'Active', type: 'boolean', default: true },
  ];

  const areaFields = [
    { key: 'name', label: 'Area Name', type: 'text', placeholder: 'e.g. Ajah' },
    { key: 'price', label: 'Delivery Price (₦)', type: 'currency' },
    { key: 'active', label: 'Active', type: 'boolean', default: true },
  ];

  return (
    <div>
      <SectionHeader
        title="Pricing Settings"
        subtitle="Manage garment pricing, service types and delivery area rates"
      />

      <div className="alert alert-info small mb-4">
        <i className="fas fa-info-circle me-2" />
        Changes here update pricing visible to customers when they create orders. Click the edit icon on any row to modify, then tick to save.
      </div>

      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'garments', label: 'Garment Pricing', icon: 'fa-shirt' },
          { key: 'services', label: 'Laundry Services', icon: 'fa-soap' },
          { key: 'areas', label: 'Delivery Areas', icon: 'fa-map-marker-alt' },
        ].map(t => (
          <li key={t.key} className="nav-item">
            <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fas ${t.icon} me-2`} />{t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'garments' && (
        <>
          <p className="text-muted small mb-3">
            Set base prices per garment type. Customers select garments and quantities when creating orders.
            For tougher/dirtier items, the staff can apply a custom price multiplier at order time.
          </p>
          <PricingTable
            title={`Garment Prices (${garments.length} items)`}
            items={garments}
            setItems={setGarments}
            fields={garmentFields}
            createFn={pricingService.createGarment}
            updateFn={pricingService.updateGarment}
            deleteFn={pricingService.deleteGarment}
          />
        </>
      )}

      {tab === 'services' && (
        <>
          <p className="text-muted small mb-3">
            Service types apply a price multiplier on top of garment base prices. E.g. Dry Cleaning at 2.5× means a ₦300 shirt costs ₦750.
          </p>
          <PricingTable
            title={`Laundry Services (${services.length} types)`}
            items={services}
            setItems={setServices}
            fields={serviceFields}
            createFn={pricingService.createService}
            updateFn={pricingService.updateService}
            deleteFn={pricingService.deleteService}
          />
        </>
      )}

      {tab === 'areas' && (
        <>
          <p className="text-muted small mb-3">
            Delivery areas and their flat-rate delivery fees shown to customers when scheduling pickup/delivery.
          </p>
          <PricingTable
            title={`Delivery Areas (${areas.length} areas)`}
            items={areas}
            setItems={setAreas}
            fields={areaFields}
            createFn={pricingService.createArea}
            updateFn={pricingService.updateArea}
            deleteFn={pricingService.deleteArea}
          />
        </>
      )}
    </div>
  );
}
