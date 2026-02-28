import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockPathname = '/points';
const mockSearchParams = new URLSearchParams('');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

import { MeridianFilterBar, MERIDIANS } from '@/components/point/MeridianFilterBar';

describe('MeridianFilterBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders All button', () => {
    render(<MeridianFilterBar />);
    expect(screen.getByRole('button', { name: /^all$/i })).toBeTruthy();
  });

  it('renders all 15 meridian buttons', () => {
    render(<MeridianFilterBar />);
    for (const m of MERIDIANS) {
      expect(screen.getByRole('button', { name: new RegExp(`^${m}$`, 'i') })).toBeTruthy();
    }
  });

  it('All button is active (aria-pressed=true) when no activeMeridian', () => {
    render(<MeridianFilterBar />);
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('marks correct meridian button as active', () => {
    render(<MeridianFilterBar activeMeridian="Lung" />);
    const lungBtn = screen.getByRole('button', { name: /^lung$/i });
    expect(lungBtn.getAttribute('aria-pressed')).toBe('true');
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking All pushes URL without meridian param', () => {
    render(<MeridianFilterBar activeMeridian="Stomach" />);
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('meridian='));
  });

  it('clicking a meridian pushes URL with meridian param', () => {
    render(<MeridianFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /^stomach$/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('meridian=Stomach'));
  });

  it('clicking the active meridian deactivates it (passes null)', () => {
    render(<MeridianFilterBar activeMeridian="Lung" />);
    fireEvent.click(screen.getByRole('button', { name: /^lung$/i }));
    // Should navigate to URL without meridian param
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('meridian='));
  });

  it('shows count labels when counts prop is provided', () => {
    render(<MeridianFilterBar counts={{ Lung: 11, Stomach: 45 }} />);
    expect(screen.getByText('11')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
  });

  it('does not render counts when counts prop is absent', () => {
    render(<MeridianFilterBar />);
    // No numeric count spans; check no '11' or '45' appears
    expect(screen.queryByText('11')).toBeNull();
  });
});
