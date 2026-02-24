import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import type { FormulaEntity } from '@/types/drupal';
import { getTextValue } from '@/lib/drupal-helpers';
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Tag,
  EmptyState,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { formulaCategoryMap, getFieldConfig } from '@/lib/decision-field-maps';

// ISR: Revalidate every 5 minutes for fresh data with caching benefits
export const revalidate = 300;

const SORT_OPTIONS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: '-title', label: 'Name (Z-A)' },
  { value: '-created', label: 'Newest First' },
  { value: 'created', label: 'Oldest First' },
];

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Herbal Formulas Database - Verscienta Health',
  description: 'Explore traditional and modern herbal formulas designed for specific health conditions with detailed ingredient lists and usage guidelines.',
};

// Formula SVG icon component
function FormulaIcon({ title, useCases }: { title: string; useCases?: string[] }) {
  const searchText = [title, ...(useCases || [])].join(' ').toLowerCase();

  let color1 = '#4a7c59';
  let color2 = '#6b8f71';

  if (searchText.includes('calm') || searchText.includes('relax') || searchText.includes('stress')) {
    color1 = '#6B5B95';
    color2 = '#967BB6';
  } else if (searchText.includes('immune') || searchText.includes('cold') || searchText.includes('flu')) {
    color1 = '#3D7A8A';
    color2 = '#5A9AAA';
  } else if (searchText.includes('digest') || searchText.includes('stomach')) {
    color1 = '#C97A40';
    color2 = '#D9A070';
  } else if (searchText.includes('energy') || searchText.includes('vital')) {
    color1 = '#C25B56';
    color2 = '#D88C88';
  }

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="20" fill={`url(#formGrad-${title.slice(0,3)})`} opacity="0.1" />
      {/* Mortar/bowl shape */}
      <path
        d="M12 28c0 6 5.4 10 12 10s12-4 12-10c0-4-3-8-12-8s-12 4-12 8z"
        fill={`url(#formGrad-${title.slice(0,3)})`}
        opacity="0.3"
      />
      {/* Pestle */}
      <path
        d="M32 16l-8 8M30 14l4 4"
        stroke={`url(#formGrad-${title.slice(0,3)})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Herbs in bowl */}
      <circle cx="20" cy="30" r="2" fill={`url(#formGrad-${title.slice(0,3)})`} opacity="0.6" />
      <circle cx="26" cy="32" r="1.5" fill={`url(#formGrad-${title.slice(0,3)})`} opacity="0.6" />
      <circle cx="24" cy="28" r="1.5" fill={`url(#formGrad-${title.slice(0,3)})`} opacity="0.6" />
      <defs>
        <linearGradient id={`formGrad-${title.slice(0,3)}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface FormulasResult {
  formulas: FormulaEntity[];
  total: number;
}

async function getFormulas(sort: string = 'title', page: number = 1): Promise<FormulasResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;

    // Fetch formulas and count in parallel for better performance
    const [formulas, allFormulas] = await Promise.all([
      drupal.getResourceCollection<FormulaEntity[]>('node--formula', {
        params: {
          'sort': sort,
          'page[limit]': PAGE_SIZE,
          'page[offset]': offset,
          'filter[status]': 1,
          // Sparse fieldsets - only fetch fields we display in the list
          'fields[node--formula]': 'id,title,field_formula_description,field_use_cases,field_herb_ingredients,field_total_weight,field_total_weight_unit',
        },
      }),
      drupal.getResourceCollection<FormulaEntity[]>('node--formula', {
        params: {
          'filter[status]': 1,
          'fields[node--formula]': 'id', // Only fetch IDs for count
          'page[limit]': 500,
        },
      }),
    ]);

    return {
      formulas: formulas || [],
      total: allFormulas?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch formulas:', error);
    return { formulas: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function FormulasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'title';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { formulas, total } = await getFormulas(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Count use cases for stats
  const useCaseCounts: Record<string, number> = {};
  formulas.forEach(formula => {
    formula.field_use_cases?.forEach(useCase => {
      useCaseCounts[useCase] = (useCaseCounts[useCase] || 0) + 1;
    });
  });

  // Get top use cases
  const topUseCases = Object.entries(useCaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-earth-200/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative elements */}
        <div className="absolute top-16 right-20 w-56 h-56 bg-earth-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-sage-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Formulas' },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-earth-500 to-sage-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-earth-600 font-medium tracking-wide uppercase text-sm">
                  Traditional Formulations
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-earth-900 mb-4 leading-tight">
                Herbal Formulas
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Discover traditional and modern herbal formulas combining multiple herbs
                for synergistic therapeutic effects.
              </p>

              {/* Use case highlights */}
              {topUseCases.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-earth-600 font-medium mr-1">Popular uses:</span>
                  {topUseCases.map(([useCase, count]) => (
                    <Tag key={useCase} variant="earth" size="sm">
                      {useCase} ({count})
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-earth-200/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="title" />
              <div className="hidden sm:block w-px h-8 bg-earth-200" />
              <PaginationInfo
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={total}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {formulas.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-earth-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
            title="No Formulas Found"
            description="Our herbal formula database is being curated. Check back soon for traditional and modern formulations."
            action={
              <a
                href="https://backend.ddev.site/node/add/formula"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-earth-600 to-sage-600 hover:from-earth-700 hover:to-sage-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Add Formula
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </a>
            }
          />
        ) : (
          <>
            {/* Editor's Picks */}
            {(() => {
              const picks = formulas.filter(f => f.field_editors_pick);
              return picks.length > 0 ? (
                <div className="mb-12">
                  <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">&#9733;</span> Editor&apos;s Picks
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {picks.map((formula) => (
                      <Link
                        key={formula.id}
                        href={`/formulas/${formula.id}`}
                        className="group bg-gradient-to-br from-amber-50 via-cream-50 to-sage-50 rounded-2xl p-6 border-2 border-amber-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-lg font-bold text-earth-800 group-hover:text-earth-600 transition-colors">{formula.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">&#9733; Pick</span>
                        </div>
                        {getTextValue(formula.field_formula_description) && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{getTextValue(formula.field_formula_description)}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {formula.field_formula_category && (() => { const c = getFieldConfig(formulaCategoryMap, formula.field_formula_category); return c ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                          ) : null; })()}
                          {formula.field_available_premade && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Pre-made</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Featured Formulas */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {formulas.slice(0, 2).map((formula) => {
                const ingredientCount = formula.field_herb_ingredients?.length || 0;

                return (
                  <Link
                    key={formula.id}
                    href={`/formulas/${formula.id}`}
                    className="group relative bg-gradient-to-br from-cream-50 via-earth-50/50 to-sage-50/30 rounded-2xl p-8 border border-earth-200 hover:border-earth-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative flex items-start gap-5">
                      <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <FormulaIcon title={formula.title} useCases={formula.field_use_cases} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h2 className="font-serif text-2xl font-bold text-earth-800 group-hover:text-earth-600 transition-colors">
                            {formula.title}
                          </h2>
                          {ingredientCount > 0 && (
                            <Tag variant="sage" size="sm">
                              {ingredientCount} herbs
                            </Tag>
                          )}
                        </div>

                        {getTextValue(formula.field_formula_description) && (
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {getTextValue(formula.field_formula_description)}
                          </p>
                        )}

                        {formula.field_use_cases && formula.field_use_cases.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formula.field_use_cases.slice(0, 4).map((useCase, idx) => (
                              <Tag key={idx} variant="muted" size="sm">
                                {useCase}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 text-earth-600 font-medium flex items-center gap-1.5 group-hover:gap-3 transition-all">
                      View formula details
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* All Formulas Grid */}
            {formulas.length > 2 && (
              <>
                <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6">All Formulas</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                  {formulas.slice(2).map((formula) => {
                    const ingredientCount = formula.field_herb_ingredients?.length || 0;

                    return (
                      <Link
                        key={formula.id}
                        href={`/formulas/${formula.id}`}
                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 hover:border-earth-300 transition-all duration-300 overflow-hidden"
                      >
                        <div className="relative bg-gradient-to-br from-earth-50/50 via-cream-50/30 to-sage-50/20 p-5 border-b border-earth-100/50">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                              <FormulaIcon title={formula.title} useCases={formula.field_use_cases} />
                            </div>
                            {ingredientCount > 0 && (
                              <Tag variant="sage" size="sm">
                                {ingredientCount} herbs
                              </Tag>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="font-serif text-lg font-bold text-earth-800 mb-2 group-hover:text-earth-600 transition-colors">
                            {formula.title}
                          </h3>

                          {getTextValue(formula.field_formula_description) && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {getTextValue(formula.field_formula_description)}
                            </p>
                          )}

                          {formula.field_use_cases && formula.field_use_cases.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-earth-500 mb-1.5">Uses:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {formula.field_use_cases.slice(0, 2).map((useCase, idx) => (
                                  <Tag key={idx} variant="earth" size="sm">
                                    {useCase}
                                  </Tag>
                                ))}
                                {formula.field_use_cases.length > 2 && (
                                  <span className="text-xs text-earth-400 py-1">
                                    +{formula.field_use_cases.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {formula.field_total_weight && (
                            <p className="text-xs text-earth-500 mb-3">
                              Total: {formula.field_total_weight}{formula.field_total_weight_unit || 'g'}
                            </p>
                          )}

                          {/* Decision indicators */}
                          {(formula.field_editors_pick || formula.field_formula_category || formula.field_available_premade) && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {formula.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
                              {formula.field_formula_category && (() => { const c = getFieldConfig(formulaCategoryMap, formula.field_formula_category); return c ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                              ) : null; })()}
                              {formula.field_available_premade && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Pre-made</span>}
                            </div>
                          )}

                          <div className="pt-4 border-t border-earth-100">
                            <span className="text-earth-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
                              View Formula
                              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mb-12">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}

            <BotanicalDivider className="mb-12" />

            {/* Educational Section */}
            <div className="bg-gradient-to-r from-sage-50 to-earth-50 rounded-2xl p-8 border border-sage-200 mb-12">
              <div className="max-w-3xl mx-auto">
                <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6 text-center">
                  Understanding Herbal Formulas
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center flex-shrink-0 border border-gold-300">
                        <svg className="w-5 h-5 text-gold-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-earth-800">Chief Herbs</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Target the primary condition with the main therapeutic action</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center flex-shrink-0 border border-sage-300">
                        <svg className="w-5 h-5 text-sage-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-earth-800">Deputy Herbs</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Support and enhance the effects of the chief herbs</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-earth-100 to-earth-200 flex items-center justify-center flex-shrink-0 border border-earth-300">
                        <svg className="w-5 h-5 text-earth-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-earth-800">Assistant Herbs</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Balance the formula and reduce potential side effects</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cream-100 to-cream-200 flex items-center justify-center flex-shrink-0 border border-cream-300">
                        <svg className="w-5 h-5 text-earth-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-earth-800">Envoy Herbs</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Guide the formula to specific areas of the body</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative bg-gradient-to-r from-earth-600 via-earth-700 to-sage-700 rounded-2xl p-8 md:p-12 text-white text-center mb-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <LeafPattern opacity={0.3} />
              </div>
              <div className="relative">
                <h2 className="font-serif text-3xl font-bold mb-4">
                  Explore Individual Herbs
                </h2>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Learn about the individual herbs that make up these powerful formulas and their unique therapeutic properties.
                </p>
                <Link
                  href="/herbs"
                  className="inline-flex items-center gap-2 bg-white text-earth-800 px-8 py-3 rounded-xl font-semibold hover:bg-cream-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Browse Herbs Database
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <DisclaimerBox className="mb-8" />

        {/* Back Link */}
        <div className="text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
