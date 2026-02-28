import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockPathname = '/patterns';
const mockSearchParams = new URLSearchParams('');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

import { OrganSystemFilterBar, ORGAN_SYSTEMS } from '@/components/pattern/OrganSystemFilterBar';

describe('OrganSystemFilterBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders All button', () => {
    render(<OrganSystemFilterBar />);
    expect(screen.getByRole('button', { name: /^all$/i })).toBeTruthy();
  });

  it('renders all 14 organ system buttons', () => {
    render(<OrganSystemFilterBar />);
    for (const organ of ORGAN_SYSTEMS) {
      expect(screen.getByRole('button', { name: new RegExp(`^${organ}$`, 'i') })).toBeTruthy();
    }
  });

  it('All button is active (aria-pressed=true) when no activeOrganSystem', () => {
    render(<OrganSystemFilterBar />);
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('marks correct organ button as active', () => {
    render(<OrganSystemFilterBar activeOrganSystem="Spleen" />);
    const spleenBtn = screen.getByRole('button', { name: /^spleen$/i });
    expect(spleenBtn.getAttribute('aria-pressed')).toBe('true');
    const allBtn = screen.getByRole('button', { name: /^all$/i });
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking All pushes URL without organSystem param', () => {
    render(<OrganSystemFilterBar activeOrganSystem="Spleen" />);
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('organSystem='));
  });

  it('clicking an organ system pushes URL with organSystem param', () => {
    render(<OrganSystemFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /^liver$/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('organSystem=Liver'));
  });

  it('clicking the active organ system deactivates it (clears filter)', () => {
    render(<OrganSystemFilterBar activeOrganSystem="Kidney" />);
    fireEvent.click(screen.getByRole('button', { name: /^kidney$/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('organSystem='));
  });

  it('shows count labels when counts prop is provided', () => {
    render(<OrganSystemFilterBar counts={{ Spleen: 12, Liver: 8 }} />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('does not render counts when counts prop is absent', () => {
    render(<OrganSystemFilterBar />);
    expect(screen.queryByText('12')).toBeNull();
  });
});
