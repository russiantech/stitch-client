// src/components/shared/FeeHint.tsx
import { serviceFeeHint } from '@/utils/fashionFees';
import type { FashionFees } from '@/types/index.ts';
// import { serviceFeeHint } from '@/utils/fashionFees.ts';

export function FeeHint({ serviceType, fees }: { serviceType: string; fees: FashionFees | null }) {
  if (!fees) return null;
  return <div className="text-muted" style={{ fontSize: 11 }}>{serviceFeeHint(fees, serviceType)}</div>;
}