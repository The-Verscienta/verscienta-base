import useSWRMutation from 'swr/mutation';
import { apiFetch } from '@/lib/api-client';
import type { DosageComputeResponse } from '@/lib/sympy-compute';

export interface VerificationPayload {
  herb_name: string;
  body_weight_kg: number;
  dose_per_kg_mg: number;
  age_years?: number;
  formula_id?: string;
  constraints?: {
    max_daily_mg?: number;
    interaction_factor?: number;
  };
}

async function fetchVerification(
  _key: string,
  { arg }: { arg: VerificationPayload }
): Promise<DosageComputeResponse> {
  const response = await apiFetch('/api/symbolic-compute', {
    method: 'POST',
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  const data = await response.json();
  return data as DosageComputeResponse;
}

export function useSymbolicVerification() {
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    'symbolic-verification',
    fetchVerification
  );

  return {
    verify: trigger,
    result: data ?? null,
    error: error ? (error instanceof Error ? error.message : 'An unexpected error occurred') : null,
    loading: isMutating,
    reset,
  };
}
