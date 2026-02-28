import { render, screen } from '@testing-library/react';
import { HerbPairingsSection } from '@/components/herb/HerbPairingsSection';
import type { HerbPairing } from '@/types/drupal';

const BASE_PAIRING: HerbPairing = {
  id: 'pair-1',
  type: 'paragraph--herb_pairing',
  field_partner_herb: {
    id: 'herb-2',
    type: 'node--herb',
    title: 'Huang Qi',
    field_herb_pinyin_name: 'Huáng Qí',
    field_herb_chinese_name: '黄芪',
  },
  field_synergistic_action: 'Together they strongly tonify Qi and raise Yang.',
  field_example_formula: {
    id: 'form-1',
    type: 'node--formula',
    title: 'Bu Zhong Yi Qi Tang',
  },
};

describe('HerbPairingsSection', () => {
  it('renders null for empty pairings array', () => {
    const { container } = render(<HerbPairingsSection pairings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders partner herb name', () => {
    render(<HerbPairingsSection pairings={[BASE_PAIRING]} />);
    expect(screen.getByText(/Huang Qi/)).toBeTruthy();
  });

  it('renders pinyin and Chinese name via herbDisplayName', () => {
    render(<HerbPairingsSection pairings={[BASE_PAIRING]} />);
    // herbDisplayName produces "Huang Qi (Huáng Qí / 黄芪)"
    expect(screen.getByText(/Huáng Qí/)).toBeTruthy();
  });

  it('renders synergistic action text', () => {
    render(<HerbPairingsSection pairings={[BASE_PAIRING]} />);
    expect(screen.getByText(/tonify Qi/)).toBeTruthy();
  });

  it('renders example formula link', () => {
    render(<HerbPairingsSection pairings={[BASE_PAIRING]} />);
    expect(screen.getByText('Bu Zhong Yi Qi Tang')).toBeTruthy();
    const link = screen.getByText('Bu Zhong Yi Qi Tang').closest('a')!;
    expect(link.getAttribute('href')).toBe('/formulas/form-1');
  });

  it('renders section heading', () => {
    render(<HerbPairingsSection pairings={[BASE_PAIRING]} />);
    expect(screen.getByText('Herb Pairings')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: HerbPairing = {
      id: 'pair-min',
      type: 'paragraph--herb_pairing',
      field_partner_herb: {
        id: 'herb-x',
        type: 'node--herb',
        title: 'Ren Shen',
      },
    };
    render(<HerbPairingsSection pairings={[minimal]} />);
    expect(screen.getByText(/Ren Shen/)).toBeTruthy();
    expect(screen.queryByText('Bu Zhong Yi Qi Tang')).toBeNull();
  });
});
