import { render, screen, fireEvent } from '@testing-library/react';
import { QRCodeModal } from '@/components/ui/QRCodeModal';

// Mock react-qr-code (must include __esModule:true for default import interop)
jest.mock('react-qr-code', () => {
  const MockQRCode = ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value} />
  );
  return { __esModule: true, default: MockQRCode };
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

describe('QRCodeModal', () => {
  it('renders the QR button', () => {
    render(<QRCodeModal title="Ginger" />);
    expect(screen.getByRole('button', { name: /show qr code/i })).toBeTruthy();
    expect(screen.getByText('QR')).toBeTruthy();
  });

  it('modal is not visible initially', () => {
    render(<QRCodeModal title="Ginger" />);
    expect(screen.queryByTestId('qr-code')).toBeNull();
  });

  it('opens modal on button click', () => {
    render(<QRCodeModal title="Ginger" />);
    fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
    expect(screen.getByTestId('qr-code')).toBeTruthy();
    expect(screen.getByText('Share')).toBeTruthy();
  });

  it('shows title inside modal', () => {
    render(<QRCodeModal title="Asian Ginseng" />);
    fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
    expect(screen.getByText('Asian Ginseng')).toBeTruthy();
  });

  it('shows Copy Link and SVG buttons in modal', () => {
    render(<QRCodeModal title="Ginger" />);
    fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
    expect(screen.getByText('Copy Link')).toBeTruthy();
    expect(screen.getByText('SVG')).toBeTruthy();
  });

  it('closes modal when close button clicked', () => {
    render(<QRCodeModal title="Ginger" />);
    fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
    expect(screen.getByTestId('qr-code')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByTestId('qr-code')).toBeNull();
  });

  it('uses provided url prop when given', () => {
    render(<QRCodeModal title="Test" url="https://example.com/herbs/123" />);
    fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
    const qr = screen.getByTestId('qr-code');
    expect(qr.getAttribute('data-value')).toBe('https://example.com/herbs/123');
  });
});
