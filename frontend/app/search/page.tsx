'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Configure,
  Stats,
  Pagination,
  useInstantSearch,
} from 'react-instantsearch';
import { searchClient, ALGOLIA_INDEX_ALL } from '@/lib/algolia';
import Link from 'next/link';
import { Loading } from '@/components/Loading';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  PageWrapper,
  LeafPattern,
  Tag,
  BackLink,
} from '@/components/ui/DesignSystem';

// Type icons mapping
const typeIcons: Record<string, string> = {
  herb: '🌿',
  modality: '🧘',
  condition: '🩺',
  practitioner: '👨‍⚕️',
  formula: '📜',
};

// Type colors mapping
const typeColors: Record<string, string> = {
  herb: 'bg-green-100 text-green-700 border-green-200',
  modality: 'bg-purple-100 text-purple-700 border-purple-200',
  condition: 'bg-blue-100 text-blue-700 border-blue-200',
  practitioner: 'bg-amber-100 text-amber-700 border-amber-200',
  formula: 'bg-earth-100 text-earth-700 border-earth-200',
};

// Custom Hit component
function Hit({ hit }: { hit: any }) {
  const icon = typeIcons[hit.type] || '📄';
  const colorClass = typeColors[hit.type] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-earth-800 dark:text-earth-300 dark:border-earth-700';

  return (
    <Link href={hit.url} className="block h-full">
      <article className="group bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-earth-700 hover:border-sage-200 dark:hover:border-earth-600 transition-all h-full overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 p-4 border-b border-gray-100 dark:border-earth-700">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-white dark:bg-earth-800 rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">{icon}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${colorClass}`}>
              {hit.type}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-earth-100 mb-2 group-hover:text-earth-600 dark:group-hover:text-earth-400 transition-colors line-clamp-1">
            {hit.title || hit.name}
          </h2>

          {hit.scientific_name && (
            <p className="text-sm italic text-sage-600 mb-2">{hit.scientific_name}</p>
          )}

          {hit.common_names && hit.common_names.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {hit.common_names.slice(0, 2).map((name: string, idx: number) => (
                  <span key={idx} className="text-xs bg-sage-100 dark:bg-earth-800 text-gray-600 dark:text-earth-300 px-2 py-0.5 rounded">
                    {name}
                  </span>
                ))}
                {hit.common_names.length > 2 && (
                  <span className="text-xs text-gray-400 dark:text-earth-500">+{hit.common_names.length - 2}</span>
                )}
              </div>
            </div>
          )}

          {hit.excels_at && hit.excels_at.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {hit.excels_at.slice(0, 2).map((item: string, idx: number) => (
                  <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hit.location && (
            <p className="text-sm text-gray-600 dark:text-earth-300 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400 dark:text-earth-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {hit.location}
            </p>
          )}

          {hit.description && (
            <p className="text-sm text-gray-600 dark:text-earth-300 line-clamp-2">{hit.description}</p>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-earth-700">
            <span className="text-sage-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Empty state component
function EmptyQueryBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { indexUiState } = useInstantSearch();

  if (!indexUiState.query) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// No results component
function NoResultsBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { results } = useInstantSearch();

  if (!results.__isArtificial && results.nbHits === 0) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-earth-900/50 dark:to-earth-950 border-b border-sage-200/50 dark:border-earth-700">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Search' },
            ]}
            className="mb-8"
          />

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-500 to-earth-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sage-600 font-medium tracking-wide uppercase text-sm">
                Search Database
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
              Search
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
              Find herbs, modalities, conditions, practitioners, and formulas in our comprehensive database.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InstantSearch
        searchClient={searchClient}
        indexName={ALGOLIA_INDEX_ALL}
        initialUiState={{
          [ALGOLIA_INDEX_ALL]: {
            query: initialQuery,
          },
        }}
      >
        <Configure hitsPerPage={12} />

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <SearchBox
              placeholder="Search for herbs, modalities, conditions..."
              classNames={{
                root: 'relative',
                form: 'relative',
                input: 'w-full pl-12 pr-12 py-4 text-lg border-2 border-earth-200 dark:border-earth-600 rounded-xl focus:border-earth-500 focus:ring-2 focus:ring-earth-500/20 focus:outline-none transition bg-white dark:bg-earth-800 dark:text-earth-100 dark:placeholder-earth-500 shadow-sm',
                submit: 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-earth-500',
                submitIcon: 'w-5 h-5',
                reset: 'absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-earth-500 hover:text-gray-600 dark:hover:text-earth-300',
                resetIcon: 'w-5 h-5',
                loadingIndicator: 'absolute right-4 top-1/2 -translate-y-1/2',
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 dark:text-earth-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter by Type
              </h3>
              <RefinementList
                attribute="type"
                classNames={{
                  root: '',
                  list: 'space-y-2',
                  item: '',
                  label: 'flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition',
                  checkbox: 'w-4 h-4 text-earth-600 border-gray-300 dark:border-earth-600 rounded focus:ring-earth-500',
                  labelText: 'text-gray-700 dark:text-earth-200 capitalize flex-1',
                  count: 'text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-400 px-2 py-0.5 rounded-full',
                  selectedItem: 'bg-sage-50 dark:bg-earth-800',
                }}
              />

              {/* TCM Temperature Facet */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-earth-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-earth-200 uppercase tracking-wide mb-3">
                  TCM Temperature
                </h3>
                <RefinementList
                  attribute="tcm_temperature"
                  classNames={{
                    root: '',
                    list: 'space-y-1',
                    item: '',
                    label: 'flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition text-sm',
                    checkbox: 'w-4 h-4 text-earth-600 border-gray-300 dark:border-earth-600 rounded focus:ring-earth-500',
                    labelText: 'text-gray-700 dark:text-earth-200 capitalize flex-1',
                    count: 'text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-400 px-2 py-0.5 rounded-full',
                    selectedItem: 'bg-sage-50 dark:bg-earth-800',
                    noResults: 'hidden',
                  }}
                />
              </div>

              {/* TCM Taste Facet */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-earth-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-earth-200 uppercase tracking-wide mb-3">
                  TCM Taste
                </h3>
                <RefinementList
                  attribute="tcm_taste"
                  classNames={{
                    root: '',
                    list: 'space-y-1',
                    item: '',
                    label: 'flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition text-sm',
                    checkbox: 'w-4 h-4 text-earth-600 border-gray-300 dark:border-earth-600 rounded focus:ring-earth-500',
                    labelText: 'text-gray-700 dark:text-earth-200 capitalize flex-1',
                    count: 'text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-400 px-2 py-0.5 rounded-full',
                    selectedItem: 'bg-sage-50 dark:bg-earth-800',
                    noResults: 'hidden',
                  }}
                />
              </div>

              {/* TCM Meridians Facet */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-earth-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-earth-200 uppercase tracking-wide mb-3">
                  TCM Meridians
                </h3>
                <RefinementList
                  attribute="tcm_meridians"
                  limit={8}
                  showMore
                  showMoreLimit={20}
                  classNames={{
                    root: '',
                    list: 'space-y-1',
                    item: '',
                    label: 'flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition text-sm',
                    checkbox: 'w-4 h-4 text-earth-600 border-gray-300 dark:border-earth-600 rounded focus:ring-earth-500',
                    labelText: 'text-gray-700 dark:text-earth-200 capitalize flex-1',
                    count: 'text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-400 px-2 py-0.5 rounded-full',
                    selectedItem: 'bg-sage-50 dark:bg-earth-800',
                    noResults: 'hidden',
                    showMore: 'text-sm text-sage-600 hover:text-sage-800 dark:text-sage-400 dark:hover:text-sage-300 font-medium mt-2 cursor-pointer',
                  }}
                />
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-earth-700">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-earth-400 uppercase tracking-wide mb-3">
                  Browse Categories
                </h4>
                <nav className="space-y-2">
                  <Link href="/herbs" className="flex items-center gap-2 text-gray-600 dark:text-earth-300 hover:text-earth-600 dark:hover:text-earth-100 transition p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800">
                    <span>🌿</span> Herbs
                  </Link>
                  <Link href="/modalities" className="flex items-center gap-2 text-gray-600 dark:text-earth-300 hover:text-earth-600 dark:hover:text-earth-100 transition p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800">
                    <span>🧘</span> Modalities
                  </Link>
                  <Link href="/conditions" className="flex items-center gap-2 text-gray-600 dark:text-earth-300 hover:text-earth-600 dark:hover:text-earth-100 transition p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800">
                    <span>🩺</span> Conditions
                  </Link>
                  <Link href="/practitioners" className="flex items-center gap-2 text-gray-600 dark:text-earth-300 hover:text-earth-600 dark:hover:text-earth-100 transition p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800">
                    <span>👨‍⚕️</span> Practitioners
                  </Link>
                  <Link href="/formulas" className="flex items-center gap-2 text-gray-600 dark:text-earth-300 hover:text-earth-600 dark:hover:text-earth-100 transition p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-earth-800">
                    <span>📜</span> Formulas
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <EmptyQueryBoundary
              fallback={
                <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 rounded-2xl p-12 text-center border border-sage-200 dark:border-earth-700">
                  <div className="text-6xl mb-6">🔍</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">
                    Start Your Search
                  </h2>
                  <p className="text-gray-600 dark:text-earth-300 max-w-md mx-auto mb-6">
                    Enter keywords above to search our database of herbs, healing modalities, health conditions, practitioners, and traditional formulas.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Tag variant="sage" size="sm">Try: &ldquo;ginger&rdquo;</Tag>
                    <Tag variant="sage" size="sm">Try: &ldquo;anxiety&rdquo;</Tag>
                    <Tag variant="sage" size="sm">Try: &ldquo;acupuncture&rdquo;</Tag>
                  </div>
                </div>
              }
            >
              <NoResultsBoundary
                fallback={
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-earth-900 dark:to-earth-950 rounded-2xl p-12 text-center border border-yellow-200 dark:border-earth-700">
                    <div className="text-6xl mb-6">🤔</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">
                      No Results Found
                    </h2>
                    <p className="text-gray-600 dark:text-earth-300 max-w-md mx-auto mb-6">
                      We couldn&apos;t find anything matching your search. Try different keywords or browse our categories.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link
                        href="/herbs"
                        className="inline-flex items-center gap-2 bg-white dark:bg-earth-800 text-gray-700 dark:text-earth-200 px-4 py-2 rounded-lg border border-earth-200 dark:border-earth-600 hover:bg-earth-50 dark:hover:bg-earth-700 transition"
                      >
                        🌿 Browse Herbs
                      </Link>
                      <Link
                        href="/conditions"
                        className="inline-flex items-center gap-2 bg-white dark:bg-earth-800 text-gray-700 dark:text-earth-200 px-4 py-2 rounded-lg border border-earth-200 dark:border-earth-600 hover:bg-earth-50 dark:hover:bg-earth-700 transition"
                      >
                        🩺 Browse Conditions
                      </Link>
                    </div>
                  </div>
                }
              >
                {/* Results Stats */}
                <div className="flex items-center justify-between mb-6">
                  <Stats
                    classNames={{
                      root: 'text-sm text-gray-600 dark:text-earth-300',
                    }}
                    translations={{
                      rootElementText({ nbHits, processingTimeMS }) {
                        return `${nbHits.toLocaleString()} result${nbHits !== 1 ? 's' : ''} found in ${processingTimeMS}ms`;
                      },
                    }}
                  />
                </div>

                {/* Results Grid */}
                <Hits
                  hitComponent={Hit}
                  classNames={{
                    root: '',
                    list: 'grid md:grid-cols-2 xl:grid-cols-3 gap-6',
                    item: '',
                  }}
                />

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <Pagination
                    classNames={{
                      root: '',
                      list: 'flex items-center gap-1',
                      item: '',
                      link: 'px-4 py-2 rounded-lg text-gray-700 dark:text-earth-200 hover:bg-sage-100 dark:hover:bg-earth-800 transition',
                      selectedItem: '',
                      disabledItem: 'opacity-50 cursor-not-allowed',
                      firstPageItem: '',
                      lastPageItem: '',
                      previousPageItem: '',
                      nextPageItem: '',
                      pageItem: '',
                    }}
                    translations={{
                      firstPageItemText: '«',
                      previousPageItemText: '‹',
                      nextPageItemText: '›',
                      lastPageItemText: '»',
                      pageItemText({ currentPage }) {
                        return String(currentPage);
                      },
                      firstPageItemAriaLabel: 'First page',
                      previousPageItemAriaLabel: 'Previous page',
                      nextPageItemAriaLabel: 'Next page',
                      lastPageItemAriaLabel: 'Last page',
                      pageItemAriaLabel({ currentPage }) {
                        return `Page ${currentPage}`;
                      },
                    }}
                  />
                </div>
              </NoResultsBoundary>
            </EmptyQueryBoundary>
          </div>
        </div>
      </InstantSearch>

      <BackLink href="/" label="Return to Home" />
      </div>
    </PageWrapper>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  );
}
