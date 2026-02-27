import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Tag,
  EmptyState,
  BackLink,
} from '@/components/ui/DesignSystem';

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
  title: 'Holistic Health Modalities - Verscienta Health',
  description: 'Discover various holistic health practices and therapeutic modalities that can support your wellness journey.',
};

interface Modality {
  id: string;
  type: string;
  title: string;
  field_excels_at?: string[];
  field_self_practice?: boolean;
  field_session_cost_range?: string;
  field_editors_pick?: boolean;
  body?: {
    value: string;
    summary?: string;
    processed?: string;
  };
}

// Modality SVG icon component
function ModalityIcon({ type }: { type: string }) {
  const lowerType = type.toLowerCase();

  // Choose gradient based on modality type
  let gradientId = 'modalityGrad';
  let color1 = '#4a7c59';
  let color2 = '#6b8f71';

  if (lowerType.includes('acupuncture') || lowerType.includes('chinese')) {
    color1 = '#8B4513';
    color2 = '#A0522D';
  } else if (lowerType.includes('yoga') || lowerType.includes('meditation')) {
    color1 = '#6B5B95';
    color2 = '#967BB6';
  } else if (lowerType.includes('massage') || lowerType.includes('bodywork')) {
    color1 = '#708090';
    color2 = '#778899';
  }

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="20" fill={`url(#${gradientId})`} opacity="0.1" />
      <path
        d="M24 12c-6 4-10 8-10 14a10 10 0 0020 0c0-6-4-10-10-14z"
        fill={`url(#${gradientId})`}
        opacity="0.25"
      />
      <circle cx="24" cy="22" r="6" stroke={`url(#${gradientId})`} strokeWidth="2" fill="none" />
      <path d="M24 16v-4M24 32v4M18 22h-4M30 22h4" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface ModalitiesResult {
  modalities: Modality[];
  total: number;
}

async function getModalities(sort: string = 'title', page: number = 1): Promise<ModalitiesResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const modalities = await drupal.getResourceCollection<Modality[]>('node--modality', {
      params: {
        'sort': sort,
        'page[limit]': PAGE_SIZE,
        'page[offset]': offset,
        'filter[status]': 1,
      },
    });

    const allModalities = await drupal.getResourceCollection<Modality[]>('node--modality', {
      params: {
        'filter[status]': 1,
        'fields[node--modality]': 'id',
        'page[limit]': 500,
      },
    });

    return {
      modalities: modalities || [],
      total: allModalities?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch modalities:', error);
    return { modalities: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function ModalitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'title';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { modalities, total } = await getModalities(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Group modalities by what they excel at
  const excellenceCategories: Record<string, number> = {};
  modalities.forEach(modality => {
    modality.field_excels_at?.forEach(item => {
      excellenceCategories[item] = (excellenceCategories[item] || 0) + 1;
    });
  });

  // Get top categories
  const topCategories = Object.entries(excellenceCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-sage-50 via-earth-50/50 to-cream-100 dark:from-earth-950 dark:via-sage-950 dark:to-earth-900 border-b border-sage-200/50 dark:border-earth-700/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative elements */}
        <div className="absolute top-16 left-16 w-56 h-56 bg-sage-300/15 dark:bg-sage-800/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-earth-300/20 dark:bg-earth-800/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Modalities' },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-sage-600 dark:text-sage-400 font-medium tracking-wide uppercase text-sm">
                  Healing Practices
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
                Holistic Modalities
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
                Explore therapeutic practices and healing modalities that nurture mind, body, and spirit
                through time-honored wisdom and modern understanding.
              </p>

              {/* Category highlights */}
              {topCategories.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-sage-600 dark:text-sage-400 font-medium mr-1">Popular for:</span>
                  {topCategories.map(([category, count]) => (
                    <Tag key={category} variant="sage" size="sm">
                      {category} ({count})
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 dark:bg-earth-900/60 backdrop-blur-sm rounded-xl p-4 border border-sage-200/50 dark:border-earth-700/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="title" />
              <div className="hidden sm:block w-px h-8 bg-sage-200" />
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
        {modalities.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            title="No Modalities Found"
            description="Our healing modalities database is being curated. Check back soon for comprehensive information on holistic practices."
            action={
              <a
                href="https://backend.ddev.site/node/add/modality"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Add Modalities
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
              const picks = modalities.filter(m => m.field_editors_pick);
              return picks.length > 0 ? (
                <div className="mb-12">
                  <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">&#9733;</span> Editor&apos;s Picks
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {picks.map((modality) => {
                      const summary = modality.body?.summary || modality.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 150);
                      return (
                        <Link
                          key={modality.id}
                          href={`/modalities/${modality.id}`}
                          className="group bg-gradient-to-br from-amber-50 via-cream-50 to-sage-50 dark:from-amber-950/20 dark:via-earth-900 dark:to-sage-950 rounded-2xl p-6 border-2 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 group-hover:text-sage-700 transition-colors">{modality.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200">&#9733; Pick</span>
                          </div>
                          {summary && <p className="text-sm text-gray-600 dark:text-earth-300 line-clamp-2 mb-3">{summary}...</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {modality.field_self_practice && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Self-Practice</span>}
                            {modality.field_session_cost_range && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{modality.field_session_cost_range}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Featured Modalities */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {modalities.slice(0, 2).map((modality) => {
                const summary = modality.body?.summary ||
                  modality.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 200);

                return (
                  <Link
                    key={modality.id}
                    href={`/modalities/${modality.id}`}
                    className="group relative bg-gradient-to-br from-cream-50 via-sage-50/50 to-earth-50/30 dark:from-earth-950 dark:via-sage-950 dark:to-earth-900 rounded-2xl p-8 border border-sage-200 hover:border-sage-300 dark:border-earth-700 dark:hover:border-sage-700 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >

                    <div className="relative flex items-start gap-5">
                      <div className="w-16 h-16 bg-white dark:bg-earth-800 rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                        <ModalityIcon type={modality.title} />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-2 group-hover:text-sage-700 transition-colors">
                          {modality.title}
                        </h2>
                        {summary && (
                          <p className="text-gray-600 dark:text-earth-300 mb-4 line-clamp-2 leading-relaxed">
                            {summary}...
                          </p>
                        )}
                        {modality.field_excels_at && modality.field_excels_at.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {modality.field_excels_at.slice(0, 4).map((item, idx) => (
                              <Tag key={idx} variant="muted" size="sm">
                                {item}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 text-sage-600 font-medium flex items-center gap-1.5 group-hover:gap-3 transition-all">
                      Explore this modality
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* All Modalities Grid */}
            {modalities.length > 2 && (
              <>
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6">All Modalities</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                  {modalities.slice(2).map((modality) => {
                    const summary = modality.body?.summary ||
                      modality.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 100);

                    return (
                      <Link
                        key={modality.id}
                        href={`/modalities/${modality.id}`}
                        className="group relative bg-white dark:bg-earth-900 rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 hover:border-sage-300 dark:border-earth-700 dark:hover:border-sage-700 transition-all duration-300 overflow-hidden"
                      >

                        <div className="relative bg-gradient-to-br from-sage-50/50 via-cream-50/30 to-earth-50/20 dark:from-sage-900/20 dark:via-earth-900 dark:to-earth-900 p-6 border-b border-earth-100/50 dark:border-earth-700/50">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 bg-white dark:bg-earth-800 rounded-xl shadow-md flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                              <ModalityIcon type={modality.title} />
                            </div>
                            {modality.field_excels_at && modality.field_excels_at.length > 0 && (
                              <Tag variant="sage" size="sm">
                                {modality.field_excels_at.length} benefits
                              </Tag>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-2 group-hover:text-sage-700 transition-colors">
                            {modality.title}
                          </h3>

                          {summary && (
                            <p className="text-sm text-gray-600 dark:text-earth-300 mb-4 line-clamp-2 leading-relaxed">
                              {summary}...
                            </p>
                          )}

                          {modality.field_excels_at && modality.field_excels_at.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {modality.field_excels_at.slice(0, 2).map((item, idx) => (
                                <Tag key={idx} variant="muted" size="sm">
                                  {item}
                                </Tag>
                              ))}
                            </div>
                          )}

                          {/* Decision indicators */}
                          {(modality.field_editors_pick || modality.field_self_practice || modality.field_session_cost_range) && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {modality.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">&#9733; Pick</span>}
                              {modality.field_self_practice && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Self-Practice</span>}
                              {modality.field_session_cost_range && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{modality.field_session_cost_range}</span>}
                            </div>
                          )}

                          <div className="pt-4 border-t border-earth-100 dark:border-earth-700">
                            <span className="text-sage-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
                              Learn More
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
            <div className="relative bg-gradient-to-r from-sage-600 via-sage-700 to-earth-700 rounded-2xl p-8 md:p-12 text-white text-center mb-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <LeafPattern opacity={0.3} />
              </div>
              <div className="relative">
                <h2 className="font-serif text-3xl font-bold mb-4">
                  Find the Right Practitioner
                </h2>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Ready to experience a holistic modality? Connect with verified practitioners
                  who specialize in these time-honored healing arts.
                </p>
                <Link
                  href="/practitioners"
                  className="inline-flex items-center gap-2 bg-white text-gray-800 px-8 py-3 rounded-xl font-semibold hover:bg-cream-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Browse Practitioners
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Guidance Box */}
        <div className="bg-gradient-to-r from-sage-50 to-earth-50 border border-sage-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif font-semibold text-sage-800 mb-1">Finding Your Path</h3>
              <p className="text-sm text-sage-700 leading-relaxed">
                Each modality offers unique benefits and approaches to wellness. Consider trying multiple
                modalities to discover what resonates best with your body and health goals.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
