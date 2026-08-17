
// // v2 - 
// // src/pages/admin/PricingSettings.tsx
// import React, { useState, useEffect } from 'react';
// import { SectionHeader } from '@/components/shared/index.tsx';
// import { pricingService } from '@/services/api.ts';
// import { formatNGN } from '@/services/mockData.ts';
// import { useToast } from '@/context/ToastContext.tsx';
// import { useAppData } from '@/context/AppDataContext.tsx';
// import type { GarmentType, LaundryService, FashionService, DeliveryArea } from '@/types/index.ts';

// const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// const GARMENT_CATEGORIES = ['Tops', 'Bottoms', 'Full outfits', 'Outerwear', 'Innerwear', 'Household', 'Native Wear', 'Other'];

// type FieldType = 'text' | 'select' | 'currency' | 'number' | 'boolean';
// interface FieldDef<T> {
//   key: keyof T & string;
//   label: string;
//   type: FieldType;
//   options?: string[];
//   placeholder?: string;
//   default?: unknown;
// }
// interface WithId { id: string }

// // ─── Editable table row ────────────────────────────────────────────────────────
// function EditableRow<T extends WithId>({ item, fields, onSave, onDelete }: {
//   item: T; fields: FieldDef<T>[]; onSave: (updated: T) => void; onDelete: (id: string) => void;
// }) {
//   const [editing, setEditing] = useState(false);
//   const [form, setForm] = useState<T>({ ...item });

//   const handleSave = () => { onSave(form); setEditing(false); };

//   const f = (k: keyof T & string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
//     setForm(p => ({
//       ...p,
//       [k]: e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value,
//     }));

//   if (!editing) {
//     return (
//       <tr>
//         {fields.map(field => (
//           <td key={field.key} className="small py-2 px-3">
//             {field.type === 'currency' ? formatNGN(Number(item[field.key]))
//               : field.type === 'boolean'
//                 ? <span className={`badge ${item[field.key] ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
//                     {item[field.key] ? 'Active' : 'Inactive'}
//                   </span>
//                 : String(item[field.key] ?? '—')}
//           </td>
//         ))}
//         <td className="py-2 px-3">
//           <div className="d-flex gap-1">
//             <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditing(true)}>
//               <i className="fas fa-edit" />
//             </button>
//             <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onDelete(item.id)}>
//               <i className="fas fa-trash" />
//             </button>
//           </div>
//         </td>
//       </tr>
//     );
//   }

//   return (
//     <tr className="table-warning">
//       {fields.map(field => (
//         <td key={field.key} className="py-1 px-2">
//           {field.type === 'select'
//             ? <select className="form-select form-select-sm" value={String(form[field.key] ?? '')} onChange={f(field.key)}>
//                 {field.options?.map(o => <option key={o}>{o}</option>)}
//               </select>
//             : field.type === 'boolean'
//               ? <div className="form-check form-switch mb-0">
//                   <input className="form-check-input" type="checkbox" checked={!!form[field.key]} onChange={f(field.key)} />
//                 </div>
//               : <input
//                   type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
//                   className="form-control form-control-sm"
//                   value={String(form[field.key] ?? '')}
//                   onChange={f(field.key)}
//                   min={0}
//                   step={field.type === 'currency' ? 50 : 1}
//                 />}
//         </td>
//       ))}
//       <td className="py-1 px-2">
//         <div className="d-flex gap-1">
//           <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleSave}>
//             <i className="fas fa-check" />
//           </button>
//           <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditing(false)}>
//             <i className="fas fa-times" />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// }

// // ─── Add Row Form ──────────────────────────────────────────────────────────────
// function AddRowForm<T extends WithId>({ fields, onAdd, onCancel }: {
//   fields: FieldDef<T>[]; onAdd: (item: Partial<T>) => void; onCancel: () => void;
// }) {
//   const init = Object.fromEntries(fields.map(fd => [fd.key, fd.default ?? ''])) as Partial<T>;
//   const [form, setForm] = useState<Partial<T>>(init);
//   const ff = (k: keyof T & string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
//     setForm(p => ({
//       ...p,
//       [k]: e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value,
//     }));
//   return (
//     <tr className="table-success">
//       {fields.map(field => (
//         <td key={field.key} className="py-1 px-2">
//           {field.type === 'select'
//             ? <select className="form-select form-select-sm" value={String(form[field.key] ?? '')} onChange={ff(field.key)}>
//                 <option value="">Select…</option>
//                 {field.options?.map(o => <option key={o}>{o}</option>)}
//               </select>
//             : field.type === 'boolean'
//               ? <div className="form-check form-switch mb-0">
//                   <input className="form-check-input" type="checkbox" checked={!!form[field.key]} onChange={ff(field.key)} />
//                 </div>
//               : <input
//                   type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
//                   className="form-control form-control-sm"
//                   value={String(form[field.key] ?? '')}
//                   onChange={ff(field.key)}
//                   placeholder={field.placeholder || field.key}
//                   min={0}
//                 />}
//         </td>
//       ))}
//       <td className="py-1 px-2">
//         <div className="d-flex gap-1">
//           <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }}
//             onClick={() => onAdd(form)}>
//             <i className="fas fa-plus" />
//           </button>
//           <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={onCancel}>
//             <i className="fas fa-times" />
//           </button>
//         </div>
//       </td>
//     </tr>
//   );
// }

// // ─── Pricing Table Section ─────────────────────────────────────────────────────
// function PricingTable<T extends WithId>({ title, items, setItems, fields, createFn, updateFn, deleteFn }: {
//   title: string; items: T[]; setItems: React.Dispatch<React.SetStateAction<T[]>>; fields: FieldDef<T>[];
//   createFn: (data: Partial<T>) => Promise<T>;
//   updateFn: (id: string, data: Partial<T>) => Promise<T>;
//   deleteFn: (id: string) => Promise<unknown>;
// }) {
//   const toast = useToast();
//   const { loadPricing } = useAppData();
//   const [showAdd, setShowAdd] = useState(false);

