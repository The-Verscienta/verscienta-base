// Set feature flag before any imports
process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE = 'true';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoseCalculator } from '@/components/herb/DoseCalculator';

const mockApiFetch = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const MOCK_RESULT = {
  daily_dose_mg: 750,
  per_dose_mg: 250,
  doses_per_day: 3,
  within_safety_limits: true,
  constraint_details: [],
  latex: '750 \\text{ mg}',
  cached: false,
};

describe('DoseCalculator', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('renders when feature flag is set', () => {
    render(<DoseCalculator herbName="Ginger" />);
    expect(screen.getByText(/weight-based dose calculator/i)).toBeTruthy();
  });

  it('renders weight input placeholder', () => {
    render(<DoseCalculator herbName="Ginger" />);
    expect(screen.getByPlaceholderText(/weight \(kg\)/i)).toBeTruthy();
  });

  it('renders age group select with options', () => {
    render(<DoseCalculator herbName="Ginger" />);
    expect(screen.getByText('Adult')).toBeTruthy();
    expect(screen.getByText(/child/i)).toBeTruthy();
    expect(screen.getByText(/adolescent/i)).toBeTruthy();
    expect(screen.getByText(/elderly/i)).toBeTruthy();
  });

  it('renders dosage form select', () => {
    render(<DoseCalculator herbName="Ginger" />);
    expect(screen.getByText('Powder')).toBeTruthy();
  });

  it('toggles unit label on button click', () => {
    render(<DoseCalculator herbName="Ginger" />);
    // Initially shows "kg → lbs"
    expect(screen.getByText(/kg → lbs/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/kg → lbs/i));
    // After click shows lbs → kg and placeholder changes
    expect(screen.getByText(/lbs → kg/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/weight \(lbs\)/i)).toBeTruthy();
  });

  it('shows result after successful calculation', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESULT,
    });

    render(<DoseCalculator herbName="Ginger" />);
    fireEvent.change(screen.getByPlaceholderText(/weight \(kg\)/i), { target: { value: '70' } });
    fireEvent.click(screen.getByText('Calculate Dose'));

    await waitFor(() => {
      expect(screen.getByText('750')).toBeTruthy(); // daily_dose_mg
      expect(screen.getByText('250')).toBeTruthy(); // per_dose_mg
      expect(screen.getByText('3×')).toBeTruthy();  // doses_per_day
      expect(screen.getByText(/within standard safety limits/i)).toBeTruthy();
    });
  });

  it('shows safety warning when limits exceeded', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...MOCK_RESULT, within_safety_limits: false }),
    });

    render(<DoseCalculator herbName="Ginger" />);
    fireEvent.change(screen.getByPlaceholderText(/weight \(kg\)/i), { target: { value: '70' } });
    fireEvent.click(screen.getByText('Calculate Dose'));

    await waitFor(() => {
      expect(screen.getByText(/exceeds standard safety limits/i)).toBeTruthy();
    });
  });

  it('shows error message on failed fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Service unavailable' }),
    });

    render(<DoseCalculator herbName="Ginger" />);
    fireEvent.change(screen.getByPlaceholderText(/weight \(kg\)/i), { target: { value: '70' } });
    fireEvent.click(screen.getByText('Calculate Dose'));

    await waitFor(() => {
      expect(screen.getByText('Service unavailable')).toBeTruthy();
    });
  });

  it('shows error for invalid weight', async () => {
    const { container } = render(<DoseCalculator herbName="Ginger" />);
    fireEvent.change(screen.getByPlaceholderText(/weight \(kg\)/i), { target: { value: '-5' } });
    // Use fireEvent.submit to bypass HTML5 min="1" constraint validation in jsdom
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/valid weight/i)).toBeTruthy();
    });
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
