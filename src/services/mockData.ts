// services/mockData.ts — Stitch Platform UI constants
//
// This used to hold hardcoded sample data for every resource in the app.
// All pages now fetch real data from the backend via services/api.ts, so
// this file only keeps the handful of genuinely static UI constants that
// mirror backend enums (app/enums/stitch.py) — not sample records.

export const LAUNDRY_STATUSES = [
  'Received', 'Sorted', 'Washing', 'Drying', 'Ironing',
  'Folding', 'Packing', 'Ready For Delivery', 'Out For Delivery', 'Delivered', 'Completed',
] as const;

export const FASHION_STATUSES = [
  'Consultation', 'Measurement', 'Design Approval', 'Production',
  'Fitting', 'Adjustments', 'Ready', 'Delivery', 'Completed',
] as const;

export const FASHION_SERVICE_TYPES = [
  'Custom Tailoring', 'Alteration', 'Repair',
  'Bespoke Design', 'Material Pickup', 'Design Consultation',
] as const;

export const INVENTORY_CATEGORIES = [
  'Detergent', 'Chemical', 'Packaging',
  'Fashion Material', 'Accessory', 'Equipment', 'Other',
] as const;

export const PLAN_INTERVALS = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'] as const;

export const STATUS_BADGE_MAP: Record<string, string> = {
  'Received': 'badge-received', 'Sorted': 'badge-sorted', 'Washing': 'badge-washing',
  'Drying': 'badge-drying', 'Ironing': 'badge-ironing', 'Folding': 'badge-folding',
  'Packing': 'badge-packing', 'Ready For Delivery': 'badge-ready',
  'Out For Delivery': 'badge-out-for-delivery', 'Delivered': 'badge-delivered',
  'Completed': 'badge-completed', 'Cancelled': 'badge-cancelled',
  'Consultation': 'badge-consultation', 'Measurement': 'badge-measurement',
  'Design Approval': 'badge-design-approval', 'Production': 'badge-production',
  'Fitting': 'badge-fitting', 'Adjustments': 'badge-adjustments',
  'Ready': 'badge-ready', 'Delivery': 'badge-out-for-delivery',
};

export const formatNGN = (amount: number | null | undefined): string =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};