//   const handleSave = async (updated: T) => {
//     try {
//       const saved = await updateFn(updated.id, updated);
//       setItems(prev => prev.map(i => i.id === updated.id ? saved : i));
//       toast.success('Updated successfully');
//       loadPricing();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleAdd = async (newItem: Partial<T>) => {
//     try {
//       const created = await createFn(newItem);
//       setItems(prev => [...prev, created]);
//       toast.success('Added successfully');
//       setShowAdd(false);
//       loadPricing();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!window.confirm('Delete this item?')) return;
//     try {
//       await deleteFn(id);
//       setItems(prev => prev.filter(i => i.id !== id));
//       toast.success('Deleted');
//       loadPricing();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   return (
//     <div className="bg-white rounded-3 border border-light shadow-sm overflow-hidden mb-4">
//       <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-light">
//         <h6 className="fw-semibold mb-0 text-dark">{title}</h6>
//         <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
//           <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'} me-1`} />
//           {showAdd ? 'Cancel' : 'Add'}
//         </button>
//       </div>
//       <div className="table-responsive">
//         <table className="table mb-0">
//           <thead>
//             <tr>
//               {fields.map(f => (
//                 <th key={f.key} className="ps-3 py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>
//                   {f.label}
//                 </th>
//               ))}
//               <th className="py-2 small fw-medium text-muted" style={{ fontSize: 11 }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {showAdd && (
//               <AddRowForm fields={fields} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />
//             )}
//             {items.map(item => (
//               <EditableRow key={item.id} item={item} fields={fields} onSave={handleSave} onDelete={handleDelete} />
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// // ─── Fashion Fees Panel (singleton config — not a list) ────────────────────────

// // v2
// function FashionFeesPanel() {
//   const toast = useToast();
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [availableServices, setAvailableServices] = useState<FashionService[]>([]);
//   const [form, setForm] = useState({
//     consultation_fee: 3000,
//     material_pickup_fee: 2500,
//     consultation_fee_enabled: true,
//     material_pickup_fee_enabled: true,
//     consultation_applies_to: null as string[] | null,
//     material_pickup_applies_to: null as string[] | null,
//   });

//   useEffect(() => {
//     setLoading(true);
//     Promise.all([
//       pricingService.fashionFees(),
//       pricingService.fashionServices(),
//     ]).then(([data, services]) => {
//       setForm({
//         consultation_fee: data.consultation_fee ?? 3000,
//         material_pickup_fee: data.material_pickup_fee ?? 2500,
//         consultation_fee_enabled: data.consultation_fee_enabled ?? true,
//         material_pickup_fee_enabled: data.material_pickup_fee_enabled ?? true,
//         consultation_applies_to: data.consultation_applies_to ?? null,
//         material_pickup_applies_to: data.material_pickup_applies_to ?? null,
//       });
//       setAvailableServices(services);
//     })
//       .catch(err => toast.error(errMsg(err)))
//       .finally(() => setLoading(false));
//   }, []);

