import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { FormulaEntity } from '@/types/drupal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { GroupedIngredientsList } from '@/components/formula';
import { HerbRoleBadge } from '@/components/formula/HerbRoleBadge';
import { FormulaFamilySkeleton, SimilarFormulasSkeleton, ContributionsSkeleton } from '@/components/formula/LoadingSkeletons';
import { getTextValue, hasTextContent, herbDisplayName } from '@/lib/drupal-helpers';
import {
  PageWrapper,
  LeafPattern,
  Section,
  BotanicalDivider,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { SymbolicVerifyButton } from '@/components/ui/SymbolicVerifyButton';
import {
  formulaPopularityMap,
  preparationDifficultyMap,
  treatmentDurationMap,
  formulaCategoryMap,
  evidenceStrengthMap,
  getFieldConfig,
} from '@/lib/decision-field-maps';

// ISR: Revalidate every 5 minutes
export const revalidate = 300;

// Lazy load heavy client components
const FormulaFamily = dynamic(
  () => import('@/components/formula/FormulaFamily').then(mod => ({ default: mod.FormulaFamily })),
  { loading: () => <FormulaFamilySkeleton /> }
);

const SimilarFormulas = dynamic(
  () => import('@/components/formula/SimilarFormulas').then(mod => ({ default: mod.SimilarFormulas })),
  { loading: () => <SimilarFormulasSkeleton /> }
);

const ContributionsSection = dynamic(
  () => import('@/components/formula/ContributionsSection').then(mod => ({ default: mod.ContributionsSection })),
  { loading: () => <ContributionsSkeleton /> }
);

interface FormulaDetailProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate static params for all formulas at build time
export async function generateStaticParams() {
  try {
    const formulas = await drupal.getResourceCollection<FormulaEntity[]>('node--formula', {
      params: {
        'filter[status]': 1,
        'fields[node--formula]': 'id', // Only fetch IDs
        'page[limit]': 100,
      },
    });

    return (formulas || []).map((formula) => ({
      id: formula.id,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

async function getFormula(id: string): Promise<FormulaEntity | null> {
  try {
    const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'https://backend.ddev.site';
    const params = new URLSearchParams({
      include: 'field_herb_ingredients,field_herb_ingredients.field_herb_reference,field_conditions',
    });

    const response = await fetch(
      `${drupalUrl}/jsonapi/node/formula/${id}?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch formula:', response.status);
      return null;
    }

    const json = await response.json();
    const data = json.data;
    const included = json.included || [];

    // Build a map of included entities
    const includedMap = new Map<string, any>();
    for (const item of included) {
      includedMap.set(item.id, item);
    }

    // Process herb ingredients from paragraphs
    const herbIngredients: FormulaEntity['field_herb_ingredients'] = [];
    const ingredientRefs = data.relationships?.field_herb_ingredients?.data || [];

    for (const ref of ingredientRefs) {
      const paragraph = includedMap.get(ref.id);
      if (paragraph) {
        const herbRef = paragraph.relationships?.field_herb_reference?.data;
        const herbData = herbRef ? includedMap.get(herbRef.id) : null;

        herbIngredients.push({
          id: herbData?.id || ref.id,
          type: herbData?.type || 'node--herb',
          title: herbData?.attributes?.title || paragraph.attributes?.field_herb_name || 'Herb',
          field_herb_pinyin_name: herbData?.attributes?.field_herb_pinyin_name || undefined,
          field_quantity: parseFloat(paragraph.attributes?.field_quantity) || 0,
          field_unit: paragraph.attributes?.field_unit || 'g',
          field_percentage: paragraph.attributes?.field_percentage
            ? parseFloat(paragraph.attributes.field_percentage)
            : undefined,
          field_role: paragraph.attributes?.field_role,
          field_function: paragraph.attributes?.field_function,
          field_notes: paragraph.attributes?.field_notes,
        });
      }
    }

    // Process conditions
    const conditions: FormulaEntity['field_conditions'] = [];
    const conditionRefs = data.relationships?.field_conditions?.data || [];
    for (const ref of conditionRefs) {
      const condition = includedMap.get(ref.id);
      conditions.push({
        id: ref.id,
        type: ref.type,
        title: condition?.attributes?.title,
      });
    }

    return {
      id: data.id,
      type: data.type,
      title: data.attributes?.title || '',
      status: data.attributes?.status,
      langcode: data.attributes?.langcode || 'en',
      created: data.attributes?.created,
      changed: data.attributes?.changed,
      path: data.attributes?.path || { alias: '', langcode: 'en' },
      body: data.attributes?.body,
      field_formula_description: data.attributes?.field_formula_description,
      field_preparation_instructions: data.attributes?.field_preparation_instructions,
      field_dosage: data.attributes?.field_dosage,
      field_total_weight: data.attributes?.field_total_weight,
      field_total_weight_unit: data.attributes?.field_total_weight_unit,
      field_use_cases: data.attributes?.field_use_cases,
      field_herb_ingredients: herbIngredients,
      field_conditions: conditions,
      field_formula_popularity: data.attributes?.field_formula_popularity,
      field_preparation_difficulty: data.attributes?.field_preparation_difficulty,
      field_available_premade: data.attributes?.field_available_premade,
      field_commercial_forms: data.attributes?.field_commercial_forms,
      field_treatment_duration: data.attributes?.field_treatment_duration,
      field_formula_era: data.attributes?.field_formula_era,
      field_formula_category: data.attributes?.field_formula_category,
      field_editors_pick: data.attributes?.field_editors_pick,
      field_evidence_strength: data.attributes?.field_evidence_strength,
    };
  } catch (error) {
    console.error('Failed to fetch formula:', error);
    return null;
  }
}

export async function generateMetadata({ params }: FormulaDetailProps): Promise<Metadata> {
  const { id } = await params;
  const formula = await getFormula(id);

  if (!formula) {
    return { title: 'Formula Not Found - Verscienta Health' };
  }

  const name = formula.title || 'Formula';
  const descText = formula.field_formula_description;
  const descStr = descText
    ? (typeof descText === 'string' ? descText : descText.processed || descText.value || '').replace(/<[^>]*>/g, '').slice(0, 160)
    : '';
  const description = descStr
    || `Learn about ${name} — ingredients, actions, indications, and traditional usage.`;

  return {
    title: `${name} - Herbal Formula - Verscienta Health`,
    description,
  };
}

export default async function FormulaDetailPage({ params }: FormulaDetailProps) {
  const { id } = await params;
  const formula = await getFormula(id);

  if (!formula) {
    notFound();
  }

  const name = formula.title || 'Formula';
  // field_total_weight comes as a string from Drupal, convert to number
  const rawTotalWeight = typeof formula.field_total_weight === 'string'
    ? parseFloat(formula.field_total_weight)
    : (formula.field_total_weight || 0);
  // Auto-sum ingredient quantities when field_total_weight is not set
  const totalWeight = rawTotalWeight > 0
    ? rawTotalWeight
    : (formula.field_herb_ingredients?.reduce((sum, ing) => {
        const qty = typeof ing.field_quantity === 'string'
          ? parseFloat(ing.field_quantity)
          : (ing.field_quantity || 0);
        return sum + qty;
      }, 0) ?? 0);
  const weightUnit = formula.field_total_weight_unit || 'g';

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-earth-900/80 dark:to-earth-900 border-b border-sage-200/50 dark:border-earth-700/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Formulas', href: '/formulas' },
              { label: name },
            ]}
            className="mb-8"
          />

          <div className="bg-white dark:bg-earth-900 rounded-3xl shadow-xl border border-earth-200 dark:border-earth-700 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none text-8xl">🌿</div>
            <div className="relative p-8 md:p-12">
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 tracking-tight">
                {name}
              </h1>
              {totalWeight > 0 && (
                <p className="text-lg text-sage-600">
                  Total Formula Weight: {totalWeight} {weightUnit}
                </p>
              )}
              {formula.field_use_cases && formula.field_use_cases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formula.field_use_cases.map((useCase, idx) => (
                    <Tag key={idx} variant="sage" size="md">
                      {useCase}
                    </Tag>
                  ))}
                </div>
              )}

              {/* Decision Tags */}
              {(formula.field_editors_pick || formula.field_formula_popularity || formula.field_formula_category || formula.field_available_premade || formula.field_formula_era) && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {formula.field_editors_pick && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                      &#9733; Editor&apos;s Pick
                    </span>
                  )}
                  {formula.field_formula_popularity && (() => { const c = getFieldConfig(formulaPopularityMap, formula.field_formula_popularity); return c ? (
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                      {c.icon && <span>{c.icon}</span>}{c.label}
                    </span>
                  ) : null; })()}
                  {formula.field_formula_category && (() => { const c = getFieldConfig(formulaCategoryMap, formula.field_formula_category); return c ? (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                  ) : null; })()}
                  {formula.field_available_premade && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                      Pre-made Available
                    </span>
                  )}
                  {formula.field_formula_era && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300">
                      {formula.field_formula_era}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {(formula.body?.value || hasTextContent(formula.field_formula_description)) && (
          <Section
            id="description"
            variant="default"
            title="Description"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-earth-200">
              {formula.body?.value && <SafeHtml html={formula.body.value} />}
              {hasTextContent(formula.field_formula_description) && !formula.body?.value && (
                <p>{getTextValue(formula.field_formula_description)}</p>
              )}
            </div>
          </Section>
        )}

        {formula.field_conditions && formula.field_conditions.length > 0 && (
          <Section
            id="conditions"
            variant="default"
            title="Related Conditions"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          >
            <div className="flex flex-wrap gap-2">
              {formula.field_conditions.map((condition) => (
                <Link
                  key={condition.id}
                  href={`/conditions/${condition.id}`}
                  className="inline-flex"
                >
                  <Tag variant="sage" size="md">
                    {condition.title || 'Condition'}
                  </Tag>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Practical Details */}
        {(formula.field_preparation_difficulty || formula.field_treatment_duration || formula.field_commercial_forms || formula.field_evidence_strength) && (
          <Section
            id="practical"
            variant="default"
            title="Practical Details"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              {formula.field_preparation_difficulty && (() => { const c = getFieldConfig(preparationDifficultyMap, formula.field_preparation_difficulty); return c ? (
                <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Preparation Difficulty</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                </div>
              ) : null; })()}
              {formula.field_treatment_duration && (() => { const c = getFieldConfig(treatmentDurationMap, formula.field_treatment_duration); return c ? (
                <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Treatment Duration</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                </div>
              ) : null; })()}
              {formula.field_commercial_forms && (
                <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Commercial Forms</h3>
                  <p className="text-gray-700 dark:text-earth-200">{formula.field_commercial_forms}</p>
                </div>
              )}
              {formula.field_evidence_strength && (() => { const c = getFieldConfig(evidenceStrengthMap, formula.field_evidence_strength); return c ? (
                <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Evidence Strength</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                </div>
              ) : null; })()}
            </div>
          </Section>
        )}

        <BotanicalDivider />

        <Section
          id="ingredients"
          variant="default"
          title="Herb Ingredients"
          icon={
            <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        >
          {!formula.field_herb_ingredients || formula.field_herb_ingredients.length === 0 ? (
            <p className="text-gray-600 dark:text-earth-300">No ingredients specified for this formula.</p>
          ) : (
            <>
              <div className="mb-6">
                <GroupedIngredientsList
                  ingredients={formula.field_herb_ingredients}
                  totalWeight={totalWeight}
                />
              </div>
              <div className="bg-sage-50 dark:bg-earth-900 rounded-xl p-4 border border-sage-200 dark:border-earth-700">
                <h3 className="font-semibold text-gray-900 dark:text-earth-100 mb-3">Formula Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-800 dark:text-earth-200">
                    <thead>
                      <tr className="border-b border-sage-300 dark:border-earth-700">
                        <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-earth-100">Herb</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-900 dark:text-earth-100">Role</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-900 dark:text-earth-100">Quantity</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-900 dark:text-earth-100">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formula.field_herb_ingredients.map((ingredient, idx) => {
                        const fieldPercentage = typeof ingredient.field_percentage === 'string'
                          ? parseFloat(ingredient.field_percentage)
                          : (ingredient.field_percentage || 0);
                        const fieldQuantity = typeof ingredient.field_quantity === 'string'
                          ? parseFloat(ingredient.field_quantity)
                          : (ingredient.field_quantity || 0);
                        const percentage = fieldPercentage ||
                          (totalWeight > 0 ? (fieldQuantity / totalWeight * 100) : 0);
                        return (
                          <tr key={idx} className="border-b border-sage-200 dark:border-earth-700">
                            <td className="py-2 px-2">
                              <Link href={`/herbs/${ingredient.id}`} className="text-earth-700 dark:text-earth-400 hover:text-gray-900 dark:hover:text-earth-200 hover:underline font-medium">
                                {herbDisplayName(ingredient.title || 'Herb', ingredient.field_herb_pinyin_name)}
                              </Link>
                            </td>
                            <td className="py-2 px-2">
                              {ingredient.field_role ? <HerbRoleBadge role={ingredient.field_role} size="sm" /> : <span className="text-gray-400 dark:text-earth-500">-</span>}
                            </td>
                            <td className="py-2 px-2 text-right text-gray-700 dark:text-earth-200">{ingredient.field_quantity} {ingredient.field_unit}</td>
                            <td className="py-2 px-2 text-right text-gray-700 dark:text-earth-200">{percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}</td>
                          </tr>
                        );
                      })}
                      {totalWeight > 0 && (
                        <tr className="font-bold bg-sage-100 dark:bg-earth-800 text-gray-900 dark:text-earth-100">
                          <td className="py-2 px-2">Total</td>
                          <td className="py-2 px-2"></td>
                          <td className="py-2 px-2 text-right">{totalWeight} {weightUnit}</td>
                          <td className="py-2 px-2 text-right">100%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <SymbolicVerifyButton
                    herbId={name}
                    formulaId={id}
                  />
                </div>
              </div>
            </>
          )}
        </Section>

        <Suspense fallback={<FormulaFamilySkeleton />}>
          <FormulaFamily formulaId={id} />
        </Suspense>

        <Suspense fallback={<SimilarFormulasSkeleton />}>
          <SimilarFormulas formulaId={id} minSimilarity={10} maxResults={5} />
        </Suspense>

        <BotanicalDivider />

        <Section
          id="preparation"
          variant="default"
          title="Preparation & Dosage"
          icon={
            <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        >
          <div className="space-y-4">
            {hasTextContent(formula.field_preparation_instructions) ? (
              <div>
                <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                  <span>🔥</span> Preparation Instructions
                </h3>
                <p className="text-gray-700 bg-earth-50/50 p-4 rounded-xl border border-earth-100">
                  {getTextValue(formula.field_preparation_instructions)}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No preparation instructions provided.</p>
            )}
            {hasTextContent(formula.field_dosage) && (
              <div>
                <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                  <span>💊</span> Dosage
                </h3>
                <p className="text-gray-700 bg-earth-50/50 p-4 rounded-xl border border-earth-100">
                  {getTextValue(formula.field_dosage)}
                </p>
              </div>
            )}
          </div>
        </Section>

        <Suspense fallback={<ContributionsSkeleton />}>
          <ContributionsSection formulaId={id} formulaTitle={name} />
        </Suspense>

        <DisclaimerBox />

        <BackLink href="/formulas" label="Back to All Formulas" />
      </div>
    </PageWrapper>
  );
}
