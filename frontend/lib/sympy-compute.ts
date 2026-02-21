/**
 * SymPy Compute Service Client
 * Communicates with the Python FastAPI microservice for symbolic math
 */

const SYMPY_SERVICE_URL = process.env.SYMPY_SERVICE_URL || 'http://localhost:8001';
const SYMPY_API_KEY = process.env.SYMPY_API_KEY;

// --- Request Types ---

export interface SymbolicComputeRequest {
  operation: 'solve' | 'simplify' | 'diff' | 'integrate' | 'convert_units';
  expression: string;
  variables?: Record<string, string>;
  assumptions?: Record<string, boolean>;
}

export interface DosageComputeRequest {
  herb_name: string;
  body_weight_kg: number;
  dose_per_kg_mg: number;
  constraints?: {
    max_daily_mg?: number;
    interaction_factor?: number;
  };
  age_years?: number;
  form?: 'powder' | 'tincture' | 'capsule' | 'tea' | 'decoction' | 'extract';
}

// --- Response Types ---

export interface SymbolicComputeResponse {
  result: string;
  latex: string;
  numeric: number | null;
  unit: string | null;
  cached: boolean;
}

export interface ConstraintDetail {
  constraint: string;
  limit: number;
  actual: number;
  status: 'ok' | 'exceeded';
}

export interface DosageComputeResponse {
  daily_dose_mg: number;
  per_dose_mg: number;
  doses_per_day: number;
  within_safety_limits: boolean;
  constraint_details: ConstraintDetail[];
  latex: string;
  cached: boolean;
}

export interface HealthResponse {
  status: string;
  sympy_version: string;
  cache_connected: boolean;
  uptime_seconds: number;
}

// --- Client Functions ---

/**
 * Perform a symbolic computation (solve, simplify, diff, integrate, convert_units)
 */
export async function computeSymbolic(
  request: SymbolicComputeRequest
): Promise<SymbolicComputeResponse> {
  if (!SYMPY_API_KEY) {
    throw new Error('SYMPY_API_KEY is not configured');
  }

  const response = await fetch(`${SYMPY_SERVICE_URL}/compute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SYMPY_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(`SymPy compute error: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * Compute dosage with safety constraints
 */
export async function computeDosage(
  request: DosageComputeRequest
): Promise<DosageComputeResponse> {
  if (!SYMPY_API_KEY) {
    throw new Error('SYMPY_API_KEY is not configured');
  }

  const response = await fetch(`${SYMPY_SERVICE_URL}/dosage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': SYMPY_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(`SymPy dosage error: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * Check SymPy service health
 */
export async function checkSymPyHealth(): Promise<HealthResponse> {
  const response = await fetch(`${SYMPY_SERVICE_URL}/health`);

  if (!response.ok) {
    throw new Error(`SymPy health check failed: ${response.statusText}`);
  }

  return response.json();
}