//   const toggleAppliesTo = (field: 'consultation_applies_to' | 'material_pickup_applies_to', serviceName: string) => {
//     setForm(p => {
//       const current = p[field] ?? availableServices.map(s => s.name); // null = "applies to all" → expand to the full list on first toggle
//       const next = current.includes(serviceName) ? current.filter(s => s !== serviceName) : [...current, serviceName];
//       return { ...p, [field]: next };
//     });
//   };

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       await pricingService.updateFashionFees({
//         consultation_fee: Number(form.consultation_fee),
//         material_pickup_fee: Number(form.material_pickup_fee),
//         consultation_fee_enabled: form.consultation_fee_enabled,
//         material_pickup_fee_enabled: form.material_pickup_fee_enabled,
//         consultation_applies_to: form.consultation_applies_to,
//         material_pickup_applies_to: form.material_pickup_applies_to,
//       });
//       toast.success('Fashion fees updated successfully');
//     } catch (err) {
//       toast.error(errMsg(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-3 border border-light shadow-sm p-5 text-center">
//         <span className="spinner-border spinner-border-sm text-primary me-2" />
//         <span className="text-muted small">Loading fee settings…</span>
//       </div>
//     );
//   }

//   const AppliesToRow = ({ field, disabled }: { field: 'consultation_applies_to' | 'material_pickup_applies_to'; disabled: boolean }) => {
//     const value = form[field];
//     return (
//       <div className="mt-2">
//         <div className="text-muted small mb-1">Applies to:</div>
//         <div className="d-flex flex-wrap gap-2">
//           {availableServices.map(s => (
//             <label key={s.id} className="d-flex align-items-center gap-1 small" style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
//               <input
//                 type="checkbox"
//                 checked={!value || value.includes(s.name)}
//                 onChange={() => toggleAppliesTo(field, s.name)}
//                 disabled={disabled}
//               />
//               {s.name}
//             </label>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="bg-white rounded-3 border border-light shadow-sm p-4" style={{ maxWidth: 640 }}>
//       <h6 className="fw-semibold mb-1 text-dark">Fashion Service Fees</h6>
//       <p className="text-muted small mb-4">
//         Configure consultation and material-pickup fees for fashion requests, and choose which services they apply to.
//       </p>

//       <div className="mb-4">
//         <label className="form-label small fw-medium text-dark">Consultation Fee</label>
//         <div className="input-group input-group-sm">
//           <span className="input-group-text bg-light border-light">₦</span>
//           <input
//             type="number" className="form-control border-light" min={0} step={50}
//             value={form.consultation_fee}
//             onChange={e => setForm(p => ({ ...p, consultation_fee: Number(e.target.value) }))}
//             disabled={!form.consultation_fee_enabled}
//           />
//         </div>
//         <div className="form-check mt-2">
//           <input
//             className="form-check-input" type="checkbox" id="consultation-enabled"
//             checked={form.consultation_fee_enabled}
//             onChange={e => setForm(p => ({ ...p, consultation_fee_enabled: e.target.checked }))}
//           />
//           <label className="form-check-label small text-muted" htmlFor="consultation-enabled">Enable consultation fee</label>
//         </div>
//         {form.consultation_fee_enabled && <AppliesToRow field="consultation_applies_to" disabled={false} />}
//       </div>

//       <div className="mb-4">
//         <label className="form-label small fw-medium text-dark">Material Pickup Fee</label>
//         <div className="input-group input-group-sm">
//           <span className="input-group-text bg-light border-light">₦</span>
//           <input
//             type="number" className="form-control border-light" min={0} step={50}
//             value={form.material_pickup_fee}
//             onChange={e => setForm(p => ({ ...p, material_pickup_fee: Number(e.target.value) }))}
//             disabled={!form.material_pickup_fee_enabled}
//           />
//         </div>
//         <div className="form-check mt-2">
//           <input
//             className="form-check-input" type="checkbox" id="pickup-enabled"
//             checked={form.material_pickup_fee_enabled}
//             onChange={e => setForm(p => ({ ...p, material_pickup_fee_enabled: e.target.checked }))}
//           />
//           <label className="form-check-label small text-muted" htmlFor="pickup-enabled">Enable material pickup fee</label>
//         </div>
//         {form.material_pickup_fee_enabled && <AppliesToRow field="material_pickup_applies_to" disabled={false} />}
//       </div>

//       <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
//         {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="fas fa-save me-2" />Save Changes</>}
//       </button>
//     </div>
//   );
// }

// // ─── Fashion Services Panel (global defaults + org-specific, with hide/unhide) ──

// function FashionServicesPanel({ onServicesChanged }: { onServicesChanged?: () => void }) {
//   const toast = useToast();
//   const [items, setItems] = useState<FashionService[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showAdd, setShowAdd] = useState(false);
//   const [addForm, setAddForm] = useState({ name: '', description: '', icon: '' });
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editForm, setEditForm] = useState({ name: '', description: '', icon: '' });

//   const load = () => {
//     setLoading(true);
//     pricingService.fashionServices(true)
//       .then(setItems)
//       .catch(err => toast.error(errMsg(err)))
//       .finally(() => setLoading(false));
//   };

//   useEffect(load, []);

//   const startEdit = (item: FashionService) => {
//     setEditingId(item.id);
//     setEditForm({ name: item.name, description: item.description || '', icon: item.icon || '' });
//   };

//   const handleSaveEdit = async (id: string) => {
//     try {
//       const updated = await pricingService.updateFashionService(id, editForm);
//       setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
//       toast.success('Service updated');
//       setEditingId(null);
//       onServicesChanged?.();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleAdd = async () => {
//     if (!addForm.name.trim()) return toast.error('Service name is required');
//     try {
//       const created = await pricingService.createFashionService(addForm);
//       setItems(prev => [...prev, { ...created, is_global: false }]);
//       toast.success('Service added');
//       setAddForm({ name: '', description: '', icon: '' });
//       setShowAdd(false);
//       onServicesChanged?.();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!window.confirm('Delete this service?')) return;
//     try {
//       await pricingService.deleteFashionService(id);
//       setItems(prev => prev.filter(i => i.id !== id));
//       toast.success('Deleted');
//       onServicesChanged?.();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleHide = async (id: string) => {
//     try {
//       await pricingService.hideFashionService(id);
//       setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: false } : i));
//       toast.success('Hidden for your organization');
//       onServicesChanged?.();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   const handleUnhide = async (id: string) => {
//     try {
//       await pricingService.unhideFashionService(id);
//       setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: true } : i));
//       toast.success('Restored');
//       onServicesChanged?.();
//     } catch (err) {
//       toast.error(errMsg(err));
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-3 border border-light shadow-sm p-5 text-center">
//         <span className="spinner-border spinner-border-sm text-primary me-2" />
//         <span className="text-muted small">Loading fashion services…</span>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-3 border border-light shadow-sm overflow-hidden mb-4">
//       <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-light">
//         <div>
//           <h6 className="fw-semibold mb-0 text-dark">Fashion Services ({items.length})</h6>
//           <div className="text-muted" style={{ fontSize: 11 }}>Platform defaults are shared — hide any you don't offer. Add your own anytime.</div>
//         </div>
//         <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
//           <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'} me-1`} />
//           {showAdd ? 'Cancel' : 'Add Service'}
//         </button>
//       </div>
//       <div className="table-responsive">
//         <table className="table mb-0">
//           <thead>
//             <tr>
//               <th className="ps-3 py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Name</th>
//               <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Description</th>
//               <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Icon</th>
//               <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Source</th>
//               <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Status</th>
//               <th className="py-2 small fw-medium text-muted" style={{ fontSize: 11 }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {showAdd && (
//               <tr className="table-success">
//                 <td className="py-1 px-2">
//                   <input className="form-control form-control-sm" placeholder="e.g. Shoe Repair"
//                     value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
//                 </td>
//                 <td className="py-1 px-2">
//                   <input className="form-control form-control-sm" placeholder="Brief description"
//                     value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
//                 </td>
//                 <td className="py-1 px-2">
//                   <input className="form-control form-control-sm" placeholder="fa-shirt"
//                     value={addForm.icon} onChange={e => setAddForm(p => ({ ...p, icon: e.target.value }))} />
//                 </td>
//                 <td className="py-1 px-2 small text-muted">Your org</td>
//                 <td className="py-1 px-2" />
//                 <td className="py-1 px-2">
//                   <div className="d-flex gap-1">
//                     <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleAdd}>
//                       <i className="fas fa-plus" />
//                     </button>
//                     <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setShowAdd(false)}>
//                       <i className="fas fa-times" />
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             )}

