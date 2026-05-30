import React, { useState, useEffect } from 'react';
import { SectionHeader } from '../../components/shared/index.jsx';
import { planService } from '../../services/api.js';
import { MOCK_PLANS, formatNGN } from '../../services/mockData.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY = { name:'', amount:'', units:'', description:'', popular:false };

// ─── Plan form modal ──────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(plan ? { ...plan } : EMPTY);
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount || !form.units) return toast.error('Name, amount and units are required');
    setSaving(true);
    try {
      let saved;
      if (plan) {
        await planService.update(plan.id, form);
        saved = { ...plan, ...form };
        toast.success('Plan updated');
      } else {
        const res = await planService.create(form).catch(() => null);
        saved = { ...form, id: res?.plan?.id || Date.now() };
        toast.success('Plan created');
      }
      onSaved(saved, !!plan);
      onClose();
    } catch {
      const saved = plan ? { ...plan, ...form } : { ...form, id: Date.now() };
      toast.success(plan ? 'Plan updated (demo)' : 'Plan created (demo)');
      onSaved(saved, !!plan);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal show d-block" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">{plan ? `Edit — ${plan.name}` : 'Add New Plan'}</h6>
            <button className="btn-close" onClick={onClose}/>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-medium">Plan Name *</label>
              <input className="form-control" value={form.name} onChange={f('name')} placeholder="e.g. Premium Clean" autoFocus/>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Monthly Amount (₦) *</label>
                <div className="input-group">
                  <span className="input-group-text">₦</span>
                  <input type="number" className="form-control" value={form.amount} onChange={f('amount')} min={0} step={500} placeholder="35000"/>
                </div>
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium">Units / Month *</label>
                <input type="number" className="form-control" value={form.units} onChange={f('units')} min={1} placeholder="150"/>
              </div>
            </div>
            <div className="mt-3 mb-3">
              <label className="form-label small fw-medium">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={f('description')} placeholder="Brief plan description…"/>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="popular-check" checked={form.popular} onChange={f('popular')}/>
              <label className="form-check-label small" htmlFor="popular-check">Mark as <strong>Most Popular</strong></label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : (plan ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlans() {
  const toast = useToast();
  const [plans,  setPlans]  = useState(MOCK_PLANS);
  const [modal,  setModal]  = useState(null); // null | 'add' | plan object

  useEffect(() => {
    planService.list().then(d => d?.plans && setPlans(d.plans)).catch(()=>{});
  }, []);

  const handleSaved = (saved, isEdit) => {
    if (isEdit) setPlans(p => p.map(pl => pl.id===saved.id ? saved : pl));
    else        setPlans(p => [...p, saved]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan? Active subscriptions will not be affected.')) return;
    try { await planService.delete(id); } catch {}
    setPlans(p => p.filter(pl => pl.id!==id));
    toast.success('Plan deleted');
  };

  return (
    <div>
      <SectionHeader
        title="Service Plans"
        subtitle="Manage subscription plans, pricing and units"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
            <i className="fas fa-plus me-2"/>Add Plan
          </button>
        }
      />

      {/* Cards */}
      <div className="row g-4 mb-4">
        {plans.map(plan => (
          <div key={plan.id} className="col-md-4">
            <div className={`bg-white rounded-3 border p-4 h-100 d-flex flex-column ${plan.popular?'border-primary border-2':''}`}>
              {plan.popular && <span className="badge bg-primary mb-2" style={{width:'fit-content'}}>Most Popular</span>}
              <h5 className="fw-bold mb-1" style={{fontFamily:'var(--font-display)'}}>{plan.name}</h5>
              <div className="fw-bold text-primary fs-3 mb-0">{formatNGN(Number(plan.amount))}</div>
              <div className="text-muted small mb-2">/month</div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="fas fa-box text-muted small"/>
                <span className="small">{plan.units} units / month</span>
              </div>
              {plan.description && <p className="text-muted small flex-1 mb-3">{plan.description}</p>}
              <div className="d-flex gap-2 mt-auto">
                <button className="btn btn-outline-primary btn-sm flex-1" onClick={() => setModal(plan)}>
                  <i className="fas fa-edit me-1"/>Edit
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(plan.id)}>
                  <i className="fas fa-trash"/>
                </button>
              </div>
            </div>
          </div>
        ))}
        {plans.length===0 && (
          <div className="col-12 text-center py-5 text-muted">
            <i className="fas fa-layer-group fa-3x d-block mb-3 opacity-25"/>
            <p>No plans yet.</p>
            <button className="btn btn-primary btn-sm" onClick={()=>setModal('add')}>Create First Plan</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="mb-0 fw-semibold">All Plans</h6>
          <button className="btn btn-primary btn-sm" onClick={()=>setModal('add')}>
            <i className="fas fa-plus me-1"/>Add Plan
          </button>
        </div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Name</th>
                <th className="small fw-medium text-muted">Amount/mo</th>
                <th className="small fw-medium text-muted">Units</th>
                <th className="small fw-medium text-muted">Popular</th>
                <th className="small fw-medium text-muted pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td className="ps-4 fw-medium small">{plan.name}</td>
                  <td className="fw-medium small text-primary">{formatNGN(Number(plan.amount))}</td>
                  <td className="small">{plan.units} units</td>
                  <td>{plan.popular ? <span className="badge bg-primary" style={{fontSize:10}}>Yes</span> : <span className="text-muted small">—</span>}</td>
                  <td className="pe-4">
                    <div className="d-flex gap-1">
                      <button className="btn btn-xs btn-outline-primary" style={{fontSize:11,padding:'2px 8px'}} onClick={()=>setModal(plan)}>
                        <i className="fas fa-edit"/>
                      </button>
                      <button className="btn btn-xs btn-outline-danger" style={{fontSize:11,padding:'2px 8px'}} onClick={()=>handleDelete(plan.id)}>
                        <i className="fas fa-trash"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <PlanModal
          plan={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
