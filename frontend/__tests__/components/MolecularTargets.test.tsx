import { render, screen, waitFor } from '@testing-library/react';
import { MolecularTargets } from '@/components/herb/MolecularTargets';

const originalFetch = global.fetch;
beforeAll(() => { global.fetch = jest.fn(); });
afterAll(() => { global.fetch = originalFetch; });

const HERB_UUID = 'herb-uuid-1234';

const MOCK_TARGETS = {
  count: 2,
  targets: [
    {
      id: 't1',
      target_name: 'Tumor Necrosis Factor Alpha',
      gene_name: 'TNF',
      uniprot_id: 'P01375',
      score: 0.85,
      evidence_type: ['predicted', 'experimental'],
      source_db: 'BATMAN-TCM',
    },
    {
      id: 't2',
      target_name: 'Cyclooxygenase-2',
      gene_name: 'PTGS2',
      score: 0.62,
      evidence_type: ['predicted'],
    },
  ],
};

describe('MolecularTargets', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('returns null when count is 0', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 0, targets: [] }),
    });

    const { container } = render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      // No content rendered when count === 0
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders target table when data exists', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TARGETS,
    });

    render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      expect(screen.getByText('Molecular Targets')).toBeTruthy();
      expect(screen.getByText('Tumor Necrosis Factor Alpha')).toBeTruthy();
      expect(screen.getByText('Cyclooxygenase-2')).toBeTruthy();
    });
  });

  it('shows summary banner with count and top genes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TARGETS,
    });

    render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      // Use selector:'p' to avoid matching ancestor elements with same text content
      expect(screen.getByText(/known molecular target/i, { selector: 'p' })).toBeTruthy();
      // top3 genes are rendered together in a <span>
      expect(screen.getByText('TNF, PTGS2')).toBeTruthy();
    });
  });

  it('links gene name to UniProt when uniprot_id present', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TARGETS,
    });

    render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'TNF' });
      expect(link.getAttribute('href')).toContain('P01375');
      expect(link.getAttribute('href')).toContain('uniprot.org');
    });
  });

  it('shows gene name without link when no uniprot_id', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TARGETS,
    });

    render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      // PTGS2 has no uniprot_id — rendered as plain text, not a link
      expect(screen.getByText('PTGS2')).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'PTGS2' })).toBeNull();
    });
  });

  it('returns null when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

    const { container } = render(<MolecularTargets herbId={HERB_UUID} />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
