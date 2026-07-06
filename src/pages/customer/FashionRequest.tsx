import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, MediaPreviewGrid } from '@/components/shared/index.tsx';
import { useToast } from '@/context/ToastContext.tsx';
import { orderService } from '@/services/api.ts';
import type { FashionServiceType, MeasurementsData, FilePreview } from '@/types/index.ts';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

interface FashionServiceOption { id: number; name: FashionServiceType; icon: string; desc: string }

const FASHION_SERVICES: FashionServiceOption[] = [
  { id: 1, name: 'Custom Tailoring', icon: 'fa-ruler-combined', desc: 'Made-to-measure garments from scratch' },
  { id: 2, name: 'Alteration', icon: 'fa-scissors', desc: 'Adjust fit of existing garments' },
  { id: 3, name: 'Repair', icon: 'fa-wrench', desc: 'Fix damaged clothing items' },
  { id: 4, name: 'Bespoke Design', icon: 'fa-pen-nib', desc: 'One-of-a-kind custom design consultation' },
  { id: 5, name: 'Material Pickup', icon: 'fa-truck-pickup', desc: 'We collect your fabric from you' },
];

const STEPS = ['Service', 'Details', 'Media & Notes', 'Summary'];

type MeasurementKey = keyof MeasurementsData;
const MEASUREMENT_KEYS: MeasurementKey[] = ['chest', 'waist', 'hips', 'shoulder', 'length', 'sleeve'];

interface RequestForm {
  service: FashionServiceOption | null;
  item_name: string;
  measurements: Record<MeasurementKey, string>;
  description: string;
  preferred_delivery: string;
  address: string;
  fabric_source: 'customer' | 'stitch';
  files: FilePreview[];
}

const EMPTY_MEASUREMENTS = MEASUREMENT_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {} as Record<MeasurementKey, string>);

