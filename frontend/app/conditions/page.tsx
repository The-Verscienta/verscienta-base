import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import type { ConditionEntity } from '@/types/drupal';
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Tag,
  EmptyState,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { selfTreatableMap, getFieldConfig } from '@/lib/decision-field-maps';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

const SORT_OPTIONS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: '-title', label: 'Name (Z-A)' },
  { value: '-created', label: 'Newest First' },
  { value: 'created', label: 'Oldest First' },
];

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Health Conditions Database - Verscienta Health',
  description: 'Explore health conditions and discover natural approaches for managing them with holistic modalities and herbal remedies.',
};

// Severity tag variants
const severityVariants: Record<string, 'sage' | 'gold' | 'warm'> = {
  mild: 'sage',
  moderate: 'gold',
  severe: 'warm',
};

// Condition SVG icon component
function ConditionIcon({ title }: { title: string }) {
  const lowerTitle = title.toLowerCase();

  let color1 = '#4a7c59';
  let color2 = '#6b8f71';

  if (lowerTitle.includes('anxiety') || lowerTitle.includes('stress') || lowerTitle.includes('mental')) {
    color1 = '#6B5B95';
    color2 = '#967BB6';
  } else if (lowerTitle.includes('heart') || lowerTitle.includes('cardio')) {
    color1 = '#C25B56';
    color2 = '#D88C88';
  } else if (lowerTitle.includes('sleep') || lowerTitle.includes('insomnia')) {
    color1 = '#4A6FA5';
    color2 = '#6B8FB5';
  } else if (lowerTitle.includes('pain') || lowerTitle.includes('arthritis')) {
    color1 = '#C97A40';
    color2 = '#D9A070';
  }

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="20" fill={`url(#condGrad-${title.slice(0,3)})`} opacity="0.1" />
      <path
        d="M24 8C18 12 14 18 14 24a10 10 0 0020 0c0-6-4-12-10-16z"
        fill={`url(#condGrad-${title.slice(0,3)})`}
        opacity="0.25"
      />
      <circle cx="24" cy="24" r="4" fill={`url(#condGrad-${title.slice(0,3)})`} opacity="0.5" />
      <path
        d="M24 16v4M24 28v4M18 24h-4M30 24h4M20 20l-2-2M28 20l2-2M20 28l-2 2M28 28l2 2"
        stroke={`url(#condGrad-${title.slice(0,3)})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={`condGrad-${title.slice(0,3)}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface ConditionsResult {
  conditions: ConditionEntity[];
  total: number;
}

async function getConditions(sort: string = 'title', page: number = 1): Promise<ConditionsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const conditions = await drupal.getResourceCollection<ConditionEntity[]>('node--condition', {
      params: {
        'sort': sort,
        'page[limit]': PAGE_SIZE,
        'page[offset]': offset,
        'filter[status]': 1,
      },
    });

    const allConditions = await drupal.getResourceCollection<ConditionEntity[]>('node--condition', {
      params: {
        'filter[status]': 1,
        'fields[node--condition]': 'id',
        'page[limit]': 500,
      },
    });

    return {
      conditions: conditions || [],
      total: allConditions?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch conditions:', error);
    return { conditions: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function ConditionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'title';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { conditions, total } = await getConditions(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Group conditions by severity for stats
  const severityCounts: Record<string, number> = {};
  conditions.forEach(condition => {
    if (condition.field_severity) {
      severityCounts[condition.field_severity] = (severityCounts[condition.field_severity] || 0) + 1;
    }
  });

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-cream-50/50 to-sage-50/30 border-b border-earth-200/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-56 h-56 bg-earth-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-16 w-48 h-48 bg-sage-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Conditions' },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-earth-500 to-earth-700 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-earth-600 font-medium tracking-wide uppercase text-sm">
                  Health Library
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-earth-900 mb-4 leading-tight">
                Health Conditions
              </h1>

              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Explore health conditions and discover natural approaches for managing them
                through holistic modalities and herbal remedies.
              </p>

              {/* Severity stats */}
              {Object.keys(severityCounts).length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-earth-600 font-medium mr-1">By severity:</span>
                  {Object.entries(severityCounts).map(([severity, count]) => (
                    <Tag
                      key={severity}
                      variant={severityVariants[severity.toLowerCase()] || 'muted'}
                      size="sm"
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)} ({count})
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
        {conditions.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-earth-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No Conditions Found"
            description="Our health conditions database is being developed. Check back soon for comprehensive wellness information."
            action={
              <a
                href="https://backend.ddev.site/node/add/condition"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-earth-600 to-sage-600 hover:from-earth-700 hover:to-sage-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Add Conditions
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
              const picks = conditions.filter(c => c.field_editors_pick);
              return picks.length > 0 ? (
                <div className="mb-12">
                  <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">&#9733;</span> Editor&apos;s Picks
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {picks.map((condition) => (
                      <Link
                        key={condition.id}
                        href={`/conditions/${condition.id}`}
                        className="group bg-gradient-to-br from-amber-50 via-cream-50 to-sage-50 rounded-2xl p-6 border-2 border-amber-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif text-lg font-bold text-earth-800 group-hover:text-earth-600 transition-colors">{condition.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">&#9733; Pick</span>
                        </div>
                        {condition.field_quick_summary && <p className="text-sm text-gray-600 mb-3">{condition.field_quick_summary}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {condition.field_self_treatable && (() => { const c = getFieldConfig(selfTreatableMap, condition.field_self_treatable); return c ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                          ) : null; })()}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Featured Conditions */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {conditions.slice(0, 2).map((condition) => {
                const summary = condition.body?.value?.replace(/<[^>]*>/g, '').slice(0, 200);

                return (
                  <Link
                    key={condition.id}
                    href={`/conditions/${condition.id}`}
                    className="group relative bg-gradient-to-br from-cream-50 via-earth-50/50 to-sage-50/30 rounded-2xl p-8 border border-earth-200 hover:border-earth-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >

                    <div className="relative flex items-start gap-5">
                      <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <ConditionIcon title={condition.title} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h2 className="font-serif text-2xl font-bold text-earth-800 group-hover:text-earth-600 transition-colors">
                            {condition.title}
                          </h2>
                          {condition.field_severity && (
                            <Tag
                              variant={severityVariants[condition.field_severity.toLowerCase()] || 'muted'}
                              size="sm"
                            >
                              {condition.field_severity.charAt(0).toUpperCase() + condition.field_severity.slice(1)}
                            </Tag>
                          )}
                        </div>
                        {summary && (
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {summary}...
                          </p>
                        )}
                        {condition.field_symptoms && condition.field_symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {condition.field_symptoms.slice(0, 4).map((symptom, idx) => (
                              <Tag key={idx} variant="muted" size="sm">
                                {symptom}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 text-earth-600 font-medium flex items-center gap-1.5 group-hover:gap-3 transition-all">
                      Learn about treatments
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* All Conditions Grid */}
            {conditions.length > 2 && (
              <>
                <h2 className="font-serif text-2xl font-bold text-earth-800 mb-6">All Conditions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                  {conditions.slice(2).map((condition) => {
                    const summary = condition.body?.value?.replace(/<[^>]*>/g, '').slice(0, 100);

                    return (
                      <Link
                        key={condition.id}
                        href={`/conditions/${condition.id}`}
                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 hover:border-earth-300 transition-all duration-300 overflow-hidden"
                      >

                        <div className="relative bg-gradient-to-br from-earth-50/50 via-cream-50/30 to-sage-50/20 p-5 border-b border-earth-100/50">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                              <ConditionIcon title={condition.title} />
                            </div>
                            {condition.field_severity && (
                              <Tag
                                variant={severityVariants[condition.field_severity.toLowerCase()] || 'muted'}
                                size="sm"
                              >
                                {condition.field_severity.charAt(0).toUpperCase() + condition.field_severity.slice(1)}
                              </Tag>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="font-serif text-lg font-bold text-earth-800 mb-2 group-hover:text-earth-600 transition-colors">
                            {condition.title}
                          </h3>

                          {summary && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {summary}...
                            </p>
                          )}

                          {condition.field_symptoms && condition.field_symptoms.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-earth-500 mb-1.5">Symptoms:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {condition.field_symptoms.slice(0, 2).map((symptom, idx) => (
                                  <Tag key={idx} variant="sage" size="sm">
                                    {symptom}
                                  </Tag>
                                ))}
                                {condition.field_symptoms.length > 2 && (
                                  <span className="text-xs text-earth-400 py-1">
                                    +{condition.field_symptoms.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Decision indicators */}
                          {(condition.field_editors_pick || condition.field_self_treatable || condition.field_quick_summary) && (
                            <div className="mb-3">
                              {condition.field_quick_summary && (
                                <p className="text-xs text-earth-500 mb-2 line-clamp-1">{condition.field_quick_summary}</p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {condition.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
                                {condition.field_self_treatable && (() => { const c = getFieldConfig(selfTreatableMap, condition.field_self_treatable); return c ? (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                                ) : null; })()}
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-earth-100">
                            <span className="text-earth-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
                              View Details
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

            {/* CTA Section */}
            <div className="relative bg-gradient-to-r from-earth-600 via-earth-700 to-sage-700 rounded-2xl p-8 md:p-12 text-white text-center mb-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <LeafPattern opacity={0.3} />
              </div>
              <div className="relative">
                <h2 className="font-serif text-3xl font-bold mb-4">
                  Check Your Symptoms
                </h2>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Use our AI-powered symptom checker to get personalized holistic health recommendations
                  based on your unique symptoms.
                </p>
                <Link
                  href="/symptom-checker"
                  className="inline-flex items-center gap-2 bg-white text-earth-800 px-8 py-3 rounded-xl font-semibold hover:bg-cream-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Try Symptom Checker
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
