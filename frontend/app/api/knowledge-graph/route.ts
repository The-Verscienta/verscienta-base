import { NextRequest, NextResponse } from 'next/server';

const DRUPAL_BASE_URL = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
const JSONAPI_HEADERS = { Accept: 'application/vnd.api+json' };

interface GraphNode {
  id: string;
  label: string;
  type: 'herb' | 'ingredient' | 'target' | 'condition';
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NODE_COLORS = {
  herb: '#4ade80',       // green
  ingredient: '#60a5fa', // blue
  target: '#fb923c',     // orange
  condition: '#f87171',  // red
};

async function fetchJsonApi(path: string): Promise<any> {
  const res = await fetch(`${DRUPAL_BASE_URL}/jsonapi/${path}`, {
    headers: JSONAPI_HEADERS,
    next: { revalidate: 300 },
  });
  if (!res.ok) return { data: [] };
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const herbId = searchParams.get('herb');
  const depth = Math.min(parseInt(searchParams.get('depth') || '2', 10), 3);

  if (!herbId) {
    return NextResponse.json(
      { error: 'Missing "herb" query parameter (Drupal node UUID)' },
      { status: 400 }
    );
  }

  try {
    const nodes: Map<string, GraphNode> = new Map();
    const links: GraphLink[] = [];

    // Fetch the herb
    const herbData = await fetchJsonApi(`node/herb/${herbId}`);
    const herb = herbData.data;
    if (!herb) {
      return NextResponse.json({ error: 'Herb not found' }, { status: 404 });
    }

    nodes.set(herb.id, {
      id: herb.id,
      label: herb.attributes?.title || 'Unknown Herb',
      type: 'herb',
      color: NODE_COLORS.herb,
    });

    // Fetch ingredients linked to this herb
    const ingredientsData = await fetchJsonApi(
      `node/tcm_ingredient?filter[field_herb_sources.id]=${herbId}&page[limit]=50`
    );
    const ingredients = ingredientsData.data || [];

    for (const ing of ingredients) {
      nodes.set(ing.id, {
        id: ing.id,
        label: ing.attributes?.title || 'Unknown Ingredient',
        type: 'ingredient',
        color: NODE_COLORS.ingredient,
      });
      links.push({ source: herb.id, target: ing.id, label: 'contains' });
    }

    // Fetch target interactions for the herb
    if (depth >= 2) {
      const targetsData = await fetchJsonApi(
        `node/tcm_target_interaction?filter[field_herb_ref.id]=${herbId}&page[limit]=50`
      );
      const targets = targetsData.data || [];

      for (const t of targets) {
        const targetId = t.id;
        const targetName = t.attributes?.field_target_name || t.attributes?.title || 'Unknown Target';

        nodes.set(targetId, {
          id: targetId,
          label: targetName,
          type: 'target',
          color: NODE_COLORS.target,
        });
        links.push({ source: herb.id, target: targetId, label: 'targets' });

        // Link ingredient to target if relationship exists
        const ingredientRef = t.relationships?.field_ingredient_ref?.data;
        if (ingredientRef && nodes.has(ingredientRef.id)) {
          links.push({ source: ingredientRef.id, target: targetId, label: 'interacts' });
        }
      }
    }

    // Fetch linked conditions
    const conditionsData = await fetchJsonApi(
      `node/herb/${herbId}?include=field_conditions_treated`
    );
    const included = conditionsData.included || [];
    for (const cond of included) {
      if (cond.type === 'node--condition') {
        nodes.set(cond.id, {
          id: cond.id,
          label: cond.attributes?.title || 'Unknown Condition',
          type: 'condition',
          color: NODE_COLORS.condition,
        });
        links.push({ source: herb.id, target: cond.id, label: 'treats' });
      }
    }

    const graphData: GraphData = {
      nodes: Array.from(nodes.values()),
      links,
    };

    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Knowledge graph error:', error);
    return NextResponse.json(
      { error: 'Failed to build knowledge graph' },
      { status: 500 }
    );
  }
}
