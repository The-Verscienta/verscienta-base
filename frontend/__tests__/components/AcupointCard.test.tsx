import { render, screen } from '@testing-library/react';
import { AcupointCard } from '@/components/point/AcupointCard';
import type { AcupointListItem } from '@/types/drupal';

const BASE_POINT: AcupointListItem = {
  id: 'pt-1',
  title: 'Broken Sequence',
  pointCode: 'LU-7',
  pinyinName: 'Lie Que',
  chineseName: '列缺',
  meridianName: 'Lung',
  specialProperties: ['luo_connecting', 'confluent_point'],
  popularity: 'staple',
  editorsPick: true,
  beginnerFriendly: false,
};

describe('AcupointCard', () => {
  it('renders point code prominently', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('LU-7')).toBeTruthy();
  });

  it('renders English title', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('Broken Sequence')).toBeTruthy();
  });

  it('renders pinyin name', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('Lie Que')).toBeTruthy();
  });

  it('renders Chinese name', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('列缺')).toBeTruthy();
  });

  it('renders meridian tag', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('Lung Channel')).toBeTruthy();
  });

  it("shows ★ Pick badge for editor's pick", () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('★ Pick')).toBeTruthy();
  });

  it('does not show Beginner badge when beginnerFriendly is false', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.queryByText('Beginner')).toBeNull();
  });

  it('shows Beginner badge when beginnerFriendly is true', () => {
    render(<AcupointCard point={{ ...BASE_POINT, beginnerFriendly: true }} />);
    expect(screen.getByText('Beginner')).toBeTruthy();
  });

  it('links to the correct point detail page', () => {
    render(<AcupointCard point={BASE_POINT} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/points/pt-1');
  });

  it('renders Explore Details link text', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('Explore Details')).toBeTruthy();
  });

  it('renders special properties badges', () => {
    render(<AcupointCard point={BASE_POINT} />);
    expect(screen.getByText('Luo-Connecting')).toBeTruthy();
    expect(screen.getByText('Confluent')).toBeTruthy();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: AcupointListItem = {
      id: 'pt-min',
      title: 'Mystery Point',
      pointCode: 'EX-1',
    };
    render(<AcupointCard point={minimal} />);
    expect(screen.getByText('EX-1')).toBeTruthy();
    expect(screen.getByText('Mystery Point')).toBeTruthy();
    expect(screen.queryByText(/channel/i)).toBeNull();
  });

  it('falls back to — when pointCode is empty', () => {
    render(<AcupointCard point={{ ...BASE_POINT, pointCode: '' }} />);
    expect(screen.getByText('—')).toBeTruthy();
  });
});
