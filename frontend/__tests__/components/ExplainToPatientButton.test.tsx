import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExplainToPatientButton } from '@/components/formula/ExplainToPatientButton';

const mockApiFetch = jest.fn();
jest.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Suppress window.print not being available in jsdom
Object.defineProperty(window, 'print', { value: jest.fn(), writable: true });

const DEFAULT_PROPS = {
  formulaName: 'Si Jun Zi Tang',
  ingredients: ['Ren Shen', 'Bai Zhu', 'Fu Ling', 'Gan Cao'],
  actions: 'Tonifies Qi',
  indications: 'Qi deficiency with fatigue',
};

describe('ExplainToPatientButton', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('renders the Explain to Patient button', () => {
    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    expect(screen.getByText('Explain to Patient')).toBeTruthy();
  });

  it('modal not visible initially', () => {
    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    expect(screen.queryByText('Patient Explanation')).toBeNull();
  });

  it('opens modal on click and shows loading spinner', async () => {
    // Never resolves so we can catch the loading state
    mockApiFetch.mockReturnValueOnce(new Promise(() => {}));

    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));

    await waitFor(() => {
      expect(screen.getByText('Patient Explanation')).toBeTruthy();
      expect(screen.getByText(/generating plain-english/i)).toBeTruthy();
    });
  });

  it('shows explanation text after successful fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ explanation: 'This formula supports your energy and digestion.' }),
    });

    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));

    await waitFor(() => {
      expect(screen.getByText('This formula supports your energy and digestion.')).toBeTruthy();
    });
  });

  it('shows Print and Copy buttons when explanation loaded', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ explanation: 'This formula helps with fatigue.' }),
    });

    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));

    await waitFor(() => {
      expect(screen.getByText('Print')).toBeTruthy();
      expect(screen.getByText('Copy')).toBeTruthy();
    });
  });

  it('shows error message on failed fetch', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'AI service unavailable.' }),
    });

    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));

    await waitFor(() => {
      expect(screen.getByText('AI service unavailable.')).toBeTruthy();
    });
  });

  it('shows generic error on network failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('network error'));

    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));

    await waitFor(() => {
      expect(screen.getByText(/unable to reach/i)).toBeTruthy();
    });
  });

  it('closes modal on close button click', async () => {
    mockApiFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<ExplainToPatientButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByText('Explain to Patient'));
    await waitFor(() => expect(screen.getByText('Patient Explanation')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Patient Explanation')).toBeNull();
  });
});
