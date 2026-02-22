// Set env BEFORE any imports so the module-level const picks it up
process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE = 'true';

import { render, screen, fireEvent } from '@testing-library/react';
import { SymbolicVerifyButton } from '@/components/ui/SymbolicVerifyButton';

// Mock useToast
const mockToastSuccess = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    toast: jest.fn(),
    dismiss: jest.fn(),
    dismissAll: jest.fn(),
  }),
}));

// Mock apiFetch
const mockApiFetch = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock useSymbolicVerification
const mockVerify = jest.fn();
const mockReset = jest.fn();
let mockHookState = {
  result: null as any,
  error: null as string | null,
  loading: false,
};

jest.mock('@/hooks/useSymbolicVerification', () => ({
  useSymbolicVerification: () => ({
    verify: mockVerify,
    reset: mockReset,
    ...mockHookState,
  }),
}));

describe('SymbolicVerifyButton', () => {
  beforeEach(() => {
    mockVerify.mockReset();
    mockReset.mockReset();
    mockApiFetch.mockReset();
    mockToastSuccess.mockReset();
    mockHookState = { result: null, error: null, loading: false };
  });

  it('renders the Verify Dosage button', () => {
    render(<SymbolicVerifyButton herbId="Ginger" />);
    expect(screen.getByText('Verify Dosage')).toBeTruthy();
  });

  it('opens modal on button click', () => {
    render(<SymbolicVerifyButton herbId="Ginger" />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(screen.getByText('Dosage Verification')).toBeTruthy();
  });

  it('shows disclaimer banner inside modal', () => {
    render(<SymbolicVerifyButton herbId="Ginger" />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(screen.getByText(/Computational estimate only/)).toBeTruthy();
  });

  it('shows weight input form when no userWeightKg prop', () => {
    render(<SymbolicVerifyButton herbId="Ginger" />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(screen.getByLabelText(/Body weight/)).toBeTruthy();
    expect(screen.getByLabelText(/Age/)).toBeTruthy();
    expect(screen.getByText('Compute Dosage')).toBeTruthy();
  });

  it('calls verify immediately when userWeightKg is provided', () => {
    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(mockVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        herb_name: 'Ginger',
        body_weight_kg: 70,
        dose_per_kg_mg: 5,
      })
    );
  });

  it('shows loading state', () => {
    mockHookState.loading = true;
    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(screen.getByText('Computing precise dosage...')).toBeTruthy();
  });

  it('shows error state with retry button', () => {
    mockHookState.error = 'Service unavailable';
    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    expect(screen.getByText('Service unavailable')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('shows result with stat cards when data is available', () => {
    mockHookState.result = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: 'x^2',
      cached: false,
    };

    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));

    expect(screen.getByText('350.0')).toBeTruthy();
    expect(screen.getByText('116.7')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Within safety limits')).toBeTruthy();
  });

  it('shows safety exceeded badge when limits are exceeded', () => {
    mockHookState.result = {
      daily_dose_mg: 5000,
      per_dose_mg: 2500,
      doses_per_day: 2,
      within_safety_limits: false,
      constraint_details: [
        { constraint: 'Max daily', limit: 2000, actual: 5000, status: 'exceeded' },
      ],
      latex: '',
      cached: false,
    };

    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));

    expect(screen.getByText('Safety limits exceeded')).toBeTruthy();
    expect(screen.getByText('Exceeded')).toBeTruthy();
  });

  it('shows cached badge when result is cached', () => {
    mockHookState.result = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: '',
      cached: true,
    };

    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));

    expect(screen.getByText('Cached result')).toBeTruthy();
  });

  it('handles feedback and disables buttons', () => {
    mockApiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    mockHookState.result = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: '',
      cached: false,
    };

    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));

    const thumbsUp = screen.getByLabelText('Yes, this was helpful');
    fireEvent.click(thumbsUp);

    expect(mockToastSuccess).toHaveBeenCalledWith(
      'Thanks for your feedback!',
      'Glad this was helpful.'
    );

    // Both buttons should be disabled after feedback
    expect(thumbsUp).toBeDisabled();
    expect(screen.getByLabelText('No, this was not helpful')).toBeDisabled();
  });

  it('validates weight input before submitting', () => {
    render(<SymbolicVerifyButton herbId="Ginger" />);
    fireEvent.click(screen.getByText('Verify Dosage'));

    const weightInput = screen.getByLabelText(/Body weight/);
    fireEvent.change(weightInput, { target: { value: '-5' } });

    // Use fireEvent.submit to bypass browser HTML5 validation in jsdom
    const form = weightInput.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Please enter a valid weight in kg')).toBeTruthy();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('includes formulaId and constraints in payload', () => {
    render(
      <SymbolicVerifyButton
        herbId="Ginger"
        userWeightKg={70}
        userAge={35}
        formulaId="formula-1"
        selectedConstraints={['blood-thinner']}
      />
    );
    fireEvent.click(screen.getByText('Verify Dosage'));

    expect(mockVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        herb_name: 'Ginger',
        body_weight_kg: 70,
        dose_per_kg_mg: 5,
        age_years: 35,
        formula_id: 'formula-1',
        constraints: { max_daily_mg: 2000, interaction_factor: 1 },
      })
    );
  });

  it('sends feedback to API on thumbs down', () => {
    mockApiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    mockHookState.result = {
      daily_dose_mg: 350,
      per_dose_mg: 116.7,
      doses_per_day: 3,
      within_safety_limits: true,
      constraint_details: [],
      latex: '',
      cached: false,
    };

    render(<SymbolicVerifyButton herbId="Ginger" userWeightKg={70} />);
    fireEvent.click(screen.getByText('Verify Dosage'));
    fireEvent.click(screen.getByLabelText('No, this was not helpful'));

    expect(mockApiFetch).toHaveBeenCalledWith('/api/symbolic-feedback', {
      method: 'POST',
      body: expect.stringContaining('"rating":"down"'),
    });
  });
});
