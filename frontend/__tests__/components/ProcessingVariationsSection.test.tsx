import { render, screen } from '@testing-library/react';
import { ProcessingVariationsSection } from '@/components/herb/ProcessingVariationsSection';
import type { HerbProcessing } from '@/types/drupal';

const BASE_VARIATION: HerbProcessing = {
  id: 'proc-1',
  type: 'paragraph--herb_processing',
  field_processing_method: 'Honey-fried (Zhi Mi)',
  field_processing_effect: 'Strengthens the Spleen-supplementing effects; reduces its drying nature.',
  field_processing_indication_change: 'Preferred when treating Spleen-Qi deficiency with loose stools.',
};

describe('ProcessingVariationsSection', () => {
  it('renders null for empty variations array', () => {
    const { container } = render(<ProcessingVariationsSection variations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section heading', () => {
    render(<ProcessingVariationsSection variations={[BASE_VARIATION]} />);
    expect(screen.getByText(/Processing Variations/)).toBeTruthy();
  });

  it('renders processing method as badge', () => {
    render(<ProcessingVariationsSection variations={[BASE_VARIATION]} />);
    expect(screen.getByText('Honey-fried (Zhi Mi)')).toBeTruthy();
  });

  it('renders effect on properties text', () => {
    render(<ProcessingVariationsSection variations={[BASE_VARIATION]} />);
    expect(screen.getByText(/Strengthens the Spleen/)).toBeTruthy();
  });

  it('renders indication change text', () => {
    render(<ProcessingVariationsSection variations={[BASE_VARIATION]} />);
    expect(screen.getByText(/loose stools/)).toBeTruthy();
  });

  it('renders multiple variations', () => {
    const second: HerbProcessing = {
      id: 'proc-2',
      type: 'paragraph--herb_processing',
      field_processing_method: 'Salt-processed (Yan Zhi)',
      field_processing_effect: 'Directs the herb to the Kidney channel.',
    };
    render(<ProcessingVariationsSection variations={[BASE_VARIATION, second]} />);
    expect(screen.getByText('Honey-fried (Zhi Mi)')).toBeTruthy();
    expect(screen.getByText('Salt-processed (Yan Zhi)')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: HerbProcessing = {
      id: 'proc-min',
      type: 'paragraph--herb_processing',
      field_processing_method: 'Raw (Sheng)',
    };
    render(<ProcessingVariationsSection variations={[minimal]} />);
    expect(screen.getByText('Raw (Sheng)')).toBeTruthy();
    expect(screen.queryByText(/Effect on Properties/)).toBeNull();
    expect(screen.queryByText(/Indication Change/)).toBeNull();
  });
});
