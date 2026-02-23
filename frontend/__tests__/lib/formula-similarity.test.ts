import {
  calculateFormulaSimilarity,
  findSimilarFormulas,
  getSimilarityLabel,
} from '@/lib/formula-similarity';
import type { HerbIngredient } from '@/types/drupal';

function makeIngredient(id: string, title: string, quantity?: number, percentage?: number): HerbIngredient {
  return {
    id,
    title,
    field_quantity: quantity,
    field_percentage: percentage,
  } as HerbIngredient;
}

describe('calculateFormulaSimilarity', () => {
  it('returns 0 when source ingredients are empty', () => {
    const target = [makeIngredient('h1', 'Ginseng', 10)];
    const result = calculateFormulaSimilarity([], undefined, target, undefined);
    expect(result.score).toBe(0);
    expect(result.sharedHerbs).toHaveLength(0);
  });

  it('returns 0 when target ingredients are empty', () => {
    const source = [makeIngredient('h1', 'Ginseng', 10)];
    const result = calculateFormulaSimilarity(source, undefined, [], undefined);
    expect(result.score).toBe(0);
    expect(result.sharedHerbs).toHaveLength(0);
  });

  it('returns 100 for identical single-herb formulas', () => {
    const herbs = [makeIngredient('h1', 'Ginseng', 10)];
    const result = calculateFormulaSimilarity(herbs, undefined, herbs, undefined);
    expect(result.score).toBe(100);
    expect(result.sharedHerbs).toHaveLength(1);
    expect(result.sharedHerbs[0].herbId).toBe('h1');
  });

  it('returns 100 for identical multi-herb formulas', () => {
    const herbs = [
      makeIngredient('h1', 'Ginseng', 20),
      makeIngredient('h2', 'Licorice', 10),
      makeIngredient('h3', 'Astragalus', 15),
    ];
    const result = calculateFormulaSimilarity(herbs, undefined, herbs, undefined);
    expect(result.score).toBe(100);
    expect(result.sharedHerbs).toHaveLength(3);
  });

  it('returns 0 for completely disjoint formulas', () => {
    const source = [makeIngredient('h1', 'Ginseng', 10)];
    const target = [makeIngredient('h2', 'Licorice', 10)];
    const result = calculateFormulaSimilarity(source, undefined, target, undefined);
    expect(result.score).toBe(0);
    expect(result.sharedHerbs).toHaveLength(0);
  });

  it('returns partial score for overlapping formulas', () => {
    const source = [
      makeIngredient('h1', 'Ginseng', 20),
      makeIngredient('h2', 'Licorice', 10),
    ];
    const target = [
      makeIngredient('h1', 'Ginseng', 20),
      makeIngredient('h3', 'Astragalus', 10),
    ];
    const result = calculateFormulaSimilarity(source, undefined, target, undefined);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.sharedHerbs).toHaveLength(1);
    expect(result.sharedHerbs[0].herbId).toBe('h1');
  });

  it('handles zero-weight ingredients with equal distribution', () => {
    const source = [
      makeIngredient('h1', 'Ginseng'),
      makeIngredient('h2', 'Licorice'),
    ];
    const target = [
      makeIngredient('h1', 'Ginseng'),
      makeIngredient('h2', 'Licorice'),
    ];
    const result = calculateFormulaSimilarity(source, undefined, target, undefined);
    expect(result.score).toBe(100);
  });

  it('uses percentage field when available', () => {
    const source = [
      makeIngredient('h1', 'Ginseng', 10, 60),
      makeIngredient('h2', 'Licorice', 5, 40),
    ];
    const target = [
      makeIngredient('h1', 'Ginseng', 10, 60),
      makeIngredient('h2', 'Licorice', 5, 40),
    ];
    const result = calculateFormulaSimilarity(source, 15, target, 15);
    expect(result.score).toBe(100);
    expect(result.sharedHerbs[0].percentageInSource).toBe(60);
    expect(result.sharedHerbs[1].percentageInSource).toBe(40);
  });

  it('sorts shared herbs by source percentage descending', () => {
    const source = [
      makeIngredient('h1', 'Ginseng', 5),
      makeIngredient('h2', 'Licorice', 20),
      makeIngredient('h3', 'Astragalus', 10),
    ];
    const target = [
      makeIngredient('h1', 'Ginseng', 8),
      makeIngredient('h2', 'Licorice', 15),
      makeIngredient('h3', 'Astragalus', 12),
    ];
    const result = calculateFormulaSimilarity(source, undefined, target, undefined);
    expect(result.sharedHerbs[0].herbTitle).toBe('Licorice');
    expect(result.sharedHerbs[1].herbTitle).toBe('Astragalus');
    expect(result.sharedHerbs[2].herbTitle).toBe('Ginseng');
  });
});

