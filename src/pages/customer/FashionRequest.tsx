// src/pages/customer/FashionRequest.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, MediaPreviewGrid } from '@/components/shared/index.tsx';
import { formatNGN } from '@/services/mockData.ts';
import { useToast } from '@/context/ToastContext.tsx';
import { orderService, pricingService, paymentService } from '@/services/api.ts';
import { useAuth } from '@/context/AuthContext.tsx';
import type { FashionService, MeasurementsData, FilePreview } from '@/types/index.ts';
import { calcFashionFees, feeApplies } from '@/utils/fashionFees';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const STEPS = ['Service', 'Details', 'Media & Notes', 'Summary'];

const CONSULTATION_TIME_SLOTS = [
  '8:00 AM – 10:00 AM', '10:00 AM – 12:00 PM', '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM',
];

type MeasurementKey = keyof MeasurementsData;
const MEASUREMENT_KEYS: MeasurementKey[] = ['chest', 'waist', 'hips', 'shoulder', 'length', 'sleeve'];
const EMPTY_MEASUREMENTS = MEASUREMENT_KEYS.reduce((acc, k) => ({ ...acc, [k]: '' }), {} as Record<MeasurementKey, string>);

interface FashionFees {
  consultation_fee: number;
  consultation_fee_enabled: boolean;
  consultation_applies_to: string[] | null;
  material_pickup_fee: number;
  material_pickup_fee_enabled: boolean;
  material_pickup_applies_to: string[] | null;
}

const EMPTY_FEES: FashionFees = {
  consultation_fee: 0, consultation_fee_enabled: false, consultation_applies_to: null,
  material_pickup_fee: 0, material_pickup_fee_enabled: false, material_pickup_applies_to: null,
};

// One shared function — used for BOTH the per-service hint text on step 0
// AND the final total calculation, so there is exactly one source of truth
// for "does this fee apply" and it can never silently disagree with itself.
// function feeApplies(enabled: boolean, appliesTo: string[] | null, selected: string[]): boolean {
//   if (!enabled) return false;
//   if (!appliesTo || appliesTo.length === 0) return true; // no restriction = applies to all services
//   return selected.some(s => appliesTo.includes(s));
// }

// function calcFees(fees: FashionFees, selectedServices: string[]) {
//   const consultation = feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, selectedServices) ? fees.consultation_fee : 0;
//   const materialPickup = feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, selectedServices) ? fees.material_pickup_fee : 0;
//   return { consultation, materialPickup, total: consultation + materialPickup };
// }

// function serviceFeeHint(fees: FashionFees, serviceName: string): string {
//   const parts: string[] = [];
//   if (feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, [serviceName])) {
//     parts.push(`${formatNGN(fees.consultation_fee)} consultation`);
//   }
//   if (feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, [serviceName])) {
//     parts.push(`${formatNGN(fees.material_pickup_fee)} pickup`);
//   }
//   return parts.length > 0 ? `+${parts.join(' + ')}` : 'No extra fees';
// }

interface FashionPendingPayload {
  service_types: string[];
  item_name: string;
  fabric_source: 'customer' | 'stitch';
  measurements?: MeasurementsData;
  design_notes?: string;
  consultation_date?: string;
  consultation_time?: string;
  preferred_delivery_date?: string;
  delivery_address: string;
  total_amount: number;
}

interface RequestForm {
  services: string[]; // selected FashionService names, multi-select
  item_name: string;
  measurements: Record<MeasurementKey, string>;
  description: string;
  consultation_date: string;
  consultation_time: string;
  preferred_delivery: string;
  address: string;
  fabric_source: 'customer' | 'stitch';
  files: FilePreview[];
}

