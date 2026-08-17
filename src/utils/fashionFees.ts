// src/utils/fashionFees.ts — the ONE place that decides whether a fee applies
import type { FashionFees } from '@/types/index.ts';
import { formatNGN } from '../services/mockData';

export function feeApplies(enabled: boolean, appliesTo: string[] | null, selected: string[]): boolean {
  if (!enabled) return false;
  if (!appliesTo || appliesTo.length === 0) return true; // no restriction = applies to all
  return selected.some(s => appliesTo.includes(s));
}

export function calcFashionFees(fees: FashionFees, selectedServices: string[]) {
  const consultation = feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, selectedServices) ? fees.consultation_fee : 0;
  const materialPickup = feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, selectedServices) ? fees.material_pickup_fee : 0;
  return { consultation, materialPickup, total: consultation + materialPickup };
}

// Used by both the per-service hint badge AND the final summary — one function, one truth.

export function serviceFeeHint(fees: FashionFees, serviceName: string): string {
  const parts: string[] = [];
  if (feeApplies(fees.consultation_fee_enabled, fees.consultation_applies_to, [serviceName])) {
    parts.push(`${formatNGN(fees.consultation_fee)} consultation`);
  }
  if (feeApplies(fees.material_pickup_fee_enabled, fees.material_pickup_applies_to, [serviceName])) {
    parts.push(`${formatNGN(fees.material_pickup_fee)} pickup`);
  }
  return parts.length > 0 ? `+${parts.join(' + ')}` : 'No extra fees';
}
