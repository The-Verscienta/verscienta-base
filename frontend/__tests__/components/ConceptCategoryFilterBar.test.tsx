import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js router hooks
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/concepts',
  useSearchParams: () => new URLSearchParams(),
}));

import { ConceptCategoryFilterBar, CONCEPT_CATEGORIES } from '@/components/concept/ConceptCategoryFilterBar';

describe('ConceptCategoryFilterBar', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders All button', () => {
    render(<ConceptCategoryFilterBar />);
    expect(screen.getByText('All')).toBeTruthy();
  });

  it('renders all 6 category buttons', () => {
    render(<ConceptCategoryFilterBar />);
    for (const cat of CONCEPT_CATEGORIES) {
      expect(screen.getByText(cat)).toBeTruthy();
    }
  });

  it('All button has aria-pressed=true when no category is active', () => {
    render(<ConceptCategoryFilterBar />);
    const allBtn = screen.getByText('All').closest('button')!;
    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('active category button has aria-pressed=true', () => {
    render(<ConceptCategoryFilterBar activeCategory="Fundamental Substances" />);
    const btn = screen.getByText('Fundamental Substances').closest('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('clicking All clears the category param', () => {
    render(<ConceptCategoryFilterBar activeCategory="Five Element Theory" />);
    fireEvent.click(screen.getByText('All'));
    expect(mockPush).toHaveBeenCalledWith('/concepts?');
  });

  it('clicking a category sets the param', () => {
    render(<ConceptCategoryFilterBar />);
    fireEvent.click(screen.getByText('Pathogenic Factors'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('category=Pathogenic+Factors')
    );
  });

  it('clicking an active category deactivates it (sets to All)', () => {
    render(<ConceptCategoryFilterBar activeCategory="Treatment Methods" />);
    fireEvent.click(screen.getByText('Treatment Methods'));
    expect(mockPush).toHaveBeenCalledWith('/concepts?');
  });

  it('shows counts when provided', () => {
    render(
      <ConceptCategoryFilterBar
        counts={{ 'Fundamental Substances': 12, 'Pathogenic Factors': 8 }}
      />
    );
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });
});
