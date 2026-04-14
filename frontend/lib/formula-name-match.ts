/**
 * Loose matching between AI-suggested formula names (often Pinyin) and Drupal node titles / aliases.
 */

/** Normalize for lookup keys: lowercase, strip diacritics, collapse punctuation/spaces. */
export function normalizeFormulaMatchKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[''`´]/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Compact key (no spaces) for "Gui Pi Tang" vs "GuiPiTang" style differences. */
export function compactFormulaMatchKey(s: string): string {
  return normalizeFormulaMatchKey(s).replace(/\s/g, '');
}

export interface FormulaLookupInput {
  id: string;
  title: string;
  chineseName?: string | null;
  pinyinName?: string | null;
}

/**
 * Build a map from normalized / compact name variants → formula UUID.
 * Later keys overwrite earlier ones only when same variant (avoid duplicate work).
 */
export function buildFormulaIdLookup(formulas: FormulaLookupInput[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const f of formulas) {
    const variants = new Set<string>();
    const add = (raw: string | null | undefined) => {
      if (!raw?.trim()) return;
      const n = normalizeFormulaMatchKey(raw);
      const c = compactFormulaMatchKey(raw);
      if (n) variants.add(n);
      if (c) variants.add(c);
    };

    add(f.title);
    add(f.chineseName);
    add(f.pinyinName);

    for (const v of variants) {
      if (!map.has(v)) {
        map.set(v, f.id);
      }
    }
  }

  return map;
}

/** Resolve a suggested formula string to a Drupal node UUID if we have a match. */
export function resolveFormulaIdFromLookup(suggested: string, lookup: Map<string, string>): string | undefined {
  const trimmed = suggested.trim();
  if (!trimmed) return undefined;

  const n = normalizeFormulaMatchKey(trimmed);
  const c = compactFormulaMatchKey(trimmed);
  if (lookup.has(n)) return lookup.get(n);
  if (lookup.has(c)) return lookup.get(c);

  // Strip trailing parenthetical e.g. "Gui Pi Tang (modified)"
  const noParen = normalizeFormulaMatchKey(trimmed.replace(/\([^)]*\)/g, '').trim());
  if (noParen && lookup.has(noParen)) return lookup.get(noParen);
  const noParenCompact = noParen.replace(/\s/g, '');
  if (noParenCompact && lookup.has(noParenCompact)) return lookup.get(noParenCompact);

  return undefined;
}

/** Normalized Levenshtein similarity in [0, 1] (1 = identical). */
function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const m = a.length;
  const n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  const dist = row[n];
  return 1 - dist / Math.max(m, n);
}

/**
 * When exact lookup fails, pick the best fuzzy match against title / Chinese / pinyin (normalized).
 * `minRatio` ~0.88 works well for minor typos and spacing variants.
 */
export function fuzzyResolveFormulaId(
  suggested: string,
  formulas: FormulaLookupInput[],
  minRatio = 0.88
): string | undefined {
  const target = normalizeFormulaMatchKey(suggested);
  if (!target) return undefined;

  let bestId: string | undefined;
  let bestScore = 0;

  for (const f of formulas) {
    const candidates = [f.title, f.chineseName, f.pinyinName].filter(
      (x): x is string => typeof x === 'string' && x.trim().length > 0
    );
    for (const cand of candidates) {
      const n = normalizeFormulaMatchKey(cand);
      if (!n) continue;
      const compactT = target.replace(/\s/g, '');
      const compactN = n.replace(/\s/g, '');
      const r = Math.max(
        levenshteinRatio(target, n),
        levenshteinRatio(compactT, compactN)
      );
      if (r > bestScore) {
        bestScore = r;
        bestId = f.id;
      }
    }
  }

  return bestScore >= minRatio ? bestId : undefined;
}

/** Exact lookup first, then fuzzy against the full formula list. */
export function resolveFormulaIdExactThenFuzzy(
  suggested: string,
  lookup: Map<string, string>,
  formulas: FormulaLookupInput[],
  fuzzyMinRatio = 0.88
): string | undefined {
  return (
    resolveFormulaIdFromLookup(suggested, lookup) ??
    fuzzyResolveFormulaId(suggested, formulas, fuzzyMinRatio)
  );
}