// ─── Paystack: backend-initialized, inline-first with redirect fallback ──────
async function paystackPay({ email, amount, metadata, pendingPayload, onSuccess, onCancel, toast }: {
  email: string; amount: number; metadata: Record<string, unknown>;
  pendingPayload: FashionPendingPayload;
  onSuccess: (reference: string) => void; onCancel?: () => void;
  toast: ReturnType<typeof useToast>;
}): Promise<{ verified: boolean; reference?: string; cancelled?: boolean; redirected?: boolean }> {
  let res;
  try {
    res = await paymentService.initialize({
      email, amount, purpose: 'order', metadata,
      callback_url: `${window.location.origin}/payment/callback`,
    });
  } catch (err) {
    toast.error('Could not start payment: ' + errMsg(err));
    return { verified: false };
  }

  const { reference, access_code, authorization_url } = res;

  const PaystackPop = window.PaystackPop;
  if (PaystackPop && access_code) {
    return new Promise((resolve) => {
      const popup = new PaystackPop();
      popup.resumeTransaction(access_code, {
        onSuccess: async (response) => {
          toast.info('Verifying payment…');
          try {
            await paymentService.verify(response.reference);
            toast.success('Payment confirmed!');
            onSuccess(response.reference);
            resolve({ verified: true, reference: response.reference });
          } catch (err) {
            toast.error('Payment verification failed — please contact support with reference: ' + response.reference);
            console.error(err);
            resolve({ verified: false, reference: response.reference });
          }
        },
        onCancel: () => {
          onCancel?.();
          resolve({ verified: false, cancelled: true });
        },
      });
    });
  }

  // Fallback: full redirect. Persist the actual fashion request payload
  // (not a laundry-shaped one) so the callback page can complete order
  // creation after the round-trip.
  if (authorization_url) {
    sessionStorage.setItem('pending_order', JSON.stringify({ reference, order_kind: 'fashion', payload: pendingPayload }));
    toast.info('Redirecting to payment page…');
    window.location.href = authorization_url;
    return { verified: false, redirected: true };
  }

  toast.error('Could not start payment. Please try again.');
  return { verified: false };
}