describe('findSimilarFormulas', () => {
  const sourceFormula = {
    id: 'f1',
    ingredients: [
      makeIngredient('h1', 'Ginseng', 20),
      makeIngredient('h2', 'Licorice', 10),
    ],
  };

  const allFormulas = [
    {
      id: 'f1',
      title: 'Source Formula',
      ingredients: [
        makeIngredient('h1', 'Ginseng', 20),
        makeIngredient('h2', 'Licorice', 10),
      ],
    },
    {
      id: 'f2',
      title: 'Similar Formula',
      ingredients: [
        makeIngredient('h1', 'Ginseng', 15),
        makeIngredient('h3', 'Astragalus', 10),
      ],
    },
    {
      id: 'f3',
      title: 'Identical Formula',
      ingredients: [
        makeIngredient('h1', 'Ginseng', 20),
        makeIngredient('h2', 'Licorice', 10),
      ],
    },
    {
      id: 'f4',
      title: 'Disjoint Formula',
      ingredients: [
        makeIngredient('h4', 'Turmeric', 10),
        makeIngredient('h5', 'Ginger', 5),
      ],
    },
  ];

  it('excludes the source formula from results', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas);
    expect(results.find(r => r.formulaId === 'f1')).toBeUndefined();
  });

  it('returns formulas sorted by similarity score descending', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].similarityScore).toBeGreaterThanOrEqual(results[i].similarityScore);
    }
  });

  it('filters by minimum similarity', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas, { minSimilarity: 90 });
    for (const r of results) {
      expect(r.similarityScore).toBeGreaterThanOrEqual(90);
    }
  });

  it('limits the number of results', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas, { maxResults: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('excludes formulas with no shared herbs', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas);
    expect(results.find(r => r.formulaId === 'f4')).toBeUndefined();
  });

  it('includes shared herb count and total herbs', () => {
    const results = findSimilarFormulas(sourceFormula, allFormulas);
    const identical = results.find(r => r.formulaId === 'f3');
    expect(identical).toBeDefined();
    expect(identical!.sharedHerbCount).toBe(2);
    expect(identical!.totalHerbsInComparison).toBe(2);
  });
});

describe('getSimilarityLabel', () => {
  it('returns Very Similar for score >= 80', () => {
    expect(getSimilarityLabel(80).label).toBe('Very Similar');
    expect(getSimilarityLabel(100).label).toBe('Very Similar');
  });

  it('returns Similar for score >= 60', () => {
    expect(getSimilarityLabel(60).label).toBe('Similar');
    expect(getSimilarityLabel(79).label).toBe('Similar');
  });

  it('returns Moderately Similar for score >= 40', () => {
    expect(getSimilarityLabel(40).label).toBe('Moderately Similar');
    expect(getSimilarityLabel(59).label).toBe('Moderately Similar');
  });

  it('returns Somewhat Similar for score >= 20', () => {
    expect(getSimilarityLabel(20).label).toBe('Somewhat Similar');
    expect(getSimilarityLabel(39).label).toBe('Somewhat Similar');
  });

  it('returns Low Similarity for score < 20', () => {
    expect(getSimilarityLabel(0).label).toBe('Low Similarity');
    expect(getSimilarityLabel(19).label).toBe('Low Similarity');
  });

  it('returns appropriate colors for each tier', () => {
    expect(getSimilarityLabel(80).color).toContain('green');
    expect(getSimilarityLabel(60).color).toContain('blue');
    expect(getSimilarityLabel(40).color).toContain('amber');
    expect(getSimilarityLabel(20).color).toContain('orange');
    expect(getSimilarityLabel(10).color).toContain('gray');
  });
});