//             {items.map(item => {
//               const isEditing = editingId === item.id;
//               return (
//                 <tr key={item.id} className={isEditing ? 'table-warning' : ''}>
//                   <td className="small py-2 px-3">
//                     {isEditing
//                       ? <input className="form-control form-control-sm" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
//                       : <span className="fw-medium">{item.name}</span>}
//                   </td>
//                   <td className="small py-2 px-3">
//                     {isEditing
//                       ? <input className="form-control form-control-sm" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
//                       : (item.description || '—')}
//                   </td>
//                   <td className="small py-2 px-3">
//                     {isEditing
//                       ? <input className="form-control form-control-sm" value={editForm.icon} onChange={e => setEditForm(p => ({ ...p, icon: e.target.value }))} />
//                       : (item.icon ? <><i className={`fas ${item.icon} me-1 text-primary`} />{item.icon}</> : '—')}
//                   </td>
//                   <td className="small py-2 px-3">
//                     <span className={`badge ${item.is_global ? 'bg-info bg-opacity-25 text-info-emphasis' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: 10 }}>
//                       {item.is_global ? 'Platform default' : 'Your org'}
//                     </span>
//                   </td>
//                   <td className="small py-2 px-3">
//                     <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
//                       {item.is_active ? 'Active' : 'Hidden'}
//                     </span>
//                   </td>
//                   <td className="py-2 px-3">
//                     {isEditing ? (
//                       <div className="d-flex gap-1">
//                         <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleSaveEdit(item.id)}>
//                           <i className="fas fa-check" />
//                         </button>
//                         <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditingId(null)}>
//                           <i className="fas fa-times" />
//                         </button>
//                       </div>
//                     ) : item.is_global ? (
//                       <div className="d-flex gap-1">
//                         {item.is_active ? (
//                           <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleHide(item.id)}>
//                             <i className="fas fa-eye-slash me-1" />Hide
//                           </button>
//                         ) : (
//                           <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleUnhide(item.id)}>
//                             <i className="fas fa-eye me-1" />Restore
//                           </button>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="d-flex gap-1">
//                         <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => startEdit(item)}>
//                           <i className="fas fa-edit" />
//                         </button>
//                         <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleDelete(item.id)}>
//                           <i className="fas fa-trash" />
//                         </button>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// // ─── Main Pricing Settings Page ────────────────────────────────────────────────
// export default function PricingSettings() {
//   const toast = useToast();
//   const [garments, setGarments] = useState<GarmentType[]>([]);
//   const [services, setServices] = useState<LaundryService[]>([]);
//   const [areas, setAreas] = useState<DeliveryArea[]>([]);
//   // const [tab, setTab] = useState<'garments' | 'services' | 'areas' | 'fashion'>('garments');
//   const [tab, setTab] = useState<'garments' | 'services' | 'areas' | 'fashion' | 'fashionServices'>('garments');

//   useEffect(() => {
//     Promise.allSettled([
//       pricingService.garments().then(setGarments),
//       pricingService.services().then(setServices),
//       pricingService.areas().then(setAreas),
//     ]).then(results => {
//       results.forEach(r => { if (r.status === 'rejected') toast.error(errMsg(r.reason)); });
//     });
//   }, []);

//   const garmentFields: FieldDef<GarmentType>[] = [
//     { key: 'name', label: 'Garment Name', type: 'text', placeholder: 'e.g. Shirts' },
//     { key: 'category', label: 'Category', type: 'select', options: GARMENT_CATEGORIES, default: 'Tops' },
//     { key: 'base_price', label: 'Base Price (₦)', type: 'currency' },
//     { key: 'unit', label: 'Unit', type: 'text', default: 'per piece' },
//     { key: 'is_active', label: 'Active', type: 'boolean', default: true },
//   ];

//   const serviceFields: FieldDef<LaundryService>[] = [
//     { key: 'name', label: 'Service Name', type: 'text', placeholder: 'e.g. Express Wash' },
//     { key: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
//     { key: 'price_multiplier', label: 'Price Multiplier', type: 'number' },
//     { key: 'is_active', label: 'Active', type: 'boolean', default: true },
//   ];

//   const areaFields: FieldDef<DeliveryArea>[] = [
//     { key: 'name', label: 'Area Name', type: 'text', placeholder: 'e.g. Ajah' },
//     { key: 'price', label: 'Delivery Price (₦)', type: 'currency' },
//     { key: 'is_active', label: 'Active', type: 'boolean', default: true },
//   ];

//   return (
//     <div>
//       <SectionHeader
//         title="Pricing Settings"
//         subtitle="Manage garment pricing, service types, delivery area rates and fashion fees"
//       />

//       <div className="alert alert-info small border-0 bg-info bg-opacity-10 text-info-emphasis mb-4">
//         <i className="fas fa-info-circle me-2" />
//         Changes here update pricing visible to customers when they create orders. Click the edit icon on any row to modify, then tick to save.
//       </div>

//       <ul className="nav nav-tabs mb-4" data-tour="tour-pricing-tabs">
//         {[
//           { key: 'garments' as const, label: 'Garment Pricing', icon: 'fa-shirt' },
//           { key: 'services' as const, label: 'Laundry Services', icon: 'fa-soap' },
//           { key: 'areas' as const, label: 'Delivery Areas', icon: 'fa-map-marker-alt' },
//           { key: 'fashionServices' as const, label: 'Fashion Services', icon: 'fa-scissors' },
//           { key: 'fashion' as const, label: 'Fashion Fees', icon: 'fa-user-tie' },
//         ].map(t => (
//           <li key={t.key} className="nav-item">
//             <button className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
//               <i className={`fas ${t.icon} me-2`} />{t.label}
//             </button>
//           </li>
//         ))}
//       </ul>

//       {tab === 'garments' && (
//         <>
//           <p className="text-muted small mb-3">
//             Set base prices per garment type. Customers select garments and quantities when creating orders.
//             For tougher or dirtier items, staff can apply a custom price multiplier at order time.
//           </p>
//           <PricingTable
//             title={`Garment Prices (${garments.length} items)`}
//             items={garments}
//             setItems={setGarments}
//             fields={garmentFields}
//             createFn={(d) => pricingService.createGarment(d as Partial<GarmentType> & { name: string; category: string; base_price: number })}
//             updateFn={pricingService.updateGarment}
//             deleteFn={pricingService.deleteGarment}
//           />
//         </>
//       )}