export default function FashionRequest() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<FashionService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [fees, setFees] = useState<FashionFees>(EMPTY_FEES);

  const [form, setForm] = useState<RequestForm>({
    services: [],
    item_name: '',
    measurements: EMPTY_MEASUREMENTS,
    description: '',
    consultation_date: '',
    consultation_time: '',
    preferred_delivery: '',
    address: '',
    fabric_source: 'customer',
    files: [],
  });

  useEffect(() => {
    pricingService.fashionServices().then(setServices).catch(() => setServices([])).finally(() => setLoadingServices(false));
    pricingService.fashionFees().then(setFees).catch(() => {});
  }, []);

  const { consultation: consultationFee, materialPickup: materialPickupFee, total: totalAmount } = useMemo(
    () => calcFashionFees(fees, form.services), [fees, form.services],
  );

  const toggleService = (name: string) =>
    setForm(p => ({ ...p, services: p.services.includes(name) ? p.services.filter(s => s !== name) : [...p.services, name] }));

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
    if (step === 0) return form.services.length > 0;
    if (step === 1) return !!form.item_name && !!form.address;
    return true;
  };

  const handleSubmit = async () => {
    if (form.services.length === 0) return;
    setSubmitting(true);
    try {
      const measurements: MeasurementsData = {};
      MEASUREMENT_KEYS.forEach(k => {
        const v = form.measurements[k];
        if (v) measurements[k] = Number(v);
      });

      const pendingPayload: FashionPendingPayload = {
        service_types: form.services,
        item_name: form.item_name,
        fabric_source: form.fabric_source,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        design_notes: form.description || undefined,
        consultation_date: form.consultation_date || undefined,
        consultation_time: form.consultation_time || undefined,
        preferred_delivery_date: form.preferred_delivery || undefined,
        delivery_address: form.address,
        total_amount: totalAmount,
      };

      let paymentRef: string | undefined;

      if (totalAmount > 0) {
        const result = await paystackPay({
          email: user?.email || 'customer@stitch.ng',
          amount: totalAmount,
          metadata: { order_type: 'fashion', services: form.services },
          pendingPayload,
          toast,
          onSuccess: (reference) => { paymentRef = reference; },
          onCancel: () => toast.info('Payment cancelled. Request not submitted.'),
        });
        if (!paymentRef) { setSubmitting(false); return; }
      }

      await orderService.createFashion({
        ...pendingPayload,
        payment_method: totalAmount > 0 ? 'direct' : undefined,
        payment_reference: paymentRef,
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
          <h6 className="fw-semibold mb-3 text-dark">What service(s) do you need?</h6>
          {/* {loadingServices ? (
            <div className="text-muted small">Loading services…</div>
          ) : ( */}
          {loadingServices ? (
            <div className="text-center py-5 text-muted">
              <span className="spinner-border spinner-border-sm me-2" />
              Loading services…
            </div>
          ) : services.length === 0 ? (
            <div className="alert alert-warning small">
              <i className="fas fa-exclamation-triangle me-2" />
              No fashion services are currently available. Please contact support.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {services.map(svc => {
                const sel = form.services.includes(svc.name);
                return (
                  <div key={svc.id}
                    className={`rounded-3 border p-3 d-flex align-items-center gap-3
                    ${sel ? 'bg-primary border-primary shadow-sm' : 'bg-white border-light'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleService(svc.name)}
                  >
                    <div className={`d-flex align-items-center justify-content-center flex-shrink-0 rounded-3 ${sel ? 'bg-white bg-opacity-25' : 'bg-primary bg-opacity-10'}`}
                      style={{ width: 44, height: 44 }}>
                      <i className={`fas ${svc.icon || 'fa-shirt'} text-primary`} />
                    </div>
                    <div className="flex-grow-1">
                      <div className={`fw-medium small ${sel ? 'text-white' : 'text-dark'}`}>{svc.name}</div>
                      {svc.description && (
                        <div className={`${sel ? 'text-white text-opacity-75' : 'text-muted'}`} style={{ fontSize: 11 }}>{svc.description}</div>
                      )}
                      <div className={`small fw-medium ${sel ? 'text-white' : 'text-primary'}`}>
                        {/* {serviceFeeHint(fees, svc.name)} */}
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, [svc.name]) ||
                          feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, [svc.name])
                            ? <><i className="fas fa-circle-info me-1" />May include a one-time fee — see total below</>
                            : 'No extra fees'}
                        </div>
                      </div>
                    </div>
                    <div className={`d-flex align-items-center justify-content-center flex-shrink-0 ${sel ? 'bg-white text-primary' : 'border'}`}
                      style={{ width: 22, height: 22, borderRadius: 6, fontSize: 12 }}>
                      {sel && <i className="fas fa-check" />}
                    </div>
                  </div>
                );
              })}
              
            {form.services.length > 0 && totalAmount > 0 && (
              <div className="alert alert-info py-2 small mt-3 mb-0">
                <i className="fas fa-info-circle me-2" />
                A one-time fee of <strong>{formatNGN(totalAmount)}</strong> applies to this request —
                not per service, charged once for your whole order.
              </div>
            )}

              {services.length === 0 && (
                <div className="text-muted small">No fashion services have been configured yet — please contact your admin.</div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <h6 className="fw-semibold mb-3 text-dark">Garment Details</h6>
          <div className="bg-white rounded-3 border border-light shadow-sm p-4">
            <div className="mb-3">
              <label className="form-label small fw-medium text-dark">Item / Garment Name *</label>
              <input
                className="form-control border-light"
                placeholder="e.g. Aso-Oke Senator Suit, Wedding Guest Gown..."
                value={form.item_name}
                onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium text-dark">Fabric Source</label>
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
              <label className="form-label small fw-medium text-dark">Measurements (inches) — optional</label>
              <div className="row g-2">
                {MEASUREMENT_KEYS.map(k => (
                  <div key={k} className="col-4">
                    <label className="form-label text-capitalize" style={{ fontSize: 11 }}>{k}</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        className="form-control border-light"
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

            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label small fw-medium text-dark">Preferred Consultation Date</label>
                <input type="date" className="form-control border-light" value={form.consultation_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, consultation_date: e.target.value }))} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small fw-medium text-dark">Preferred Time</label>
                <select className="form-select border-light" value={form.consultation_time}
                  onChange={e => setForm(p => ({ ...p, consultation_time: e.target.value }))}>
                  <option value="">Select time…</option>
                  {CONSULTATION_TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium text-dark">Preferred Delivery Date</label>
              <input type="date" className="form-control border-light" value={form.preferred_delivery}
                min={form.consultation_date || new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, preferred_delivery: e.target.value }))} />
            </div>

            <div>
              <label className="form-label small fw-medium text-dark">Your Address / Location *</label>
              <input className="form-control border-light" placeholder="Full address for consultation visit..."
                value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h6 className="fw-semibold mb-3 text-dark">Inspiration & Details</h6>
          <div className="bg-white rounded-3 border border-light shadow-sm p-4">
            <div className="mb-4">
              <label className="form-label small fw-medium text-dark">Inspiration Images / Videos</label>
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
              <label className="form-label small fw-medium text-dark">Description / Instructions</label>
              <textarea
                className="form-control border-light"
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
          <h6 className="fw-semibold mb-3 text-dark">Request Summary</h6>
          <div className="bg-white rounded-3 border border-light shadow-sm p-4 mb-3">
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Service(s)</span>
              <span className="small fw-medium text-dark text-end" style={{ maxWidth: '60%' }}>{form.services.join(', ')}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Item</span>
              <span className="small fw-medium text-dark">{form.item_name}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Fabric</span>
              <span className="small fw-medium text-dark">{form.fabric_source === 'customer' ? 'Customer providing' : 'Stitch sourcing'}</span>
            </div>
            {form.consultation_date && (
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Consultation</span>
                <span className="small fw-medium text-dark">{form.consultation_date}{form.consultation_time && ` · ${form.consultation_time}`}</span>
              </div>
            )}
            {form.preferred_delivery && (
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Target Delivery</span>
                <span className="small fw-medium text-dark">{form.preferred_delivery}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-muted">Address</span>
              <span className="small fw-medium text-dark text-end" style={{ maxWidth: '60%' }}>{form.address}</span>
            </div>
            {form.files.length > 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Attachments</span>
                <span className="small fw-medium text-dark">{form.files.length} file(s)</span>
              </div>
            )}

            {/* ── Fee breakdown — driven by the same fees/calcFashionFees used on step 0 ── */}
            <div className="mt-3 pt-3 border-top border-light">
              {consultationFee > 0 && (
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Consultation fee</span>
                  <span className="text-dark">{formatNGN(consultationFee)}</span>
                </div>
              )}
              {materialPickupFee > 0 && (
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Material pickup fee</span>
                  <span className="text-dark">{formatNGN(materialPickupFee)}</span>
                </div>
              )}
              {totalAmount === 0 && (
                <div className="text-success small mb-1">
                  <i className="fas fa-check-circle me-1" />No extra fees for the selected service(s).
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold border-top border-light pt-2 mt-1">
                <span className="text-dark">Total</span>
                <span className="text-primary fs-5">{formatNGN(totalAmount)}</span>
              </div>
            </div>

            {Object.values(form.measurements).some(v => v) && (
              <div className="mt-3 pt-3 border-top border-light">
                <div className="text-muted small mb-2">Measurements</div>
                <div className="row g-2">
                  {Object.entries(form.measurements).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="col-4">
                      <div className="bg-light rounded-2 p-2 text-center">
                        <div className="fw-bold small text-dark">{v}"</div>
                        <div className="text-muted text-capitalize" style={{ fontSize: 10 }}>{k}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="alert alert-info small border-0 bg-info bg-opacity-10 text-info-emphasis">
            <i className="fas fa-calendar-check me-2" />
            Our team will reach out within 24 hours to schedule your consultation.
            {totalAmount > 0 && (
              <> A fee of <strong>{formatNGN(totalAmount)}</strong> applies{materialPickupFee > 0 ? ' for consultation and material pickup' : ' for the initial consultation'}.</>
            )}
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between mt-4 pt-2">
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
              : <><i className="fas fa-paper-plane me-2" />Submit Request{totalAmount > 0 ? ` • ${formatNGN(totalAmount)}` : ''}</>}
          </button>
        )}
      </div>
    </div>
  );
}
