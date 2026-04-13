/**
 * Similar-formula discovery (ingredient + proportion similarity).
 *
 * At scale, consider precomputing top-K neighbors per formula in Drupal (cron)
 * or an external index so this route does not O(n) scan on every cold cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';
import { findSimilarFormulas, type FormulaSimilarityResult } from '@/lib/formula-similarity';
import { cachedFetch, CACHE_TTL } from '@/lib/cache';
import type { HerbIngredient } from '@/types/drupal';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface FormulaData {
  id: string;
  title: string;
  ingredients: HerbIngredient[];
  totalWeight?: number;
}

/**
 * Fetch all formulas from Drupal with their ingredients (cached)
 */
async function fetchAllFormulas(): Promise<FormulaData[]> {
  return cachedFetch('all-formulas-with-ingredients', async () => {
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;

    // Use sparse fieldsets to reduce payload size - only fetch needed fields
    const fields = new URLSearchParams({
      'filter[status][value]': '1',
      'include': 'field_herb_ingredients',
      'fields[node--formula]': 'title,field_total_weight,field_herb_ingredients',
      'fields[node--herb]': 'title,field_quantity,field_unit,field_percentage,field_role,field_function',
      'fields[paragraph--herb_ingredient]': 'field_herb,field_quantity,field_unit,field_percentage,field_role,field_function,field_herb_name',
    });

    const response = await fetch(
      `${drupalUrl}/jsonapi/node/formula?${fields.toString()}`,
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch formulas:', response.status);
      return [];
    }

    const data = await response.json();
    const formulas: FormulaData[] = [];

    // Create a map of included herb data
    const includedMap = new Map<string, any>();
    if (data.included) {
      for (const item of data.included) {
        includedMap.set(item.id, item);
      }
    }

    for (const formula of data.data || []) {
      const ingredientRefs = formula.relationships?.field_herb_ingredients?.data || [];
      const ingredients: HerbIngredient[] = [];

      for (const ref of ingredientRefs) {
        const included = includedMap.get(ref.id);
        if (included) {
          if (included.type === 'node--herb') {
            ingredients.push({
              id: included.id,
              type: included.type,
              title: included.attributes?.title || 'Herb',
              field_quantity: included.attributes?.field_quantity || 1,
              field_unit: included.attributes?.field_unit || 'g',
              field_percentage: included.attributes?.field_percentage,
              field_role: included.attributes?.field_role,
              field_function: included.attributes?.field_function,
            });
          } else if (included.type?.includes('paragraph')) {
            const herbRef = included.relationships?.field_herb?.data;
            const herbData = herbRef ? includedMap.get(herbRef.id) : null;

            ingredients.push({
              id: herbData?.id || ref.id,
              type: herbData?.type || 'node--herb',
              title: herbData?.attributes?.title || included.attributes?.field_herb_name || 'Herb',
              field_quantity: included.attributes?.field_quantity || 1,
              field_unit: included.attributes?.field_unit || 'g',
              field_percentage: included.attributes?.field_percentage,
              field_role: included.attributes?.field_role,
              field_function: included.attributes?.field_function,
            });
          }
        } else {
          ingredients.push({
            id: ref.id,
            type: ref.type || 'node--herb',
            title: ref.meta?.title || 'Herb',
            field_quantity: ref.meta?.field_quantity || 1,
            field_unit: ref.meta?.field_unit || 'g',
            field_percentage: ref.meta?.field_percentage,
          });
        }
      }

      // Check for denormalized ingredients
      if (ingredients.length === 0 && formula.attributes?.field_herb_ingredients) {
        const attrIngredients = formula.attributes.field_herb_ingredients;
        if (Array.isArray(attrIngredients)) {
          for (const ing of attrIngredients) {
            ingredients.push({
              id: ing.id || ing.herb_id || `herb-${ingredients.length}`,
              type: 'node--herb',
              title: ing.title || ing.herb_title || 'Herb',
              field_quantity: ing.field_quantity || ing.quantity || 1,
              field_unit: ing.field_unit || ing.unit || 'g',
              field_percentage: ing.field_percentage || ing.percentage,
              field_role: ing.field_role || ing.role,
              field_function: ing.field_function,
            });
          }
        }
      }

      formulas.push({
        id: formula.id,
        title: formula.attributes?.title || 'Formula',
        ingredients,
        totalWeight: formula.attributes?.field_total_weight,
      });
    }

    return formulas;
  }, CACHE_TTL.FORMULAS_LIST);
}

/**
 * Get cached similarity results for a formula
 */
async function getCachedSimilarities(
  formulaId: string,
  allFormulas: FormulaData[],
  minSimilarity: number,
  maxResults: number
): Promise<FormulaSimilarityResult[]> {
  // Bump cache generation when similarity algorithm changes (role weights, min shared herbs, tiers).
  const cacheKey = `similarities:v4:${formulaId}:${minSimilarity}:${maxResults}`;

  return cachedFetch(cacheKey, async () => {
    const sourceFormula = allFormulas.find(f => f.id === formulaId);

    if (!sourceFormula || sourceFormula.ingredients.length === 0) {
      return [];
    }

    return findSimilarFormulas(sourceFormula, allFormulas, {
      minSimilarity,
      maxResults,
      minSharedHerbs: 2,
      useRoleWeights: true,
    });
  }, CACHE_TTL.SIMILARITIES);
}

/**
 * GET: Find formulas similar to the specified formula
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const { id: formulaId } = await params;

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`formula:similar:${identifier}`, RATE_LIMITS.api);
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Please try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const url = new URL(request.url);
    const minSimilarity = parseInt(url.searchParams.get('minSimilarity') || '10', 10);
    const maxResults = Math.min(20, parseInt(url.searchParams.get('maxResults') || '8', 10));

    // Fetch all formulas (cached)
    const allFormulas = await fetchAllFormulas();

    if (allFormulas.length === 0) {
      return NextResponse.json(
        { similarFormulas: [], message: 'No formulas found.' },
        { headers: rateLimitHeaders }
      );
    }

    const sourceFormula = allFormulas.find(f => f.id === formulaId);

    if (!sourceFormula) {
      return NextResponse.json(
        { error: 'Formula not found' },
        { status: 404, headers: rateLimitHeaders }
      );
    }

    if (sourceFormula.ingredients.length === 0) {
      return NextResponse.json(
        { similarFormulas: [], message: 'Source formula has no ingredients.' },
        { headers: rateLimitHeaders }
      );
    }

    // Get similarities (cached)
    const similarFormulas = await getCachedSimilarities(
      formulaId,
      allFormulas,
      minSimilarity,
      maxResults
    );

    const duration = Date.now() - startTime;

    // Add cache headers for CDN/browser caching
    const cacheHeaders = {
      ...rateLimitHeaders,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    };

    return NextResponse.json(
      {
        similarFormulas,
        sourceFormulaId: formulaId,
        sourceHerbCount: sourceFormula.ingredients.length,
        totalFormulasCompared: allFormulas.length - 1,
        _meta: { durationMs: duration },
      },
      { headers: cacheHeaders }
    );
  } catch (error: any) {
    console.error('Error finding similar formulas:', error);
    return NextResponse.json(
      { error: 'Failed to find similar formulas', similarFormulas: [] },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
