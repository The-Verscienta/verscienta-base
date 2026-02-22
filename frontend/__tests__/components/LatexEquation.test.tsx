import { render, screen } from '@testing-library/react';
import { LatexEquation } from '@/components/ui/LatexEquation';

describe('LatexEquation', () => {
  it('renders valid LaTeX as HTML', () => {
    const { container } = render(<LatexEquation latex="x^2 + y^2" />);
    // KaTeX wraps output in .katex class
    const katexEl = container.querySelector('.katex');
    expect(katexEl).toBeTruthy();
  });

  it('falls back to plain text for invalid LaTeX', () => {
    render(<LatexEquation latex="\invalid{broken" />);
    const codeEl = screen.getByText('\\invalid{broken');
    expect(codeEl.tagName).toBe('CODE');
  });

  it('renders in display mode when specified', () => {
    const { container } = render(<LatexEquation latex="x^2" displayMode />);
    const displayEl = container.querySelector('.katex-display');
    expect(displayEl).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<LatexEquation latex="x" className="my-custom" />);
    const span = container.firstElementChild;
    expect(span?.className).toContain('my-custom');
  });

  it('renders empty string gracefully', () => {
    const { container } = render(<LatexEquation latex="" />);
    const katexEl = container.querySelector('.katex');
    expect(katexEl).toBeTruthy();
  });
});
