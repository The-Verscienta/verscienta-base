import { Suspense } from 'react';
import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import { EmptyState, PageWrapper, LeafPattern, BotanicalDivider, DisclaimerBox, BackLink } from '@/components/ui/DesignSystem';
import { ConceptCard } from '@/components/concept/ConceptCard';
import { ConceptCategoryFilterBar } from '@/components/concept/ConceptCategoryFilterBar';
import { TcmConceptCardSkeleton } from '@/components/concept/LoadingSkeletons';
import type { TcmConceptEntity, TcmConceptListItem } from '@/types/drupal';

export const revalidate = 300;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'title',                    label: 'Name (A–Z)' },
  { value: '-title',                   label: 'Name (Z–A)' },
  { value: 'field_concept_category',   label: 'Category' },
  { value: '-created',                 label: 'Newest First' },
];

export const metadata = {
  title: 'TCM Concepts Database — Verscienta Health',
  description:
    'Explore fundamental TCM theoretical concepts: Fundamental Substances, Pathogenic Factors, Diagnostic Frameworks, Five Element Theory, Treatment Methods, and Constitutional Theory.',
};

interface ConceptsResult {
  concepts: TcmConceptListItem[];
  total: number;
}

async function getConcepts(sort: string, page: number, category: string): Promise<ConceptsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const params: Record<string, string | number> = {
      sort,
      'page[limit]': PAGE_SIZE,
      'page[offset]': offset,
      'filter[status]': 1,
      'fields[node--tcm_concept]':
        'id,title,field_concept_chinese_name,field_concept_pinyin_name,' +
        'field_concept_category,field_popularity,field_editors_pick',
      include: 'field_concept_category',
      'fields[taxonomy_term--concept_category]': 'id,name',
    };
    if (category) {
      params['filter[field_concept_category.name]'] = category;
    }

    const countParams: Record<string, string | number> = {
      'filter[status]': 1,
      'fields[node--tcm_concept]': 'id',
      'page[limit]': 500,
    };
    if (category) {
      countParams['filter[field_concept_category.name]'] = category;
    }

    const [list, all] = await Promise.all([
      drupal.getResourceCollection<TcmConceptEntity[]>('node--tcm_concept', { params }),
      drupal.getResourceCollection<TcmConceptEntity[]>('node--tcm_concept', { params: countParams }),
    ]);

    const concepts: TcmConceptListItem[] = (list ?? []).map(c => ({
      id: c.id,
      title: c.title,
      chineseName: c.field_concept_chinese_name,
      pinyinName: c.field_concept_pinyin_name,
      category: c.field_concept_category?.name,
      popularity: c.field_popularity,
      editorsPick: c.field_editors_pick,
    }));

    return { concepts, total: (all ?? []).length };
  } catch (err) {
    console.error('Failed to fetch TCM concepts:', err);
    return { concepts: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string; category?: string }>;
}

export default async function ConceptsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort ?? 'title';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const category = params.category ?? '';

  const { concepts, total } = await getConcepts(sort, currentPage, category);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const picks = concepts.filter(c => c.editorsPick);

  return (
    <PageWrapper>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50/40 to-cream-100 dark:from-violet-950 dark:via-purple-950/60 dark:to-earth-900 border-b border-violet-200/50 dark:border-violet-800/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-16 right-20 w-56 h-56 bg-violet-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'TCM Concepts' }]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-violet-700 dark:text-violet-400 font-medium tracking-wide uppercase text-sm">
                  TCM Theory Database
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
                TCM Concepts
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
                Explore the theoretical foundations of Traditional Chinese Medicine — from Fundamental Substances
                and Pathogenic Factors to Diagnostic Frameworks and Five Element Theory.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 dark:bg-earth-900/80 backdrop-blur-sm rounded-xl p-4 border border-violet-200/50 dark:border-violet-800/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="title" />
              <div className="hidden sm:block w-px h-8 bg-earth-200 dark:bg-earth-700" />
              <PaginationInfo currentPage={currentPage} pageSize={PAGE_SIZE} totalItems={total} />
            </div>
          </div>

          {/* Category filter bar */}
          <Suspense fallback={null}>
            <ConceptCategoryFilterBar activeCategory={category || undefined} />
          </Suspense>

          {category && (
            <p className="mt-3 text-sm text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 4h12m-9 4h6" />
              </svg>
              Filtered by: <strong>{category}</strong> — {total} concept{total !== 1 ? 's' : ''}
              <Link href="/concepts" className="ml-2 underline hover:no-underline">Clear filter</Link>
            </p>
          )}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {concepts.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title="No TCM Concepts Found"
            description={
              category
                ? `No concepts found for "${category}". Try a different category or clear the filter.`
                : 'The TCM concepts database is being curated. Check back soon.'
            }
            action={
              category ? (
                <Link
                  href="/concepts"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  View All Concepts
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Editor's Picks */}
            {picks.length > 0 && (
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6 flex items-center gap-2">
                  <span className="text-amber-500">★</span> Essential Concepts
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {picks.map(concept => (
                    <ConceptCard key={concept.id} concept={concept} />
                  ))}
                </div>
              </section>
            )}

            {/* All Concepts Grid */}
            <section>
              {picks.length > 0 && (
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6">
                  {category ? `${category} Concepts` : 'All Concepts'}
                </h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {(picks.length > 0 ? concepts.filter(c => !c.editorsPick) : concepts).map(concept => (
                  <ConceptCard key={concept.id} concept={concept} />
                ))}
                {concepts.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                  <TcmConceptCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {totalPages > 1 && (
              <div className="mb-12">
                <ServerPagination currentPage={currentPage} totalPages={totalPages} />
              </div>
            )}

            <BotanicalDivider className="mb-12" />

            {/* Educational blurb */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-2xl p-8 border border-violet-200 dark:border-violet-800 mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">
                  About TCM Theory
                </h2>
                <p className="text-gray-600 dark:text-earth-300 leading-relaxed mb-4">
                  Traditional Chinese Medicine is built on a rich theoretical framework developed over millennia.
                  These concepts — from Qi and Blood as Fundamental Substances, to Wind and Dampness as Pathogenic Factors,
                  to the Five Element correspondences — provide the conceptual tools practitioners use to understand
                  health and disease and guide treatment.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link href="/patterns" className="text-sm font-medium text-violet-700 dark:text-violet-400 hover:underline">
                    Browse Patterns →
                  </Link>
                  <Link href="/formulas" className="text-sm font-medium text-violet-700 dark:text-violet-400 hover:underline">
                    Browse Formulas →
                  </Link>
                  <Link href="/herbs" className="text-sm font-medium text-violet-700 dark:text-violet-400 hover:underline">
                    Browse Herbs →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <DisclaimerBox className="mb-8" />
        <div className="text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