//       {tab === 'services' && (
//         <>
//           <p className="text-muted small mb-3">
//             Service types apply a price multiplier on top of garment base prices. E.g. Dry Cleaning at 2.5× means a ₦300 shirt costs ₦750.
//           </p>
//           <PricingTable
//             title={`Laundry Services (${services.length} types)`}
//             items={services}
//             setItems={setServices}
//             fields={serviceFields}
//             createFn={(d) => pricingService.createService(d as Partial<LaundryService> & { name: string })}
//             updateFn={pricingService.updateService}
//             deleteFn={pricingService.deleteService}
//           />
//         </>
//       )}

//       {tab === 'areas' && (
//         <>
//           <p className="text-muted small mb-3">
//             Delivery areas and their flat-rate delivery fees shown to customers when scheduling pickup or delivery.
//           </p>
//           <PricingTable
//             title={`Delivery Areas (${areas.length} areas)`}
//             items={areas}
//             setItems={setAreas}
//             fields={areaFields}
//             createFn={(d) => pricingService.createArea(d as Partial<DeliveryArea> & { name: string; price: number })}
//             updateFn={pricingService.updateArea}
//             deleteFn={pricingService.deleteArea}
//           />
//         </>
//       )}

//       {tab === 'fashionServices' && (
//         <>
//           <p className="text-muted small mb-3">
//             Platform-provided defaults are available to every business — hide any you don't offer.
//             Add your own to extend the list further.
//           </p>
//           <FashionServicesPanel />
//         </>
//       )}

//       {tab === 'fashion' && (
//         <>
//           <p className="text-muted small mb-3">
//             Consultation and material-pickup fees are charged per fashion request. Disable a fee to make that service free.
//           </p>
//           <FashionFeesPanel />
//         </>
//       )}

//     </div>
//   );
// }




// v2
// v3 - adds is_global-aware hide/unhide to Garments, Laundry Services, Delivery Areas
// src/pages/admin/PricingSettings.tsx
import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/shared/index.tsx';
import { pricingService } from '@/services/api.ts';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import { useAppData } from '@/context/AppDataContext.tsx';
import type { GarmentType, LaundryService, FashionService, DeliveryArea } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const GARMENT_CATEGORIES = ['Tops', 'Bottoms', 'Full outfits', 'Outerwear', 'Innerwear', 'Household', 'Native Wear', 'Other'];

type FieldType = 'text' | 'select' | 'currency' | 'number' | 'boolean';
interface FieldDef<T> {
  key: keyof T & string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  default?: unknown;
}
interface WithId { id: string }
interface ManagedItem extends WithId {
  is_global?: boolean;
  is_active: boolean;
}

