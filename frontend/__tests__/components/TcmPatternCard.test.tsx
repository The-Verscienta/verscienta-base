import { render, screen } from '@testing-library/react';
import { TcmPatternCard } from '@/components/pattern/TcmPatternCard';
import type { TcmPatternListItem } from '@/types/drupal';

const BASE_PATTERN: TcmPatternListItem = {
  id: 'pat-1',
  title: 'Spleen Qi Deficiency',
  chineseName: '脾气虚',
  pinyinName: 'Pí Qì Xū',
  organSystem: 'Spleen',
  category: 'deficiency',
  temperature: 'neutral',
  popularity: 'staple',
  editorsPick: true,
};

describe('TcmPatternCard', () => {
  it('renders English title', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('Spleen Qi Deficiency')).toBeTruthy();
  });

  it('renders Chinese name', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('脾气虚')).toBeTruthy();
  });

  it('renders pinyin name', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('Pí Qì Xū')).toBeTruthy();
  });

  it('renders organ system tag', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('Spleen')).toBeTruthy();
  });

  it('renders category badge', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('deficiency')).toBeTruthy();
  });

  it('renders temperature badge', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('neutral')).toBeTruthy();
  });

  it("shows ★ Pick badge for editor's pick", () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('★ Pick')).toBeTruthy();
  });

  it("does not show ★ Pick badge when editorsPick is false", () => {
    render(<TcmPatternCard pattern={{ ...BASE_PATTERN, editorsPick: false }} />);
    expect(screen.queryByText('★ Pick')).toBeNull();
  });

  it('links to the correct pattern detail page', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/patterns/pat-1');
  });

  it('renders Explore Pattern text', () => {
    render(<TcmPatternCard pattern={BASE_PATTERN} />);
    expect(screen.getByText('Explore Pattern')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: TcmPatternListItem = {
      id: 'pat-min',
      title: 'Mystery Pattern',
    };
    render(<TcmPatternCard pattern={minimal} />);
    expect(screen.getByText('Mystery Pattern')).toBeTruthy();
    expect(screen.queryByText(/deficiency|excess|mixed/i)).toBeNull();
    expect(screen.queryByText(/cold|heat|neutral/i)).toBeNull();
  });

  it('does not show Chinese name when absent', () => {
    render(<TcmPatternCard pattern={{ ...BASE_PATTERN, chineseName: undefined }} />);
    expect(screen.queryByText('脾气虚')).toBeNull();
  });

  it('does not show organ tag when organSystem is absent', () => {
    render(<TcmPatternCard pattern={{ ...BASE_PATTERN, organSystem: undefined }} />);
    expect(screen.queryByText('Spleen')).toBeNull();
  });
});
