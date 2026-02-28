import { render, screen } from '@testing-library/react';
import { JiaJianSection } from '@/components/formula/JiaJianSection';
import type { FormulaModification } from '@/types/drupal';

const BASE_MOD: FormulaModification = {
  id: 'mod-1',
  type: 'paragraph--formula_modification',
  field_modification_condition: 'If Dampness-Heat is pronounced',
  field_modification_action: 'add',
  field_modification_herb: {
    id: 'herb-1',
    type: 'node--herb',
    title: 'Huang Lian',
    field_herb_pinyin_name: 'Huáng Lián',
  },
  field_modification_amount: '6g',
  field_modification_note: 'Reduces heat toxins effectively',
};

describe('JiaJianSection', () => {
  it('renders null for empty modifications array', () => {
    const { container } = render(<JiaJianSection modifications={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section title with Chinese characters', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    expect(screen.getByText(/Formula Modifications/)).toBeTruthy();
    expect(screen.getByText(/加减/)).toBeTruthy();
  });

  it('renders condition text', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    expect(screen.getByText('If Dampness-Heat is pronounced')).toBeTruthy();
  });

  it('renders add action badge with green styling', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    const badge = screen.getByText('Add');
    expect(badge.className).toMatch(/green/);
  });

  it('renders remove action badge with red styling', () => {
    const mod: FormulaModification = { ...BASE_MOD, id: 'mod-2', field_modification_action: 'remove' };
    render(<JiaJianSection modifications={[mod]} />);
    const badge = screen.getByText('Remove');
    expect(badge.className).toMatch(/red/);
  });

  it('renders increase action badge with blue styling', () => {
    const mod: FormulaModification = { ...BASE_MOD, id: 'mod-3', field_modification_action: 'increase' };
    render(<JiaJianSection modifications={[mod]} />);
    const badge = screen.getByText('Increase');
    expect(badge.className).toMatch(/blue/);
  });

  it('renders decrease action badge with amber styling', () => {
    const mod: FormulaModification = { ...BASE_MOD, id: 'mod-4', field_modification_action: 'decrease' };
    render(<JiaJianSection modifications={[mod]} />);
    const badge = screen.getByText('Decrease');
    expect(badge.className).toMatch(/amber/);
  });

  it('renders herb name and pinyin', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    expect(screen.getByText(/Huang Lian/)).toBeTruthy();
    expect(screen.getByText(/Huáng Lián/)).toBeTruthy();
  });

  it('renders modification amount', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    expect(screen.getByText('6g')).toBeTruthy();
  });

  it('renders note text', () => {
    render(<JiaJianSection modifications={[BASE_MOD]} />);
    expect(screen.getByText('Reduces heat toxins effectively')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: FormulaModification = {
      id: 'mod-min',
      type: 'paragraph--formula_modification',
      field_modification_action: 'add',
      field_modification_herb: {
        id: 'herb-x',
        type: 'node--herb',
        title: 'Bai Zhu',
      },
    };
    render(<JiaJianSection modifications={[minimal]} />);
    expect(screen.getByText(/Bai Zhu/)).toBeTruthy();
    expect(screen.queryByText('If Dampness-Heat is pronounced')).toBeNull();
  });
});
