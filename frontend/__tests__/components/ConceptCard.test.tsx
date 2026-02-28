import { render, screen } from '@testing-library/react';
import { ConceptCard } from '@/components/concept/ConceptCard';
import type { TcmConceptListItem } from '@/types/drupal';

const BASE_CONCEPT: TcmConceptListItem = {
  id: 'con-1',
  title: 'Qi',
  chineseName: '气',
  pinyinName: 'Qì',
  category: 'Fundamental Substances',
  popularity: 'staple',
  editorsPick: true,
};

describe('ConceptCard', () => {
  it('renders English title', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('Qi')).toBeTruthy();
  });

  it('renders Chinese name', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('气')).toBeTruthy();
  });

  it('renders pinyin name', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('Qì')).toBeTruthy();
  });

  it('renders category tag', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('Fundamental Substances')).toBeTruthy();
  });

  it("shows ★ Pick badge for editor's pick", () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('★ Pick')).toBeTruthy();
  });

  it("does not show ★ Pick badge when editorsPick is false", () => {
    render(<ConceptCard concept={{ ...BASE_CONCEPT, editorsPick: false }} />);
    expect(screen.queryByText('★ Pick')).toBeNull();
  });

  it('links to the correct concept detail page', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/concepts/con-1');
  });

  it('renders Explore Concept text', () => {
    render(<ConceptCard concept={BASE_CONCEPT} />);
    expect(screen.getByText('Explore Concept')).toBeTruthy();
  });

  it('does not show Chinese name when absent', () => {
    render(<ConceptCard concept={{ ...BASE_CONCEPT, chineseName: undefined }} />);
    expect(screen.queryByText('气')).toBeNull();
  });

  it('does not show category tag when category is absent', () => {
    render(<ConceptCard concept={{ ...BASE_CONCEPT, category: undefined }} />);
    expect(screen.queryByText('Fundamental Substances')).toBeNull();
  });

  it('handles minimal concept without optional fields', () => {
    const minimal: TcmConceptListItem = { id: 'con-min', title: 'Blood' };
    render(<ConceptCard concept={minimal} />);
    expect(screen.getByText('Blood')).toBeTruthy();
    expect(screen.queryByText('★ Pick')).toBeNull();
  });
});
