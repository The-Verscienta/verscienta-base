import {
  buildFormulaIdLookup,
  compactFormulaMatchKey,
  fuzzyResolveFormulaId,
  normalizeFormulaMatchKey,
  resolveFormulaIdFromLookup,
  resolveFormulaIdExactThenFuzzy,
} from '@/lib/formula-name-match';

describe('formula-name-match', () => {
  it('normalizes case and diacritics', () => {
    expect(normalizeFormulaMatchKey('Gui Pi Tāng')).toBe('gui pi tang');
    expect(compactFormulaMatchKey('Gui Pi Tang')).toBe('guipitang');
  });

  it('resolves by title and compact key', () => {
    const lookup = buildFormulaIdLookup([
      { id: 'uuid-1', title: 'Gui Pi Tang', chineseName: '归脾汤', pinyinName: 'Guipi Tang' },
    ]);
    expect(resolveFormulaIdFromLookup('Gui Pi Tang', lookup)).toBe('uuid-1');
    expect(resolveFormulaIdFromLookup('guipitang', lookup)).toBe('uuid-1');
    expect(resolveFormulaIdFromLookup('归脾汤', lookup)).toBe('uuid-1');
  });

  it('strips parenthetical for matching', () => {
    const lookup = buildFormulaIdLookup([{ id: 'uuid-2', title: 'Gui Pi Tang' }]);
    expect(resolveFormulaIdFromLookup('Gui Pi Tang (modified)', lookup)).toBe('uuid-2');
  });

  it('fuzzyResolveFormulaId tolerates small typos', () => {
    const formulas = [{ id: 'x1', title: 'Gui Pi Tang' }];
    expect(fuzzyResolveFormulaId('Gui Pi Tng', formulas, 0.85)).toBe('x1');
  });

  it('resolveFormulaIdExactThenFuzzy falls back to fuzzy', () => {
    const formulas = [{ id: 'y1', title: 'Xiao Yao San' }];
    const lookup = buildFormulaIdLookup(formulas);
    expect(resolveFormulaIdExactThenFuzzy('Xiao Yao Sn', lookup, formulas, 0.82)).toBe('y1');
  });
});
