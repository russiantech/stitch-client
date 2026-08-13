// src/utils/fashionFees.ts — the ONE place that decides whether a fee applies
import type { FashionFees, FashionServiceType } from '@/types/index.ts';

function feeApplies(enabled: boolean, appliesTo: FashionServiceType[] | null, selected: FashionServiceType[]): boolean {
  if (!enabled) return false;
  if (!appliesTo || appliesTo.length === 0) return true; // no restriction = applies to all
  return selected.some(s => appliesTo.includes(s));
}

export function calcFashionFees(fees: FashionFees, selectedServices: FashionServiceType[]) {
  const consultation = feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, selectedServices) ? fees.consultation_fee : 0;
  const materialPickup = feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, selectedServices) ? fees.material_pickup_fee : 0;
  return { consultation, materialPickup, total: consultation + materialPickup };
}

// Used by both the per-service hint badge AND the final summary — one function, one truth.
export function serviceFeeHint(fees: FashionFees, service: FashionServiceType): string {
  const parts: string[] = [];
  if (feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, [service])) {
    parts.push(`₦${fees.consultation_fee.toLocaleString()} consultation`);
  }
  if (feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, [service])) {
    parts.push(`₦${fees.material_pickup_fee.toLocaleString()} pickup`);
  }
  return parts.length > 0 ? parts.join(' + ') : 'No extra fees';
}

// FeeHint component — used inline on every service card
function FeeHint({ serviceType, fees }: { serviceType: FashionServiceType; fees: FashionFees | null }) {
  if (!fees) return null;
  return `<div className="text-muted" style={{ fontSize: 11 }}>{serviceFeeHint(fees, serviceType)}</div>`;
}