// ─── Add Row Form (shared — used for org-owned creation on every tab) ──────────
function AddRowForm<T extends WithId>({ fields, onAdd, onCancel }: {
  fields: FieldDef<T>[]; onAdd: (item: Partial<T>) => void; onCancel: () => void;
}) {
  const init = Object.fromEntries(fields.map(fd => [fd.key, fd.default ?? ''])) as Partial<T>;
  const [form, setForm] = useState<Partial<T>>(init);
  const ff = (k: keyof T & string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({
      ...p,
      [k]: e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  return (
    <tr className="table-success">
      {fields.map(field => (
        <td key={field.key} className="py-1 px-2">
          {field.type === 'select'
            ? <select className="form-select form-select-sm" value={String(form[field.key] ?? '')} onChange={ff(field.key)}>
                <option value="">Select…</option>
                {field.options?.map(o => <option key={o}>{o}</option>)}
              </select>
            : field.type === 'boolean'
              ? <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={!!form[field.key]} onChange={ff(field.key)} />
                </div>
              : <input
                  type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
                  className="form-control form-control-sm"
                  value={String(form[field.key] ?? '')}
                  onChange={ff(field.key)}
                  placeholder={field.placeholder || field.key}
                  min={0}
                />}
        </td>
      ))}
      {/* Source + Status columns are informational only on the add row */}
      <td className="py-1 px-2 small text-muted">Your org</td>
      <td className="py-1 px-2" />
      <td className="py-1 px-2">
        <div className="d-flex gap-1">
          <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => onAdd(form)}>
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

// ─── Managed Pricing Table (Garments / Laundry Services / Delivery Areas) ──────
// Same behavior as the working Fashion Services panel: platform-default rows can
// only be Hidden/Restored (never edited or deleted), org-owned rows can be
// Edited/Deleted inline. This is the piece that was missing.
function ManagedPricingTable<T extends ManagedItem>({
  title,
  helperText,
  fields,
  fetchAll,
  createFn,
  updateFn,
  deleteFn,
  hideFn,
  unhideFn,
  onChanged,
}: {
  title: string;
  helperText?: string;
  fields: FieldDef<T>[];
  fetchAll: () => Promise<T[]>;
  createFn: (data: Partial<T>) => Promise<T>;
  updateFn: (id: string, data: Partial<T>) => Promise<T>;
  deleteFn: (id: string) => Promise<unknown>;
  hideFn: (id: string) => Promise<unknown>;
  unhideFn: (id: string) => Promise<unknown>;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<T>>({});

  const load = () => {
    setLoading(true);
    fetchAll()
      .then(setItems)
      .catch(err => toast.error(errMsg(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const initial = {} as Partial<T>;
    fields.forEach(f => { (initial as Record<string, unknown>)[f.key] = item[f.key]; });
    setEditForm(initial);
  };

  const ef = (k: keyof T & string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm(p => ({ ...p, [k]: e.target.value }));

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await updateFn(id, editForm);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updated } : i)));
      toast.success('Updated successfully');
      setEditingId(null);
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleAdd = async (data: Partial<T>) => {
    try {
      const created = await createFn(data);
      setItems(prev => [...prev, { ...created, is_global: false } as T]);
      toast.success('Added successfully');
      setShowAdd(false);
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteFn(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Deleted');
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleHide = async (id: string) => {
    try {
      await hideFn(id);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, is_active: false } : i)));
      toast.success('Hidden for your organization');
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleUnhide = async (id: string) => {
    try {
      await unhideFn(id);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, is_active: true } : i)));
      toast.success('Restored');
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3 border border-light shadow-sm p-5 text-center">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        <span className="text-muted small">Loading {title.toLowerCase()}…</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 border border-light shadow-sm overflow-hidden mb-4">
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-light">
        <div>
          <h6 className="fw-semibold mb-0 text-dark">{title} ({items.length})</h6>
          {helperText && <div className="text-muted" style={{ fontSize: 11 }}>{helperText}</div>}
        </div>
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
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Source</th>
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Status</th>
              <th className="py-2 small fw-medium text-muted" style={{ fontSize: 11 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && <AddRowForm fields={fields} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}

            {items.map(item => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={isEditing ? 'table-warning' : ''}>
                  {fields.map(field => (
                    <td key={field.key} className="small py-2 px-3">
                      {isEditing ? (
                        field.type === 'select' ? (
                          <select className="form-select form-select-sm" value={String(editForm[field.key] ?? '')} onChange={ef(field.key)}>
                            {field.options?.map(o => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}
                            className="form-control form-control-sm"
                            value={String(editForm[field.key] ?? '')}
                            onChange={ef(field.key)}
                            min={0}
                            step={field.type === 'currency' ? 50 : undefined}
                          />
                        )
                      ) : field.type === 'currency' ? (
                        formatNGN(Number(item[field.key]))
                      ) : (
                        String(item[field.key] ?? '—')
                      )}
                    </td>
                  ))}

                  <td className="small py-2 px-3">
                    <span className={`badge ${item.is_global ? 'bg-info bg-opacity-25 text-info-emphasis' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: 10 }}>
                      {item.is_global ? 'Platform default' : 'Your org'}
                    </span>
                  </td>
                  <td className="small py-2 px-3">
                    <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    {isEditing ? (
                      <div className="d-flex gap-1">
                        <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleSaveEdit(item.id)}>
                          <i className="fas fa-check" />
                        </button>
                        <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditingId(null)}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ) : item.is_global ? (
                      <div className="d-flex gap-1">
                        {item.is_active ? (
                          <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleHide(item.id)}>
                            <i className="fas fa-eye-slash me-1" />Hide
                          </button>
                        ) : (
                          <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleUnhide(item.id)}>
                            <i className="fas fa-eye me-1" />Restore
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="d-flex gap-1">
                        <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => startEdit(item)}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleDelete(item.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fashion Fees Panel (singleton config — not a list) ────────────────────────
// Unchanged — this was already working correctly.
function FashionFeesPanel() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<FashionService[]>([]);
  const [form, setForm] = useState({
    consultation_fee: 3000,
    material_pickup_fee: 2500,
    consultation_fee_enabled: true,
    material_pickup_fee_enabled: true,
    consultation_applies_to: null as string[] | null,
    material_pickup_applies_to: null as string[] | null,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      pricingService.fashionFees(),
      pricingService.fashionServices(),
    ]).then(([data, services]) => {
      setForm({
        consultation_fee: data.consultation_fee ?? 3000,
        material_pickup_fee: data.material_pickup_fee ?? 2500,
        consultation_fee_enabled: data.consultation_fee_enabled ?? true,
        material_pickup_fee_enabled: data.material_pickup_fee_enabled ?? true,
        consultation_applies_to: data.consultation_applies_to ?? null,
        material_pickup_applies_to: data.material_pickup_applies_to ?? null,
      });
      setAvailableServices(services);
    })
      .catch(err => toast.error(errMsg(err)))
      .finally(() => setLoading(false));
  }, []);

  const toggleAppliesTo = (field: 'consultation_applies_to' | 'material_pickup_applies_to', serviceName: string) => {
    setForm(p => {
      const current = p[field] ?? availableServices.map(s => s.name);
      const next = current.includes(serviceName) ? current.filter(s => s !== serviceName) : [...current, serviceName];
      return { ...p, [field]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pricingService.updateFashionFees({
        consultation_fee: Number(form.consultation_fee),
        material_pickup_fee: Number(form.material_pickup_fee),
        consultation_fee_enabled: form.consultation_fee_enabled,
        material_pickup_fee_enabled: form.material_pickup_fee_enabled,
        consultation_applies_to: form.consultation_applies_to,
        material_pickup_applies_to: form.material_pickup_applies_to,
      });
      toast.success('Fashion fees updated successfully');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3 border border-light shadow-sm p-5 text-center">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        <span className="text-muted small">Loading fee settings…</span>
      </div>
    );
  }

  const AppliesToRow = ({ field, disabled }: { field: 'consultation_applies_to' | 'material_pickup_applies_to'; disabled: boolean }) => {
    const value = form[field];
    return (
      <div className="mt-2">
        <div className="text-muted small mb-1">Applies to:</div>
        <div className="d-flex flex-wrap gap-2">
          {availableServices.map(s => (
            <label key={s.id} className="d-flex align-items-center gap-1 small" style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={!value || value.includes(s.name)}
                onChange={() => toggleAppliesTo(field, s.name)}
                disabled={disabled}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3 border border-light shadow-sm p-4" style={{ maxWidth: 640 }}>
      <h6 className="fw-semibold mb-1 text-dark">Fashion Service Fees</h6>
      <p className="text-muted small mb-4">
        Configure consultation and material-pickup fees for fashion requests, and choose which services they apply to.
      </p>

      <div className="mb-4">
        <label className="form-label small fw-medium text-dark">Consultation Fee</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light border-light">₦</span>
          <input
            type="number" className="form-control border-light" min={0} step={50}
            value={form.consultation_fee}
            onChange={e => setForm(p => ({ ...p, consultation_fee: Number(e.target.value) }))}
            disabled={!form.consultation_fee_enabled}
          />
        </div>
        <div className="form-check mt-2">
          <input
            className="form-check-input" type="checkbox" id="consultation-enabled"
            checked={form.consultation_fee_enabled}
            onChange={e => setForm(p => ({ ...p, consultation_fee_enabled: e.target.checked }))}
          />
          <label className="form-check-label small text-muted" htmlFor="consultation-enabled">Enable consultation fee</label>
        </div>
        {form.consultation_fee_enabled && <AppliesToRow field="consultation_applies_to" disabled={false} />}
      </div>

      <div className="mb-4">
        <label className="form-label small fw-medium text-dark">Material Pickup Fee</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text bg-light border-light">₦</span>
          <input
            type="number" className="form-control border-light" min={0} step={50}
            value={form.material_pickup_fee}
            onChange={e => setForm(p => ({ ...p, material_pickup_fee: Number(e.target.value) }))}
            disabled={!form.material_pickup_fee_enabled}
          />
        </div>
        <div className="form-check mt-2">
          <input
            className="form-check-input" type="checkbox" id="pickup-enabled"
            checked={form.material_pickup_fee_enabled}
            onChange={e => setForm(p => ({ ...p, material_pickup_fee_enabled: e.target.checked }))}
          />
          <label className="form-check-label small text-muted" htmlFor="pickup-enabled">Enable material pickup fee</label>
        </div>
        {form.material_pickup_fee_enabled && <AppliesToRow field="material_pickup_applies_to" disabled={false} />}
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="fas fa-save me-2" />Save Changes</>}
      </button>
    </div>
  );
}

// ─── Fashion Services Panel (global defaults + org-specific, with hide/unhide) ──
// Unchanged — this was already working correctly. ManagedPricingTable above
// follows this exact same interaction pattern for the other three tabs.
function FashionServicesPanel({ onServicesChanged }: { onServicesChanged?: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<FashionService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', icon: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '' });

  const load = () => {
    setLoading(true);
    pricingService.fashionServices(true)
      .then(setItems)
      .catch(err => toast.error(errMsg(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (item: FashionService) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description || '', icon: item.icon || '' });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updated = await pricingService.updateFashionService(id, editForm);
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
      toast.success('Service updated');
      setEditingId(null);
      onServicesChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleAdd = async () => {
    if (!addForm.name.trim()) return toast.error('Service name is required');
    try {
      const created = await pricingService.createFashionService(addForm);
      setItems(prev => [...prev, { ...created, is_global: false }]);
      toast.success('Service added');
      setAddForm({ name: '', description: '', icon: '' });
      setShowAdd(false);
      onServicesChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await pricingService.deleteFashionService(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Deleted');
      onServicesChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleHide = async (id: string) => {
    try {
      await pricingService.hideFashionService(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: false } : i));
      toast.success('Hidden for your organization');
      onServicesChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleUnhide = async (id: string) => {
    try {
      await pricingService.unhideFashionService(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: true } : i));
      toast.success('Restored');
      onServicesChanged?.();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3 border border-light shadow-sm p-5 text-center">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        <span className="text-muted small">Loading fashion services…</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3 border border-light shadow-sm overflow-hidden mb-4">
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-light">
        <div>
          <h6 className="fw-semibold mb-0 text-dark">Fashion Services ({items.length})</h6>
          <div className="text-muted" style={{ fontSize: 11 }}>Platform defaults are shared — hide any you don't offer. Add your own anytime.</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
          <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'} me-1`} />
          {showAdd ? 'Cancel' : 'Add Service'}
        </button>
      </div>
      <div className="table-responsive">
        <table className="table mb-0">
          <thead>
            <tr>
              <th className="ps-3 py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Name</th>
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Description</th>
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Icon</th>
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Source</th>
              <th className="py-2 small fw-medium text-muted text-uppercase" style={{ letterSpacing: '0.04em', fontSize: 11 }}>Status</th>
              <th className="py-2 small fw-medium text-muted" style={{ fontSize: 11 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr className="table-success">
                <td className="py-1 px-2">
                  <input className="form-control form-control-sm" placeholder="e.g. Shoe Repair"
                    value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} />
                </td>
                <td className="py-1 px-2">
                  <input className="form-control form-control-sm" placeholder="Brief description"
                    value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} />
                </td>
                <td className="py-1 px-2">
                  <input className="form-control form-control-sm" placeholder="fa-shirt"
                    value={addForm.icon} onChange={e => setAddForm(p => ({ ...p, icon: e.target.value }))} />
                </td>
                <td className="py-1 px-2 small text-muted">Your org</td>
                <td className="py-1 px-2" />
                <td className="py-1 px-2">
                  <div className="d-flex gap-1">
                    <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={handleAdd}>
                      <i className="fas fa-plus" />
                    </button>
                    <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setShowAdd(false)}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {items.map(item => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={isEditing ? 'table-warning' : ''}>
                  <td className="small py-2 px-3">
                    {isEditing
                      ? <input className="form-control form-control-sm" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                      : <span className="fw-medium">{item.name}</span>}
                  </td>
                  <td className="small py-2 px-3">
                    {isEditing
                      ? <input className="form-control form-control-sm" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                      : (item.description || '—')}
                  </td>
                  <td className="small py-2 px-3">
                    {isEditing
                      ? <input className="form-control form-control-sm" value={editForm.icon} onChange={e => setEditForm(p => ({ ...p, icon: e.target.value }))} />
                      : (item.icon ? <><i className={`fas ${item.icon} me-1 text-primary`} />{item.icon}</> : '—')}
                  </td>
                  <td className="small py-2 px-3">
                    <span className={`badge ${item.is_global ? 'bg-info bg-opacity-25 text-info-emphasis' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: 10 }}>
                      {item.is_global ? 'Platform default' : 'Your org'}
                    </span>
                  </td>
                  <td className="small py-2 px-3">
                    <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 10 }}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <div className="d-flex gap-1">
                        <button className="btn btn-xs btn-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleSaveEdit(item.id)}>
                          <i className="fas fa-check" />
                        </button>
                        <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditingId(null)}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ) : item.is_global ? (
                      <div className="d-flex gap-1">
                        {item.is_active ? (
                          <button className="btn btn-xs btn-outline-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleHide(item.id)}>
                            <i className="fas fa-eye-slash me-1" />Hide
                          </button>
                        ) : (
                          <button className="btn btn-xs btn-outline-success" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleUnhide(item.id)}>
                            <i className="fas fa-eye me-1" />Restore
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="d-flex gap-1">
                        <button className="btn btn-xs btn-outline-warning" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => startEdit(item)}>
                          <i className="fas fa-edit" />
                        </button>
                        <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleDelete(item.id)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Pricing Settings Page ────────────────────────────────────────────────
export default function PricingSettings() {
  const toast = useToast();
  const { loadPricing } = useAppData();
  const [tab, setTab] = useState<'garments' | 'services' | 'areas' | 'fashion' | 'fashionServices'>('garments');

  useEffect(() => {
    // Kept only to surface early load errors on first mount; each managed table
    // now fetches (and refetches) its own data independently via fetchAll.
    Promise.allSettled([
      pricingService.garments(),
      pricingService.services(),
      pricingService.areas(),
    ]).then(results => {
      results.forEach(r => { if (r.status === 'rejected') toast.error(errMsg(r.reason)); });
    });
  }, []);

  const garmentFields: FieldDef<GarmentType>[] = [
    { key: 'name', label: 'Garment Name', type: 'text', placeholder: 'e.g. Shirts' },
    { key: 'category', label: 'Category', type: 'select', options: GARMENT_CATEGORIES, default: 'Tops' },
    { key: 'base_price', label: 'Base Price (₦)', type: 'currency' },
    { key: 'unit', label: 'Unit', type: 'text', default: 'per piece' },
  ];

  const serviceFields: FieldDef<LaundryService>[] = [
    { key: 'name', label: 'Service Name', type: 'text', placeholder: 'e.g. Express Wash' },
    { key: 'description', label: 'Description', type: 'text', placeholder: 'Brief description' },
    { key: 'price_multiplier', label: 'Price Multiplier', type: 'number' },
  ];

  const areaFields: FieldDef<DeliveryArea>[] = [
    { key: 'name', label: 'Area Name', type: 'text', placeholder: 'e.g. Ajah' },
    { key: 'price', label: 'Delivery Price (₦)', type: 'currency' },
  ];

  return (
    <div>
      <SectionHeader
        title="Pricing Settings"
        subtitle="Manage garment pricing, service types, delivery area rates and fashion fees"
      />

      <div className="alert alert-info small border-0 bg-info bg-opacity-10 text-info-emphasis mb-4">
        <i className="fas fa-info-circle me-2" />
        Changes here update pricing visible to customers when they create orders. Platform defaults can be hidden
        for your organization; your own entries can be edited or deleted directly.
      </div>

      <ul className="nav nav-tabs mb-4" data-tour="tour-pricing-tabs">
        {[
          { key: 'garments' as const, label: 'Garment Pricing', icon: 'fa-shirt' },
          { key: 'services' as const, label: 'Laundry Services', icon: 'fa-soap' },
          { key: 'areas' as const, label: 'Delivery Areas', icon: 'fa-map-marker-alt' },
          { key: 'fashionServices' as const, label: 'Fashion Services', icon: 'fa-scissors' },
          { key: 'fashion' as const, label: 'Fashion Fees', icon: 'fa-user-tie' },
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
            For tougher or dirtier items, staff can apply a custom price multiplier at order time.
          </p>
          <ManagedPricingTable<GarmentType>
            title="Garment Prices"
            helperText="Platform defaults are shared — hide any you don't offer. Add your own anytime."
            fields={garmentFields}
            fetchAll={() => pricingService.garments(true)}
            createFn={(d) => pricingService.createGarment(d as Partial<GarmentType> & { name: string; category: string; base_price: number })}
            updateFn={pricingService.updateGarment}
            deleteFn={pricingService.deleteGarment}
            hideFn={pricingService.hideGarment}
            unhideFn={pricingService.unhideGarment}
            onChanged={loadPricing}
          />
        </>
      )}

      {tab === 'services' && (
        <>
          <p className="text-muted small mb-3">
            Service types apply a price multiplier on top of garment base prices. E.g. Dry Cleaning at 2.5× means a ₦300 shirt costs ₦750.
          </p>
          <ManagedPricingTable<LaundryService>
            title="Laundry Services"
            helperText="Platform defaults are shared — hide any you don't offer. Add your own anytime."
            fields={serviceFields}
            fetchAll={() => pricingService.services(true)}
            createFn={(d) => pricingService.createService(d as Partial<LaundryService> & { name: string })}
            updateFn={pricingService.updateService}
            deleteFn={pricingService.deleteService}
            hideFn={pricingService.hideService}
            unhideFn={pricingService.unhideService}
            onChanged={loadPricing}
          />
        </>
      )}

      {tab === 'areas' && (
        <>
          <p className="text-muted small mb-3">
            Delivery areas and their flat-rate delivery fees shown to customers when scheduling pickup or delivery.
          </p>
          <ManagedPricingTable<DeliveryArea>
            title="Delivery Areas"
            helperText="Platform defaults are shared — hide any you don't cover. Add your own anytime."
            fields={areaFields}
            fetchAll={() => pricingService.areas(true)}
            createFn={(d) => pricingService.createArea(d as Partial<DeliveryArea> & { name: string; price: number })}
            updateFn={pricingService.updateArea}
            deleteFn={pricingService.deleteArea}
            hideFn={pricingService.hideArea}
            unhideFn={pricingService.unhideArea}
            onChanged={loadPricing}
          />
        </>
      )}

      {tab === 'fashionServices' && (
        <>
          <p className="text-muted small mb-3">
            Platform-provided defaults are available to every business — hide any you don't offer.
            Add your own to extend the list further.
          </p>
          <FashionServicesPanel />
        </>
      )}

      {tab === 'fashion' && (
        <>
          <p className="text-muted small mb-3">
            Consultation and material-pickup fees are charged per fashion request. Disable a fee to make that service free.
          </p>
          <FashionFeesPanel />
        </>
      )}
    </div>
  );
}