export default function FashionRequest() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<RequestForm>({
    service: null,
    item_name: '',
    measurements: EMPTY_MEASUREMENTS,
    description: '',
    preferred_delivery: '',
    address: '',
    fabric_source: 'customer',
    files: [],
  });

  const setMeasure = (k: MeasurementKey, v: string) => setForm(p => ({ ...p, measurements: { ...p.measurements, [k]: v } }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = await Promise.all(files.map(file =>
      new Promise<FilePreview>(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve({ file, preview: (ev.target?.result as string) || '', type: file.type });
        reader.readAsDataURL(file);
      }),
    ));
    setForm(p => ({ ...p, files: [...p.files, ...newFiles] }));
    e.target.value = '';
  };

  const removeFile = (i: number) => setForm(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }));

  const canProceed = () => {
    if (step === 0) return !!form.service;
    if (step === 1) return !!form.item_name && !!form.address;
    return true;
  };

  const handleSubmit = async () => {
    if (!form.service) return;
    setSubmitting(true);
    try {
      const measurements: MeasurementsData = {};
      MEASUREMENT_KEYS.forEach(k => {
        const v = form.measurements[k];
        if (v) measurements[k] = Number(v);
      });

      await orderService.createFashion({
        service_type: form.service.name,
        item_name: form.item_name,
        fabric_source: form.fabric_source,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        design_notes: form.description || undefined,
        preferred_delivery_date: form.preferred_delivery || undefined,
        delivery_address: form.address,
      });
      toast.success('Fashion request submitted! Our team will contact you to arrange a consultation.');
      navigate('/orders');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHeader title="Fashion Request" subtitle="Tell us what you'd like made or altered" />

      <div className="d-flex align-items-center gap-0 mb-5">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="d-flex align-items-center gap-2">
              <div className={`d-flex align-items-center justify-content-center rounded-circle fw-bold ${i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
                {i < step ? <i className="fas fa-check" style={{ fontSize: 11 }} /> : i + 1}
              </div>
              <span className={`small ${i === step ? 'fw-semibold text-primary' : 'text-muted'} d-none d-sm-inline`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 mx-2 ${i < step ? 'bg-success' : 'bg-light'}`} style={{ height: 2 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h6 className="fw-semibold mb-3">What service do you need?</h6>
          <div className="d-flex flex-column gap-2">
            {FASHION_SERVICES.map(svc => (
              <div
                key={svc.id}
                className={`bg-white rounded-3 border p-3 d-flex align-items-center gap-3 ${form.service?.id === svc.id ? 'border-primary border-2 bg-primary bg-opacity-10' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setForm(p => ({ ...p, service: svc }))}
              >
                <div className="stat-icon bg-info bg-opacity-10 flex-shrink-0" style={{ width: 44, height: 44 }}>
                  <i className={`fas ${svc.icon} text-info`} />
                </div>
                <div className="flex-1">
                  <div className="fw-medium small">{svc.name}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{svc.desc}</div>
                </div>
                {form.service?.id === svc.id && <i className="fas fa-check-circle text-primary" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h6 className="fw-semibold mb-3">Garment Details</h6>
          <div className="bg-white rounded-3 border p-4">
            <div className="mb-3">
              <label className="form-label small fw-medium">Item / Garment Name *</label>
              <input
                className="form-control"
                placeholder="e.g. Aso-Oke Senator Suit, Wedding Guest Gown..."
                value={form.item_name}
                onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium">Fabric Source</label>
              <div className="d-flex gap-3">
                {([
                  { val: 'customer' as const, label: 'I will provide fabric' },
                  { val: 'stitch' as const, label: 'Stitch will source' },
                ]).map(o => (
                  <div key={o.val} className="form-check">
                    <input className="form-check-input" type="radio" name="fabric" id={`fab-${o.val}`}
                      checked={form.fabric_source === o.val}
                      onChange={() => setForm(p => ({ ...p, fabric_source: o.val }))} />
                    <label className="form-check-label small" htmlFor={`fab-${o.val}`}>{o.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-medium">Measurements (inches) — optional</label>
              <div className="row g-2">
                {MEASUREMENT_KEYS.map(k => (
                  <div key={k} className="col-4">
                    <label className="form-label" style={{ fontSize: 11, textTransform: 'capitalize' }}>{k}</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        className="form-control"
                        value={form.measurements[k]}
                        onChange={e => setMeasure(k, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                      <span className="input-group-text">"</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-muted small mt-2">
                <i className="fas fa-info-circle me-1" />
                If you're unsure, leave blank — our tailor will take measurements during the consultation visit.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium">Preferred Delivery Date</label>
              <input type="date" className="form-control" value={form.preferred_delivery}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, preferred_delivery: e.target.value }))} />
            </div>

            <div>
              <label className="form-label small fw-medium">Your Address / Location *</label>
              <input className="form-control" placeholder="Full address for consultation visit..."
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h6 className="fw-semibold mb-3">Inspiration & Details</h6>
          <div className="bg-white rounded-3 border p-4">
            <div className="mb-4">
              <label className="form-label small fw-medium">Inspiration Images / Videos</label>
              <div className="upload-zone mb-3" onClick={() => fileRef.current?.click()}>
                <i className="fas fa-image fa-2x text-muted mb-2 d-block" />
                <div className="small text-muted">Upload photos of styles you like</div>
                <div className="text-muted" style={{ fontSize: 11 }}>JPG, PNG, MP4 accepted</div>
              </div>
              <input ref={fileRef} type="file" className="d-none" multiple accept="image/*,video/*" onChange={handleFileChange} />
              {form.files.length > 0 && (
                <MediaPreviewGrid files={form.files} onRemove={removeFile} />
              )}
              <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                <i className="fas fa-info-circle me-1" />Reference images help our tailor prepare — a link to view them will be shared with staff during your consultation.
              </div>
            </div>

            <div>
              <label className="form-label small fw-medium">Description / Instructions</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe exactly what you want — style, colors, embellishments, neckline, etc..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h6 className="fw-semibold mb-3">Request Summary</h6>
          <div className="bg-white rounded-3 border p-4 mb-3">
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Service</span>
              <span className="small fw-medium">{form.service?.name}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Item</span>
              <span className="small fw-medium">{form.item_name}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Fabric</span>
              <span className="small fw-medium">{form.fabric_source === 'customer' ? 'Customer providing' : 'Stitch sourcing'}</span>
            </div>
            {form.preferred_delivery && (
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Target Delivery</span>
                <span className="small fw-medium">{form.preferred_delivery}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Address</span>
              <span className="small fw-medium text-end" style={{ maxWidth: '60%' }}>{form.address}</span>
            </div>
            {form.files.length > 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Attachments</span>
                <span className="small fw-medium">{form.files.length} file(s)</span>
              </div>
            )}
            {Object.values(form.measurements).some(v => v) && (
              <div className="mt-3 pt-3 border-top">
                <div className="text-muted small mb-2">Measurements</div>
                <div className="row g-2">
                  {Object.entries(form.measurements).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="col-4">
                      <div className="bg-light rounded-2 p-2 text-center">
                        <div className="fw-bold small">{v}"</div>
                        <div className="text-muted" style={{ fontSize: 10, textTransform: 'capitalize' }}>{k}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="alert alert-info small">
            <i className="fas fa-calendar-check me-2" />
            Our team will reach out within 24 hours to schedule your consultation visit and provide a quote.
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-outline-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          <i className="fas fa-arrow-left me-2" />Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
            Continue <i className="fas fa-arrow-right ms-2" />
          </button>
        ) : (
          <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
              : <><i className="fas fa-paper-plane me-2" />Submit Request</>}
          </button>
        )}
      </div>
    </div>
  );
}
