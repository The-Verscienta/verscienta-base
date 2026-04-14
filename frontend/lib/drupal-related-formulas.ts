/**
 * Server-side helpers: formulas that share Drupal condition references with a given formula.
 */

export interface FormulaSummary {
  id: string;
  title: string;
  /** How many of the source formula's conditions this formula also references */
  overlapCount: number;
}

/**
 * Fetch published formula id+title nodes that reference a single condition (UUID).
 */
function formulaListBaseParams(extra: Record<string, string>): URLSearchParams {
  const u = new URLSearchParams();
  u.set('filter[status]', '1');
  u.set('fields[node--formula]', 'id,title');
  u.set('page[limit]', '40');
  for (const [k, v] of Object.entries(extra)) {
    u.set(k, v);
  }
  return u;
}

async function fetchFormulasForOneCondition(
  drupalUrl: string,
  conditionId: string
): Promise<FormulaSummary[]> {
  const paramVariants = [
    formulaListBaseParams({ 'filter[field_conditions.id][value]': conditionId }),
    formulaListBaseParams({ 'filter[field_conditions.id]': conditionId }),
  ];

  for (const params of paramVariants) {
    const res = await fetch(`${drupalUrl}/jsonapi/node/formula?${params}`, {
      headers: { Accept: 'application/vnd.api+json' },
      next: { revalidate: 300 },
    });

    if (!res.ok) continue;

    const json = await res.json();
    const rows = (json.data ?? []) as Array<{ id: string; attributes?: { title?: string } }>;
    return rows.map((row) => ({
      id: row.id,
      title: row.attributes?.title ?? 'Formula',
      overlapCount: 1,
    }));
  }

  return [];
}

/**
 * Other published formulas that share at least one condition with the current formula.
 * Sorted by number of overlapping conditions (desc), then title.
 */
export async function fetchFormulasSharingConditions(
  drupalUrl: string,
  excludeFormulaId: string,
  conditionIds: string[]
): Promise<FormulaSummary[]> {
  if (!conditionIds.length || !drupalUrl) {
    return [];
  }

  const merged = new Map<string, { id: string; title: string; overlapCount: number }>();

  for (const cid of conditionIds) {
    const batch = await fetchFormulasForOneCondition(drupalUrl, cid);
    for (const f of batch) {
      if (f.id === excludeFormulaId) continue;
      const prev = merged.get(f.id);
      if (prev) {
        prev.overlapCount += 1;
      } else {
        merged.set(f.id, {
          id: f.id,
          title: f.title,
          overlapCount: 1,
        });
      }
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.overlapCount - a.overlapCount || a.title.localeCompare(b.title))
    .slice(0, 14);
}
